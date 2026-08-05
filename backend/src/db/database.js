import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { modules } from "../data/modules.js";
import { initializeDomainSchema } from "./domain-schema.js";

const schema = `
  CREATE TABLE IF NOT EXISTS platform_modules (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    short_title TEXT NOT NULL,
    description TEXT NOT NULL,
    route TEXT NOT NULL UNIQUE,
    enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    organization_type TEXT NOT NULL,
    unified_social_credit_code TEXT UNIQUE,
    contact_name TEXT,
    contact_phone TEXT,
    status TEXT NOT NULL DEFAULT '正常',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS grain_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_no TEXT NOT NULL UNIQUE,
    variety TEXT NOT NULL,
    origin TEXT NOT NULL,
    weight_tons REAL NOT NULL CHECK (weight_tons >= 0),
    quality_grade TEXT,
    owner_organization_id INTEGER,
    status TEXT NOT NULL DEFAULT '待发运',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS transport_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT NOT NULL UNIQUE,
    grain_batch_id INTEGER NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    transport_mode TEXT NOT NULL,
    planned_departure TEXT,
    status TEXT NOT NULL DEFAULT '待调度',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (grain_batch_id) REFERENCES grain_batches(id)
  );

  CREATE INDEX IF NOT EXISTS idx_grain_batches_owner
    ON grain_batches(owner_organization_id);
  CREATE INDEX IF NOT EXISTS idx_transport_orders_batch
    ON transport_orders(grain_batch_id);
`;

function seedDatabase(database) {
  const insertModule = database.prepare(`
    INSERT INTO platform_modules (id, title, short_title, description, route)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      short_title = excluded.short_title,
      description = excluded.description,
      route = excluded.route,
      updated_at = CURRENT_TIMESTAMP
  `);

  for (const module of modules) {
    insertModule.run(
      module.id,
      module.title,
      module.shortTitle,
      module.description,
      module.route,
    );
  }

  const organizationCount = database
    .prepare("SELECT COUNT(*) AS count FROM organizations")
    .get().count;

  if (organizationCount === 0) {
    const insertOrganization = database.prepare(`
      INSERT INTO organizations
        (name, organization_type, unified_social_credit_code, contact_name, contact_phone)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertOrganization.run("北粮集团有限公司", "粮食供应商", "91230100BLNY000001", "张经理", "13800000001");
    insertOrganization.run("东北粮运物流有限公司", "物流承运商", "91230100BLNY000002", "李经理", "13800000002");
    insertOrganization.run("营口港仓储有限公司", "港口仓储", "91210800BLNY000003", "王经理", "13800000003");
  }

  const batchCount = database.prepare("SELECT COUNT(*) AS count FROM grain_batches").get().count;
  if (batchCount === 0) {
    const ownerId = database
      .prepare("SELECT id FROM organizations ORDER BY id LIMIT 1")
      .get().id;
    database.prepare(`
      INSERT INTO grain_batches
        (batch_no, variety, origin, weight_tons, quality_grade, owner_organization_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run("BLNY-2026-0001", "玉米", "黑龙江绥化", 3000, "一等", ownerId, "运输中");
  }

  const orderCount = database.prepare("SELECT COUNT(*) AS count FROM transport_orders").get().count;
  if (orderCount === 0) {
    const batchId = database.prepare("SELECT id FROM grain_batches ORDER BY id LIMIT 1").get().id;
    database.prepare(`
      INSERT INTO transport_orders
        (order_no, grain_batch_id, origin, destination, transport_mode, planned_departure, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run("TO-2026-0001", batchId, "黑龙江绥化", "广东东莞", "公铁海多式联运", "2026-07-29 06:00", "运输中");
  }
}

export function openDatabase(databasePath) {
  if (databasePath !== ":memory:") {
    mkdirSync(dirname(databasePath), { recursive: true });
  }

  const database = new DatabaseSync(databasePath);
  database.exec("PRAGMA foreign_keys = ON;");
  if (databasePath !== ":memory:") database.exec("PRAGMA journal_mode = WAL;");

  database.exec("BEGIN;");
  try {
    database.exec(schema);
    seedDatabase(database);
    initializeDomainSchema(database);
    database.exec("COMMIT;");
  } catch (error) {
    database.exec("ROLLBACK;");
    database.close();
    throw error;
  }

  return database;
}
