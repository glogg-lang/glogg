import * as parse from "#src/parser/primitive";
import * as assert from "node:assert";

describe("Parser primitives", () => {
  describe("char", () => {
    it("parses a single character from the start of a string", () => {
      const parser = parse.char("c");
      assert.deepEqual(parser("cars"), {
        success: true,
        value: "c",
        rest: "ars",
      });
    });

    it("sanity check: fails if passed string starting with different character", () => {
      const parser = parse.char("b");
      assert.equal(parser("cars").success, false);
    });
  });

  describe("digit", () => {
    it("parses 0-9", () => {
      for (const digit of "0123456789".split("")) {
        assert.deepEqual(parse.digit(digit), {
          success: true,
          value: digit,
          rest: "",
        });
      }
    });

    it("parses a single digit", () => {
      assert.deepEqual(parse.digit("0123456"), {
        success: true,
        value: "0",
        rest: "123456",
      });
    });

    it("sanity check: fails if passed string starting with different character", () => {
      assert.equal(parse.digit("arr").success, false);
    });
  });

  describe("oneOf", () => {
    it("succeeds if any given parser succeeds", () => {
      const parser = parse.oneOf(parse.digit, parse.char("e"));

      assert.deepEqual(parser("100"), {
        success: true,
        value: "1",
        rest: "00",
      });

      assert.deepEqual(parser("e10"), {
        success: true,
        value: "e",
        rest: "10",
      });
    });

    it("fails if no given parser succeeds", () => {
      const parser = parse.oneOf(
        parse.char("a"),
        parse.char("b"),
        parse.char("c"),
      );

      assert.equal(parser("delta").success, false);
    });
  });

  describe("sequence", () => {
    it("combines multiple parsers", () => {
      const parser = parse.sequence(
        parse.char("("),
        parse.digit,
        parse.char(")"),
      );

      assert.deepEqual(parser("(5) is a number"), {
        success: true,
        value: "(5)",
        rest: " is a number",
      });
    });

    it("fails if any sub-parser fails", () => {
      const parser = parse.sequence(
        parse.char("("),
        parse.digit,
        parse.char(")"),
      );

      assert.deepEqual(parser("(a) is a number"), { success: false });
    });
  });

  describe("nOrMore", () => {
    it("matches a parser _at least_ N times", () => {
      assert.deepEqual(parse.nOrMore(3, parse.digit)("123.456"), {
        success: true,
        value: "123",
        rest: ".456",
      });
    });

    it("if it cannot match N times, it fails", () => {
      assert.deepEqual(parse.nOrMore(3, parse.digit)("12.456"), {
        success: false,
      });
    });

    it("continues matching past N", () => {
      assert.deepEqual(parse.nOrMore(3, parse.digit)("123456+pi"), {
        success: true,
        value: "123456",
        rest: "+pi",
      });
    });

    it("more complicated case", () => {
      assert.deepEqual(
        parse.sequence(
          parse.nOrMore(1, parse.digit),
          parse.char("."),
          parse.nOrMore(1, parse.digit),
        )("1.0"),
        {
          success: true,
          value: "1.0",
          rest: "",
        },
      );
    });
  });
});
