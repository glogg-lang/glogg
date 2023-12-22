export const migrations = [
  [
    `CREATE TABLE query (
      id INTEGER PRIMARY KEY
    ) STRICT`,
    `CREATE TABLE search (
      id INTEGER PRIMARY KEY,
      query_id INTEGER NOT NULL REFERENCES query(id) ON DELETE CASCADE
    ) STRICT`,
    `CREATE TABLE bind (
      id INTEGER PRIMARY KEY,
      query_id INTEGER NOT NULL REFERENCES query(id) ON DELETE CASCADE
    ) STRICT`,
    `CREATE TABLE 'commit' (
      id INTEGER PRIMARY KEY,
      query_id INTEGER NOT NULL REFERENCES query(id) ON DELETE CASCADE
    ) STRICT`,
    `CREATE TABLE clause (
      id INTEGER PRIMARY KEY,
      search_id INTEGER REFERENCES search(id) ON DELETE CASCADE,
      bind_id INTEGER REFERENCES bind(id) ON DELETE CASCADE,
      commit_id INTEGER REFERENCES 'commit'(id) ON DELETE CASCADE,
      alias TEXT,
      'order' INTEGER NOT NULL
    ) STRICT`,
    `CREATE TABLE 'constraint' (
      id INTEGER PRIMARY KEY,
      clause_id INTEGER NOT NULL REFERENCES clause(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      value ANY NOT NULL,
      type TEXT NOT NULL,
      operation TEXT NOT NULL
    ) STRICT`,
  ],
];
