import { config } from "../src/config.js";
import { openDatabase } from "../src/db/database.js";

const database = openDatabase(config.databasePath);
const tables = database
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
  .all();
database.close();

console.log(`SQLite 数据库已就绪：${config.databasePath}`);
console.log(`数据表：${tables.map((table) => table.name).join("、")}`);
