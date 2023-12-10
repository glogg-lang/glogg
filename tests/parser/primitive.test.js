import * as parse from "#src/parser/primitive";
import * as assert from "node:assert";

describe("Parser primitives", () => {
  describe("char", () => {
    it("parses a single character from the start of a string", () => {
      assert.ok(parse.char("c")("cars"));
    });

    it("sanity check: fails if passed string starting with different character", () => {
      assert.ok(!parse.char("b")("cars"));
    });
  });

  describe("digit", () => {
    it("parses 0-9", () => {
      assert.ok(parse.digit("0"));
      assert.ok(parse.digit("1"));
      assert.ok(parse.digit("2"));
      assert.ok(parse.digit("3"));
      assert.ok(parse.digit("4"));
      assert.ok(parse.digit("5"));
      assert.ok(parse.digit("6"));
      assert.ok(parse.digit("7"));
      assert.ok(parse.digit("8"));
      assert.ok(parse.digit("9"));
    });

    it("sanity check: fails if passed string starting with different character", () => {
      assert.ok(!parse.digit("arr"));
    });
  });

  describe("oneOf", () => {
    it("succeeds if any given parser succeeds", () => {
      const parser = parse.oneOf(parse.digit, parse.char("e"));

      assert.ok(parser("1"));
      assert.ok(parser("e"));
    });

    it("fails if no given parser succeeds", () => {
      const parser = parse.oneOf(
        parse.char("a"),
        parse.char("b"),
        parse.char("c"),
      );

      assert.ok(!parser("delta"));
    });
  });
});
