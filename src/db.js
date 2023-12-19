import sqlite from "sqlite3";

export function setup(connectionString, cb) {
  const db = new sqlite.Database(connectionString);

  // TODO: split in permanent and run-once pragmas
  db.run("PRAGMA encoding = 'UTF-8'");
  db.run("PRAGMA foreign_keys = ON");

  cb(db);
}
