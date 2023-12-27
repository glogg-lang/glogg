import * as db from "#src/db";

export async function make(store) {
  let result = "const facts = [\n";

  const unconditionalCommits = await db.all(
    [
      "SELECT * FROM 'commit'",
      "WHERE query_id NOT IN (SELECT query_id FROM search)",
      "AND query_id NOT IN (SELECT query_id FROM bind)",
    ].join("\n"),
    {},
    store,
  );

  for (const commit of unconditionalCommits) {
    const clauses = await db.all(
      "SELECT * FROM clause WHERE commit_id = $commitId",
      { $commitId: commit.id },
      store,
    );

    for (const clause of clauses) {
      const constraints = await db.all(
        "SELECT * FROM 'constraint' WHERE clause_id = $clauseId",
        { $clauseId: clause.id },
        store,
      );

      const record = recordFromConstraints(clause.context, constraints);

      result += "  " + record + ",\n";
    }
  }

  result += "];\n";

  return result;
}

function recordFromConstraints(context, constraints) {
  const result = {};

  for (const constraint of constraints) {
    const label = context ? `${context}/${constraint.label}` : constraint.label;

    result[label] = constraint.value;
  }

  return JSON.stringify(result);
}
