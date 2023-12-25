import * as parse from "#src/parser/query";
import * as atom from "#src/parser/atom";
import * as assert from "node:assert";

describe("Query parsing", () => {
  describe("Commit", () => {
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

    it("Commits can be prefixed with a search block", () => {
      const result = parse.query.run(
        [
          "search:",
          "  [#person name: name pets: n]",
          "",
          "commit:",
          "  [#cat-person name: name]",
        ].join("\n"),
      );

      assert.ok(result.success);

      const query = result.value;

      assert.deepStrictEqual(query.search, [
        { tag: "person", name: new atom.Var("name"), pets: new atom.Var("n") },
      ]);
      assert.deepStrictEqual(query.bind, []);
      assert.deepStrictEqual(query.commit, [
        { tag: "cat-person", name: new atom.Var("name") },
      ]);
    });
  });

  describe("Bind", () => {
    it("Bind must always be prefixed with a search block", () => {
      const result = parse.query.run(
        [
          "search:",
          "  [#person name: name pets: n]",
          "",
          "bind:",
          "  [#cat-person name: name]",
        ].join("\n"),
      );

      assert.ok(result.success);

      const query = result.value;

      assert.deepStrictEqual(query.search, [
        { tag: "person", name: new atom.Var("name"), pets: new atom.Var("n") },
      ]);
      assert.deepStrictEqual(query.bind, [
        { tag: "cat-person", name: new atom.Var("name") },
      ]);
      assert.deepStrictEqual(query.commit, []);
    });

    it("Bind without search will fail (it would imply commit)", () => {
      const result = parse.query.run(
        ["bind:", "  [#cat-person name: name]"].join("\n"),
      );

      assert.strictEqual(false, result.success);
    });
  });
});
