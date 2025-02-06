import * as db from "#src/db";
import * as fs from "node:fs";

const runtimePath = new URL(import.meta.resolve("#src/runtime")).pathname;

export async function make(store) {
  const runtimePrelude = fs
    .readFileSync(runtimePath, { encoding: "utf-8" })
    .replace("export ", "");

  let result = runtimePrelude + "\n\n";

  result += "const db = init();\n\n";

  const unconditionalCommits = await db.all(
    [
      "SELECT * FROM 'commit'",
      "WHERE query_id NOT IN (SELECT query_id FROM search)",
      "AND query_id NOT IN (SELECT query_id FROM bind)",
    ].join("\n"),
    {},
    store,
  );

  const conditionalQueries = await db.all(
    ["SELECT id FROM query", "WHERE id NOT IN ($unconditionalQueryIds)"].join(
      "\n",
    ),
    {
      $unconditionalQueryIds: unconditionalCommits
        .map((it) => it.query_id)
        .join(", "),
    },
    store,
  );

  const conditionals = await compileConditionalQueries(
    conditionalQueries,
    store,
  );

  result += conditionals + "\n";

  const commitStatement = await compileCommits(
    0,
    "db",
    unconditionalCommits,
    store,
  );

  result += commitStatement;

  return result;
}

async function compileConditionalQueries(queries, store) {
  let result = "";

  for (const query of queries) {
    result += line(0, "db.onChange(function() {");

    const search = await db.get(
      "SELECT * FROM search WHERE query_id = $queryId",
      { $queryId: query.id },
      store,
    );

    const clauses = await db.all(
      "SELECT * FROM clause WHERE search_id = $searchId ORDER BY 'order' ASC",
      { $searchId: search.id },
      store,
    );

    for (const [idx, clause] of clauses.entries()) {
      const indentLevel = idx + 1;
      result += line(indentLevel, "for (const fact of this.facts) {");

      const constraints = await db.all(
        "SELECT * FROM 'constraint' WHERE clause_id = $clauseId",
        { $clauseId: clause.id },
        store,
      );

      result += indented(indentLevel + 1, "if (");

      for (const [idx, cons] of constraints.entries()) {
        result += `fact.${cons.label}`;

        switch (cons.type) {
          case "string":
            result += ` === "${cons.value}"`;
            break;
          case "number":
            result += ` === ${cons.value}`;
            break;
        }

        if (idx !== constraints.length - 1) {
          result += " && ";
        }
      }

      result += ") {\n";

      const vars = constraints.filter((con) => con.type === "variable");

      for (const cons of vars) {
        result += line(
          indentLevel + 2,
          `const ${cons.value} = fact.${cons.label};`,
        );
      }

      const commit = await db.get(
        "SELECT * FROM 'commit' WHERE query_id = $queryId",
        { $queryId: query.id },
        store,
      );

      const commitExpression = await compileCommits(
        indentLevel + 2,
        "this",
        [commit],
        store,
      );

      result += commitExpression;

      result += line(indentLevel + 1, "}");

      result += line(indentLevel, "}");
    }

    result += "});\n";
  }

  return result;
}

async function compileCommits(indentLevel, dbName, commits, store) {
  let result = line(indentLevel, `${dbName}.commit([`);

  for (const commit of commits) {
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

      const record = recordFromConstraints(commit.context, constraints);

      result += line(indentLevel + 1, record + ",");
    }
  }

  result += line(indentLevel, "]);");

  return result;
}

function recordFromConstraints(context, constraints) {
  let result = "{";

  for (const constraint of constraints) {
    const label = context ? `${context}/${constraint.label}` : constraint.label;

    let value = null;
    switch (constraint.type) {
      case "string":
        value = `"${constraint.value}"`;
        break;
      case "number":
        value = constraint.value.toString();
        break;
      case "variable":
        value = constraint.value;
    }

    result += `"${label}": ${value}, `;
  }

  result += "}";

  return result;
}

// Formatting helpers

function indented(level, content) {
  return `${makeIndent(level)}${content}`;
}

function line(indentLevel, content) {
  return `${indented(indentLevel, content)}\n`;
}

function makeIndent(level) {
  const spaces = level * 2;
  return " ".repeat(spaces);
}
