import sqlite from "sqlite3";
import { migrations } from "#src/schema";

sqlite.verbose();

export async function setup(connectionString) {
  const db = new sqlite.Database(connectionString);

  const name = await get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='query'",
    {},
    db,
  );

  if (!name) {
    // query table doesn't exist, likely brand new database
    await run("PRAGMA encoding = 'UTF-8'", {}, db);
    // decided semi-randomly. can be used to verify that a sqlite database is a gløgg db
    await run("PRAGMA application_id=267324090", {}, db);
  }

  await run("PRAGMA foreign_keys = ON", {}, db);

  const { user_version: migratedVersion } = await get(
    "PRAGMA user_version",
    {},
    db,
  );

  const unappliedMigrations = migrations.slice(migratedVersion).flat();

  for (const migration of unappliedMigrations) {
    await run(migration, {}, db);
  }

  await run("PRAGMA user_version = " + migrations.length, {}, db);

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

export function get(str, params, db) {
  return new Promise((res, rej) => {
    db.get(str, params, (err, row) => {
      if (err) {
        rej(err);
        return;
      }

      res(row);
    });
  });
}

export function all(str, params, db) {
  return new Promise((res, rej) => {
    db.all(str, params, (err, row) => {
      if (err) {
        rej(err);
        return;
      }

      res(row);
    });
  });
}

export async function tx(store, action) {
  await run("BEGIN", {}, store);

  try {
    await action();

    await run("COMMIT", {}, store);
  } catch (e) {
    console.error(e);

    await run("ROLLBACK", {}, store);
  }
}
