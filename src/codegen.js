import * as db from "#src/db";
import fs from "node:fs";
import url from "node:url";

export async function make(store) {
  let imports = 'import * as runtime from "glogg-lang/runtime";\n';

  const integrations = await db.all(
    ["SELECT * FROM integration"].join("\n"),
    {},
    store,
  );

  for (let integration of integrations) {
    imports += `import * as integration${integration.id} from "${integration.import_name}";\n`;
  }

  let result = imports + "\n";

  result += "const db = new runtime.Db();\n\n";

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
    integrations,
    store,
  );

  result += conditionals + "\n";

  const commitStatement = await compileCommits(
    0,
    "db",
    unconditionalCommits,
    integrations,
    store,
  );

  result += commitStatement;

  return result;
}

async function compileConditionalQueries(queries, integrations, store) {
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

    const boundVars = {};
    let indentLevel = 1;

    for (const [idx, clause] of clauses.entries()) {
      const factVar = `fact\$${idx}`;

      result += line(indentLevel, `for (const ${factVar} of this.facts) {`);

      const constraints = await db.all(
        "SELECT * FROM 'constraint' WHERE clause_id = $clauseId",
        { $clauseId: clause.id },
        store,
      );

      indentLevel++;

      result += indented(indentLevel, "if (");

      for (const [idx, cons] of constraints.entries()) {
        result += `${factVar}.${normalizeVariable(cons.label)}`;

        switch (cons.type) {
          case "string":
            result += ` === "${cons.value}"`;
            break;
          case "number":
            result += ` === ${cons.value}`;
            break;
          case "variable":
            const varName = normalizeVariable(cons.value);
            if (boundVars[varName]) {
              result += ` === ${varName}`;
            }
            break;
        }

        if (idx !== constraints.length - 1) {
          result += " && ";
        }
      }

      result += ") {\n";

      indentLevel++;

      const vars = constraints.filter((con) => con.type === "variable");

      for (const cons of vars) {
        const varName = normalizeVariable(cons.value);

        if (boundVars[varName]) {
          continue;
        }

        boundVars[varName] = true;

        result += line(
          indentLevel,
          `const ${varName} = ${factVar}.${normalizeVariable(cons.label)};`,
        );
      }
    }

    const commit = await db.get(
      "SELECT * FROM 'commit' WHERE query_id = $queryId",
      { $queryId: query.id },
      store,
    );

    const commitExpression = await compileCommits(
      indentLevel,
      "this",
      [commit],
      integrations,
      store,
    );

    result += commitExpression;

    while (indentLevel > 1) {
      indentLevel--;
      result += line(indentLevel, "}");
    }

    result += "});\n";
  }

  return result;
}

function normalizeVariable(varName) {
  return varName.replace("-", "_");
}

async function compileCommits(
  indentLevel,
  dbName,
  commits,
  integrations,
  store,
) {
  if (commits.length === 0) {
    return line(indentLevel, `${dbName}.commit([]);`);
  }

  let result = "";

  for (const commit of commits) {
    if (commit.context != null) {
      const integration = integrations.find((i) => i.context_prefix);
      if (integration != null) {
        dbName = `integration${integration.id}`;
      }
    }

    result += line(indentLevel, `${dbName}.commit([`);

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

      const record = recordFromConstraints(constraints);

      result += line(indentLevel + 1, record + ",");
    }

    result += line(indentLevel, "]);");
  }

  return result;
}

function recordFromConstraints(constraints) {
  let result = "{";

  for (const constraint of constraints) {
    const label = constraint.label;

    let value = null;
    switch (constraint.type) {
      case "string":
        value = `"${constraint.value}"`;
        break;
      case "number":
        value = constraint.value.toString();
        break;
      case "variable":
        value = normalizeVariable(constraint.value);
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
