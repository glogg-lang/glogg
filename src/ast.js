import * as parser from "#src/parser/query";
import * as atom from "#src/parser/atom";
import * as db from "#src/db";

export async function save(store, code) {
  if (code.trim().length === 0) {
    return;
  }

  const parsed = parser.query.run(code);

  await db.run("BEGIN", {}, store);

  try {
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

      for (const [label, value] of Object.entries(commitClause)) {
        let serializedValue = value;
        let valueType = typeof value;

        if (value instanceof atom.Var) {
          serializedValue = value.name;
          valueType = "variable";
        }

        await db.get(
          [
            "INSERT INTO 'constraint' (clause_id, label, value, type, operation)",
            "VALUES ($clauseId, $label, $value, $type, $operation)",
          ].join(""),
          {
            $clauseId: clauseId,
            $label: label,
            $value: serializedValue,
            $type: valueType,
            $operation: "SET",
          },
          store,
        );
      }
    }

    await db.run("COMMIT", {}, store);
  } catch (e) {
    console.error(e);

    await db.run("ROLLBACK", {}, store);
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
          if (constraint.label === "tag") {
            result += ` #${constraint.value}`;
            continue;
          }

          let valueFormated = constraint.value;
          if (constraint.type === "string") {
            valueFormated = `"${constraint.value}"`;
          }

          result += ` ${constraint.label}: ${valueFormated}`;
        }

        result += " ]";
      }
    }
  }

  return result;
}
