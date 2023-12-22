import * as parse from "#src/parser/query";
import * as assert from "node:assert";

describe("Query parsing", () => {
  describe("Simple commit", () => {
    it("describing an unconditional fact", () => {
      const result = parse.query.run(
        ["commit:", '  [#person name: "Robin" role: "developer"]'].join("\n"),
      );

      assert.ok(result.success);

      const query = result.value;

      assert.deepEqual(query.search, []);
      assert.deepEqual(query.bind, []);
      assert.deepEqual(query.commit, [
        { tag: "person", name: "Robin", role: "developer" },
      ]);
    });

    it("Slightly more complicated fact", () => {
      const result = parse.query.run(
        [
          "commit:",
          '  [#person name: "Robin" role: "developer"]',
          '  [#person name: "Nibor" role: "team lead" cats: 3]',
        ].join("\n"),
      );

      assert.ok(result.success);

      const query = result.value;

      assert.deepEqual(query.search, []);
      assert.deepEqual(query.bind, []);
      assert.deepEqual(query.commit, [
        { tag: "person", name: "Robin", role: "developer" },
        { tag: "person", name: "Nibor", role: "team lead", cats: 3 },
      ]);
    });
  });
});
