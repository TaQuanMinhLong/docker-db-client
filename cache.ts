import { Database } from "bun:sqlite";

export function createCacheInstance() {
  const db = new Database();

  db.run(
    `CREATE TABLE IF NOT EXISTS key_value_store (key TEXT PRIMARY KEY, value BLOB, type TEXT);`
  );

  function setKey(key: string, value: string | number) {
    db.run(`INSERT OR REPLACE INTO key_value_store (key, value, type) VALUES (?,?,?);`, [
      key,
      value,
      typeof value,
    ]);
  }

  function get(key: string) {
    const query = db.query(`SELECT value, type FROM key_value_store WHERE key =?;`);
    const res = query.get(key) as { value: unknown; type: "string" | "number" } | null;
    if (!res) return null;
    return res.type === "string" ? (res.value as string) : (res.value as number);
  }

  function set(key: string, value: string | number) {
    if (key.includes("."))
      console.warn(
        "Setting key with dot (.) will inherit hash key behavior, please consider using hset instead"
      );
    return setKey(key, value);
  }

  function hget(key: string, field: string) {
    const cacheKey = `${key}.${field}`;
    return get(cacheKey);
  }

  function hset(key: string, field: string, value: string | number) {
    const cacheKey = `${key}.${field}`;
    return setKey(cacheKey, value);
  }

  function hdel(key: string, field: string) {
    const cacheKey = `${key}.${field}`;
    db.run(`DELETE FROM key_value_store WHERE key =?;`, [cacheKey]);
  }

  function del(key: string) {
    const query = db.query("SELECT COUNT(*) FROM key_value_store WHERE key LIKE ? || '%")
    const isHashKey = key.split(".").length > 1;
    isHashKey
      ? db.run(`DELETE FROM key_value_store WHERE key LIKE ? || '%';`, [key])
      : db.run(`DELETE FROM key_value_store WHERE key =?;`, [key]);
  }

  return { db, get, set, hget, hset, del, hdel };
}
