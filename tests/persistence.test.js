import * as persistence from "#src/persistence";
import * as db from "#src/db";
import assert from "node:assert";

let store = null;

describe("Persistence - Save and Load", () => {
  beforeEach(async () => {
    store = await db.setup(":memory:");
  });

  it("Unconditional commit", async () => {
    await persistence.save(
      store,
      'commit: [#person name: "Robin" pets: 2 role: role]',
    );

    const extracted = await persistence.load(store);

    assertNoWhitespace(
      'commit: [ #person name: "Robin" pets: 2 role: role ]',
      extracted,
    );
  });

  it("Multiple commits", async () => {
    await persistence.save(
      store,
      `commit: [#person name: "Robin" pets: 2 role: role]
      commit: [#test]
      `,
    );

    const extracted = await persistence.load(store);

    assertNoWhitespace(
      `commit: [ #person name: "Robin" pets: 2 role: role ]
      commit: [ #test ]`,
      extracted,
    );
  });

  it("Conditional commit", async () => {
    const input =
      "search: [#person name: name pets: p] commit: [#pet-owner name: name]";

    await persistence.save(store, input);

    const extracted = await persistence.load(store);

    assertNoWhitespace(input, extracted);
  });

  it("Conditional bind", async () => {
    const input =
      "search: [#person name: name pets: p] bind: [#pet-owner name: name]";

    await persistence.save(store, input);

    const extracted = await persistence.load(store);

    assertNoWhitespace(input, extracted);
  });

  it("Commit with contexts", async () => {
    const input =
      "search @one: [#person name: name pets: p] commit @two: [#pet-owner name: name]";

    await persistence.save(store, input);

    const extracted = await persistence.load(store);

    assertNoWhitespace(input, extracted);
  });

  it("Bind with contexts", async () => {
    const input =
      "search @one: [#person name: name pets: p] bind @two: [#pet-owner name: name]";

    await persistence.save(store, input);

    const extracted = await persistence.load(store);

    assertNoWhitespace(input, extracted);
  });
});

function assertNoWhitespace(expected, actual) {
  assert.strictEqual(expected.replace(/\s+/g, ""), actual.replace(/\s+/g, ""));
}
