import Database from "bun:sqlite";

export function createCacheInstance() {
  const db = new Database();
  db.run(`CREATE TABLE IF NOT EXISTS key_value_store (key TEXT PRIMARY KEY, value BLOB);`);

  function set(key: string, value: string | number) {
    db.run(`INSERT OR REPLACE INTO key_value_store (key, value) VALUES (?,?);`, [key, value]);
  }

  function get(key: string) {
    return db.run(`SELECT value FROM key_value_store WHERE key =?;`, [key]);
  }

  function hset(key: string, field: string, value: string | number) {
    const cacheKey = `${key}.${field}`;
    db.run(`INSERT OR REPLACE INTO key_value_store (key, value) VALUES (?,?);`, [cacheKey, value]);
  }

  function hget(key: string, field: string) {
    const cacheKey = `${key}.${field}`;
    return db.run(`SELECT value FROM key_value_store WHERE key =?;`, [cacheKey]);
  }

  function hdel(key: string, field: string) {
    const cacheKey = `${key}.${field}`;
    db.run(`DELETE FROM key_value_store WHERE key =?;`, [cacheKey]);
  }

  function del(key: string) {
    db.run(`DELETE FROM key_value_store WHERE key =?;`, [key]);
  }

  return { db, get, set, hget, hset, del, hdel };
}
