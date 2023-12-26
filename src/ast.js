import * as parser from "#src/parser/query";
import * as atom from "#src/parser/atom";
import * as db from "#src/db";

export async function save(store, code) {
  if (code.trim().length === 0) {
    return;
  }

  const parsed = parser.query.run(code);
  const { search, bind, commit } = parsed.value;

  if (search.steps.length + bind.steps.length + commit.steps.length === 0) {
    return;
  }

  await db.tx(store, async () => {
    const { id: queryId } = await db.get(
      "INSERT INTO query DEFAULT VALUES RETURNING *",
      {},
      store,
    );

    if (search.steps.length > 0) {
      const { id: searchId } = await db.get(
        "INSERT INTO search (query_id) VALUES ($queryId) RETURNING *",
        { $queryId: queryId },
        store,
      );

      await saveRecords(store, { searchId: searchId }, search.steps.entries());
    }

    if (bind.steps.length > 0) {
      const { id: bindId } = await db.get(
        "INSERT INTO bind (query_id) VALUES ($queryId) RETURNING *",
        { $queryId: queryId },
        store,
      );

      await saveRecords(store, { bindId: bindId }, bind.steps.entries());
    }

    if (commit.steps.length > 0) {
      const { id: commitId } = await db.get(
        "INSERT INTO 'commit' (query_id) VALUES ($queryId) RETURNING *",
        { $queryId: queryId },
        store,
      );

      await saveRecords(store, { commitId: commitId }, commit.steps.entries());
    }
  });
}

async function saveRecords(store, { searchId, bindId, commitId }, entries) {
  for (const [idx, clause] of entries) {
    const { id: clauseId } = await db.get(
      [
        "INSERT INTO clause (search_id, bind_id, commit_id, alias, 'order')",
        "VALUES ($searchId, $bindId, $commitId, $alias, $order)",
        "RETURNING *",
      ].join(" "),
      {
        $searchId: searchId,
        $bindId: bindId,
        $commitId: commitId,
        $alias: null,
        $order: idx,
      },
      store,
    );

    for (const [label, value] of Object.entries(clause)) {
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
}

export async function load(store) {
  let result = "";

  const queries = await db.all("SELECT * FROM query", {}, store);

  for (const { id: queryId } of queries) {
    const searches = await db.all(
      "SELECT * FROM search WHERE query_id = $queryId",
      { $queryId: queryId },
      store,
    );

    for (const search of searches) {
      result += "search:";

      const lines = await db.all(
        "SELECT * FROM clause WHERE search_id = $searchId ORDER BY 'order' ASC",
        { $searchId: search.id },
        store,
      );

      const formattedLines = await formatLines(store, lines);

      result += formattedLines;
      result += "\n\n";
    }

    const binds = await db.all(
      "SELECT * FROM bind WHERE query_id = $queryId",
      { $queryId: queryId },
      store,
    );

    for (const bind of binds) {
      result += "bind:";

      const lines = await db.all(
        "SELECT * FROM clause WHERE bind_id = $bindId ORDER BY 'order' ASC",
        { $bindId: bind.id },
        store,
      );

      const formattedLines = await formatLines(store, lines);

      result += formattedLines;
      result += "\n\n";
    }

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

      const formattedLines = await formatLines(store, lines);

      result += formattedLines;
      result += "\n\n";
    }

    result += "\n";
  }

  return result;
}

async function formatLines(store, lines) {
  let result = "";

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

  return result;
}
