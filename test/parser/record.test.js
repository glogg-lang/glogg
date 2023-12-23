import * as parse from "#src/parser/record";
import * as atom from "#src/parser/atom";
import * as assert from "node:assert";

describe("Record parsing", () => {
  describe("empty record", () => {
    it("simple empty record literal", () => {
      const result = parse.emptyRecord.run("[]");

      assert.ok(result.success);
      assert.deepEqual(result.value, {});
    });

    it("white space doesn't matter", () => {
      const result = parse.emptyRecord.run("[  \n  ]");

      assert.ok(result.success);
      assert.deepEqual(result.value, {});
    });
  });

  describe("non-empty record", () => {
    it("describing a record with a key value pair", () => {
      const result = parse.nonEmptyRecord.run('[name: "Robin"]');

      assert.ok(result.success);
      assert.deepEqual(result.value, { name: "Robin" });
    });

    it("works with multiple pairs", () => {
      const result = parse.nonEmptyRecord.run('[name: "Robin" pets: 0 ]');

      assert.ok(result.success);
      assert.deepEqual(result.value, { name: "Robin", pets: 0 });
    });

    it("can contain variables", () => {
      const result = parse.nonEmptyRecord.run('[name: "Robin" pets: pets ]');

      assert.ok(result.success);
      assert.deepStrictEqual(result.value, {
        name: "Robin",
        pets: new atom.Var("pets"),
      });
    });

    it("#person expands to tag: 'person'", () => {
      const result = parse.nonEmptyRecord.run("[#person]");

      assert.ok(result.success);
      assert.deepEqual(result.value, { tag: "person" });
    });

    it("can mix tags with key values", () => {
      const result = parse.nonEmptyRecord.run('[#person name: "Robin"]');

      assert.ok(result.success);
      assert.deepEqual(result.value, { tag: "person", name: "Robin" });
    });
  });
});
