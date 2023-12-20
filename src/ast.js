import * as parser from "#src/parser/query";
import * as db from "#src/db";

export async function save(store, code) {
  const parsed = parser.query.run(code);

  const { id: queryId } = await db.get(
    "INSERT INTO query DEFAULT VALUES RETURNING *",
    {},
    store,
  );

  const { id: commitId } = await db.get(
    "INSERT INTO 'commit' (query_id) VALUES ($queryId) RETURNING *",
    { $queryId: queryId },
    store,
  );

  for (const [idx, commitClause] of parsed.value.commit.entries()) {
    const { id: clauseId } = await db.get(
      [
        "INSERT INTO clause (search_id, bind_id, commit_id, alias, 'order')",
        "VALUES (NULL, NULL, $commitId, $alias, $order)",
        "RETURNING *",
      ].join(" "),
      {
        $commitId: commitId,
        $alias: null,
        $order: idx,
      },
      store,
    );

    for (const [name, value] of Object.entries(commitClause)) {
      await db.get(
        [
          "INSERT INTO 'constraint' (clause_id, column, value, operator)",
          "VALUES ($clauseId, $column, $value, $operator)",
        ].join(""),
        {
          $clauseId: clauseId,
          $column: name,
          $value: value,
          $operator: "=",
        },
        store,
      );
    }
  }
}

export async function load(store) {
  let result = "";

  const queries = await db.all("SELECT * FROM query", {}, store);

  for (const { id: queryId } of queries) {
    const commits = await db.all(
      "SELECT * FROM 'commit' WHERE query_id = $queryId",
      { $queryId: queryId },
      store,
    );

    for (const commit of commits) {
      result += "commit:";

      const lines = await db.all(
        "SELECT * FROM clause WHERE commit_id = $commitId ORDER BY 'order' ASC",
        { $commitId: commit.id },
        store,
      );

      for (const line of lines) {
        result += "\n  [";

        const constraints = await db.all(
          "SELECT * FROM 'constraint' WHERE clause_id = $clauseId",
          { $clauseId: line.id },
          store,
        );

        for (const constraint of constraints) {
          if (constraint.column === "tag") {
            result += ` #${constraint.value}`;
          } else {
            result += ` ${constraint.column}: "${constraint.value}"`;
          }
        }

        result += " ]";
      }
    }
  }

  return result;
}
