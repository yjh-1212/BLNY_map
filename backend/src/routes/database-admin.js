import { Router } from "express";
import { adminTables, getAdminTable, quoteIdentifier } from "../db/admin-tables.js";

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function isLoopback(address = "") {
  return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}

function getColumns(database, tableName) {
  return database.prepare(`PRAGMA table_info(${quoteIdentifier(tableName)})`).all();
}

function serializeColumn(column, definition = { readOnly: false }) {
  return {
    name: column.name,
    type: column.type,
    notNull: Boolean(column.notnull),
    primaryKey: Boolean(column.pk),
    defaultValue: column.dflt_value,
    editable:
      !definition.readOnly &&
      !column.pk &&
      !["created_at", "updated_at"].includes(column.name),
  };
}

function parsePagination(query) {
  const requestedLimit = Number.parseInt(query.limit || "50", 10);
  const requestedOffset = Number.parseInt(query.offset || "0", 10);
  return {
    limit: Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 200) : 50,
    offset: Number.isFinite(requestedOffset) ? Math.max(requestedOffset, 0) : 0,
  };
}

function normalizeValue(value, column) {
  if (value === null) return null;
  if (typeof value === "string" && value.trim() === "" && !column.notnull) return null;
  const type = column.type.toUpperCase();
  if (type.includes("INT")) {
    const number = Number(value);
    if (!Number.isInteger(number)) throw new HttpError(400, `${column.name} 必须是整数`);
    return number;
  }
  if (["REAL", "FLOA", "DOUB", "NUM"].some((token) => type.includes(token))) {
    const number = Number(value);
    if (!Number.isFinite(number)) throw new HttpError(400, `${column.name} 必须是数字`);
    return number;
  }
  return String(value);
}

function pickEditableValues(body, columns, definition, { omitBlank = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "请求体必须是 JSON 对象");
  }

  const editable = new Map(
    columns
      .filter((column) => serializeColumn(column, definition).editable)
      .map((column) => [column.name, column]),
  );
  const values = {};
  for (const [name, value] of Object.entries(body)) {
    const column = editable.get(name);
    if (!column) continue;
    if (omitBlank && value === "") continue;
    values[name] = normalizeValue(value, column);
  }
  return values;
}

function requireTable(request) {
  const definition = getAdminTable(request.params.table);
  if (!definition) throw new HttpError(404, "数据表不存在或不允许管理");
  return definition;
}

function getRow(database, tableName, id) {
  return database
    .prepare(`SELECT * FROM ${quoteIdentifier(tableName)} WHERE ${quoteIdentifier("id")} = ?`)
    .get(id);
}

export function createDatabaseAdminRouter({ database, enabled }) {
  const router = Router();

  router.use((request, response, next) => {
    if (!enabled) {
      response.status(404).json({ error: "Not Found", message: "数据库管理功能未启用" });
      return;
    }
    if (!isLoopback(request.socket.remoteAddress)) {
      response.status(403).json({ error: "Forbidden", message: "数据库管理功能仅允许本机访问" });
      return;
    }
    response.set("Cache-Control", "no-store");
    next();
  });

  router.get("/tables", (_request, response) => {
    const items = Object.entries(adminTables).map(([name, definition]) => {
      const count = database.prepare(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(name)}`).get().count;
      return {
        name,
        label: definition.label,
        readOnly: definition.readOnly,
        total: count,
        columns: getColumns(database, name).map((column) => serializeColumn(column, definition)),
      };
    });
    response.json({ items, total: items.length });
  });

  router.get("/tables/:table", (request, response) => {
    const definition = requireTable(request);
    const tableName = request.params.table;
    const { limit, offset } = parsePagination(request.query);
    const search = String(request.query.search || "").trim();
    const where = search
      ? ` WHERE ${definition.searchableColumns.map((name) => `CAST(${quoteIdentifier(name)} AS TEXT) LIKE ?`).join(" OR ")}`
      : "";
    const parameters = search ? definition.searchableColumns.map(() => `%${search}%`) : [];
    const total = database
      .prepare(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(tableName)}${where}`)
      .get(...parameters).count;
    const items = database
      .prepare(`SELECT * FROM ${quoteIdentifier(tableName)}${where} ORDER BY 1 DESC LIMIT ? OFFSET ?`)
      .all(...parameters, limit, offset);
    response.json({ items, total, limit, offset });
  });

  router.post("/tables/:table", (request, response) => {
    const definition = requireTable(request);
    if (definition.readOnly) throw new HttpError(403, "该数据表为只读表");
    const tableName = request.params.table;
    const columns = getColumns(database, tableName);
    const values = pickEditableValues(request.body, columns, definition, { omitBlank: true });
    const names = Object.keys(values);
    if (names.length === 0) throw new HttpError(400, "没有可写入的字段");
    const result = database.prepare(`
      INSERT INTO ${quoteIdentifier(tableName)} (${names.map(quoteIdentifier).join(", ")})
      VALUES (${names.map(() => "?").join(", ")})
    `).run(...Object.values(values));
    response.status(201).json({ item: getRow(database, tableName, result.lastInsertRowid) });
  });

  router.patch("/tables/:table/:id", (request, response) => {
    const definition = requireTable(request);
    if (definition.readOnly) throw new HttpError(403, "该数据表为只读表");
    const tableName = request.params.table;
    const current = getRow(database, tableName, request.params.id);
    if (!current) throw new HttpError(404, "记录不存在");
    const columns = getColumns(database, tableName);
    const values = pickEditableValues(request.body, columns, definition);
    if (columns.some((column) => column.name === "updated_at")) {
      values.updated_at = new Date().toISOString();
    }
    const names = Object.keys(values);
    if (names.length === 0) throw new HttpError(400, "没有可更新的字段");
    database.prepare(`
      UPDATE ${quoteIdentifier(tableName)}
      SET ${names.map((name) => `${quoteIdentifier(name)} = ?`).join(", ")}
      WHERE ${quoteIdentifier("id")} = ?
    `).run(...Object.values(values), request.params.id);
    response.json({ item: getRow(database, tableName, request.params.id) });
  });

  router.delete("/tables/:table/:id", (request, response) => {
    const definition = requireTable(request);
    if (definition.readOnly) throw new HttpError(403, "该数据表为只读表");
    const result = database
      .prepare(`DELETE FROM ${quoteIdentifier(request.params.table)} WHERE ${quoteIdentifier("id")} = ?`)
      .run(request.params.id);
    if (result.changes === 0) throw new HttpError(404, "记录不存在");
    response.status(204).end();
  });

  router.use((error, _request, response, next) => {
    if (!(error instanceof HttpError)) {
      next(error);
      return;
    }
    response.status(error.status).json({ error: "Database Admin Error", message: error.message });
  });

  return router;
}
