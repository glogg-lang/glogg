import * as ast from "#src/ast";
import * as db from "#src/db";
import * as assert from "node:assert";

let store = null;

describe("AST - Save and Load", () => {
  beforeEach(async () => {
    store = await db.setup(":memory:");
  });

  it("Unconditional commit", async () => {
    await ast.save(store, 'commit: [#person name: "Robin" pets: 2 role: role]');

    const extracted = await ast.load(store);

    assertNoWhitespace(
      'commit: [ #person name: "Robin" pets: 2 role: role ]',
      extracted,
    );
  });

  it("Conditional commit", async () => {
    const input =
      "search: [#person name: name pets: p ] commit: [#pet-owner name: name]";

    await ast.save(store, input);

    const extracted = await ast.load(store);

    assertNoWhitespace(input, extracted);
  });

  it("Conditional bind", async () => {
    const input =
      "search: [#person name: name pets: p ] bind: [#pet-owner name: name]";

    await ast.save(store, input);

    const extracted = await ast.load(store);

    assertNoWhitespace(input, extracted);
  });
});

function assertNoWhitespace(expected, actual) {
  assert.strictEqual(expected.replace(/\s/g, ""), actual.replace(/\s/g, ""));
}
