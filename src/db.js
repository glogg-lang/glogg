import sqlite from "sqlite3";
import { migrations } from "#src/schema";

sqlite.verbose();

export async function setup(connectionString) {
  const db = new sqlite.Database(connectionString);

  // TODO: split in permanent and run-once pragmas
  await run("PRAGMA encoding = 'UTF-8'", {}, db);
  await run("PRAGMA foreign_keys = ON", {}, db);

  for (const migration of migrations) {
    await run(migration, {}, db);
  }

  return db;
}

export function run(str, params, db) {
  return new Promise((res, rej) => {
    db.run(str, params, (err) => {
      if (err) {
        rej(err);
        return;
      }

      res();
    });
  });
}
