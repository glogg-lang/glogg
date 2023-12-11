import * as parse from "#src/parser/primitive";
import * as assert from "node:assert";

describe("Parser primitives", () => {
  describe("char", () => {
    it("parses a single character from the start of a string", () => {
      const parser = parse.char("c");
      const result = parser("cars");

      assert.ok(result.success);
      assert.equal(result.value, "c");
      assert.equal(result.rest, "ars");
    });

    it("sanity check: fails if passed string starting with different character", () => {
      const parser = parse.char("b");
      assert.ok(!parser("cars").success);
    });
  });

  describe("digit", () => {
    it("parses 0-9", () => {
      for (const digit of "0123456789".split("")) {
        const result = parse.digit(digit);

        assert.ok(result.success);
        assert.equal(result.value, digit);
        assert.equal(result.rest, "");
      }
    });

    it("parses a single digit", () => {
      const result = parse.digit("0123456");

      assert.ok(result.success);
      assert.equal(result.value, "0");
      assert.equal(result.rest, "123456");
    });

    it("sanity check: fails if passed string starting with different character", () => {
      assert.ok(!parse.digit("arr").success);
    });
  });

  describe("oneOf", () => {
    it("succeeds if any given parser succeeds", () => {
      const parser = parse.oneOf(parse.digit, parse.char("e"));

      let result = parser("100");

      assert.ok(result.success);
      assert.equal(result.value, "1");
      assert.equal(result.rest, "00");

      result = parser("e10");

      assert.ok(result.success);
      assert.equal(result.value, "e");
      assert.equal(result.rest, "10");
    });

    it("fails if no given parser succeeds", () => {
      const parser = parse.oneOf(
        parse.char("a"),
        parse.char("b"),
        parse.char("c"),
      );

      assert.ok(!parser("delta").success);
    });
  });
});
