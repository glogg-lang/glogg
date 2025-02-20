import * as parse from "#src/parser/query";
import * as atom from "#src/parser/atom";
import assert from "node:assert";

describe("Query parsing", () => {
  describe("Commit", () => {
    it("describing an unconditional fact", () => {
      const result = parse.query.run(
        ["commit:", '  [#person name: "Robin" role: "developer"]'].join("\n"),
      );

      assert.ok(result.success);

      const query = result.value;

      assert.deepEqual(query.search.steps, []);
      assert.deepEqual(query.bind.steps, []);
      assert.deepEqual(query.commit, {
        context: null,
        steps: [{ tag: "person", name: "Robin", role: "developer" }],
      });
    });

    it("can target custom context", () => {
      const result = parse.query.run(
        [
          "commit @persons:",
          '  [#person name: "Robin" role: "developer"]',
        ].join("\n"),
      );

      assert.ok(result.success);

      const query = result.value;

      assert.deepEqual(query.search.steps, []);
      assert.deepEqual(query.bind.steps, []);
      assert.deepEqual(query.commit, {
        context: "persons",
        steps: [{ tag: "person", name: "Robin", role: "developer" }],
      });
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

      assert.deepEqual(query.search.steps, []);
      assert.deepEqual(query.bind.steps, []);
      assert.deepEqual(query.commit, {
        context: null,
        steps: [
          { tag: "person", name: "Robin", role: "developer" },
          { tag: "person", name: "Nibor", role: "team lead", cats: 3 },
        ],
      });
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

      assert.deepStrictEqual(query.search, {
        context: null,
        steps: [
          {
            tag: "person",
            name: new atom.Var("name"),
            pets: new atom.Var("n"),
          },
        ],
      });
      assert.deepStrictEqual(query.bind.steps, []);
      assert.deepStrictEqual(query.commit, {
        context: null,
        steps: [{ tag: "cat-person", name: new atom.Var("name") }],
      });
    });

    it("Search and commit block can target custom contexts", () => {
      const result = parse.query.run(
        [
          "search @persons:",
          "  [#person name: name pets: n]",
          "",
          "commit @cats:",
          "  [#cat-person name: name]",
        ].join("\n"),
      );

      assert.ok(result.success);

      const query = result.value;

      assert.deepStrictEqual(query.search, {
        context: "persons",
        steps: [
          {
            tag: "person",
            name: new atom.Var("name"),
            pets: new atom.Var("n"),
          },
        ],
      });
      assert.deepStrictEqual(query.bind.steps, []);
      assert.deepStrictEqual(query.commit, {
        context: "cats",
        steps: [{ tag: "cat-person", name: new atom.Var("name") }],
      });
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

      assert.deepStrictEqual(query.search, {
        context: null,
        steps: [
          {
            tag: "person",
            name: new atom.Var("name"),
            pets: new atom.Var("n"),
          },
        ],
      });
      assert.deepStrictEqual(query.bind, {
        context: null,
        steps: [{ tag: "cat-person", name: new atom.Var("name") }],
      });
      assert.deepStrictEqual(query.commit.steps, []);
    });

    it("Search and bind can both target custom contexts", () => {
      const result = parse.query.run(
        [
          "search @persons:",
          "  [#person name: name pets: n]",
          "",
          "bind @global:",
          "  [#cat-person name: name]",
        ].join("\n"),
      );

      assert.ok(result.success);

      const query = result.value;

      assert.deepStrictEqual(query.search, {
        context: "persons",
        steps: [
          {
            tag: "person",
            name: new atom.Var("name"),
            pets: new atom.Var("n"),
          },
        ],
      });
      assert.deepStrictEqual(query.bind, {
        context: "global",
        steps: [{ tag: "cat-person", name: new atom.Var("name") }],
      });
      assert.deepStrictEqual(query.commit.steps, []);
    });

    it("Bind without search will fail (it would imply commit)", () => {
      const result = parse.query.run(
        ["bind:", "  [#cat-person name: name]"].join("\n"),
      );

      assert.strictEqual(false, result.success);
    });
  });
});
