import * as parse from "#src/parser/primitive";
import * as assert from "node:assert";

describe("Parser primitives", () => {
  describe("char", () => {
    it("parses a single character from the start of a string", () => {
      const parser = parse.char("c");
      const result = parser.run("cars");

      assert.ok(result.success);
      assert.equal(result.value, "c");
      assert.equal(result.rest, "ars");
    });

    it("sanity check: fails if passed string starting with different character", () => {
      const parser = parse.char("b");
      assert.equal(parser.run("cars").success, false);
    });
  });

  describe("digit", () => {
    it("parses 0-9", () => {
      for (const digit of "0123456789".split("")) {
        const result = parse.digit.run(digit);

        assert.ok(result.success);
        assert.equal(result.value, digit);
        assert.equal(result.rest, "");
      }
    });

    it("parses a single digit", () => {
      const result = parse.digit.run("0123456");

      assert.ok(result.success);
      assert.equal(result.value, "0");
      assert.equal(result.rest, "123456");
    });

    it("sanity check: fails if passed string starting with different character", () => {
      assert.equal(parse.digit.run("arr").success, false);
    });
  });

  describe("oneOf", () => {
    it("succeeds if any given parser succeeds", () => {
      const parser = parse.oneOf(parse.digit, parse.char("e"));

      const res1 = parser.run("100");

      assert.ok(res1.success);
      assert.equal(res1.value, "1");
      assert.equal(res1.rest, "00");

      const res2 = parser.run("e10");

      assert.ok(res2.success);
      assert.equal(res2.value, "e");
      assert.equal(res2.rest, "10");
    });

    it("fails if no given parser succeeds", () => {
      const parser = parse.oneOf(
        parse.char("a"),
        parse.char("b"),
        parse.char("c"),
      );

      assert.equal(parser.run("delta").success, false);
    });
  });

  describe("sequence", () => {
    it("combines multiple parsers", () => {
      const parser = parse.sequence(
        parse.char("("),
        parse.digit,
        parse.char(")"),
      );

      const res = parser.run("(5) is a number");

      assert.ok(res.success);
      assert.equal(res.value, "(5)");
      assert.equal(res.rest, " is a number");
    });

    it("fails if any sub-parser fails", () => {
      const parser = parse.sequence(
        parse.char("("),
        parse.digit,
        parse.char(")"),
      );

      assert.equal(parser.run("(a) is a number").success, false);
    });
  });

  describe("nOrMore", () => {
    it("matches a parser _at least_ N times", () => {
      const result = parse.nOrMore(3, parse.digit).run("123.456");

      assert.ok(result.success);
      assert.equal(result.value, "123");
      assert.equal(result.rest, ".456");
    });

    it("if it cannot match N times, it fails", () => {
      assert.equal(parse.nOrMore(3, parse.digit).run("12.456").success, false);
    });

    it("continues matching past N", () => {
      const result = parse.nOrMore(3, parse.digit).run("123456+pi");

      assert.ok(result.success);
      assert.equal(result.value, "123456");
      assert.equal(result.rest, "+pi");
    });

    it("more complicated case", () => {
      const result = parse
        .sequence(
          parse.nOrMore(1, parse.digit),
          parse.char("."),
          parse.nOrMore(1, parse.digit),
        )
        .run("1.0");

      assert.ok(result.success);
      assert.equal(result.value, "1.0");
      assert.equal(result.rest, "");
    });
  });

  describe("keep", () => {
    it("let's us 'keep' or extract values from parsers", () => {
      const parser = parse.sequence(
        parse.nOrMore(1, parse.digit).keep(),
        parse.char("+"),
        parse.nOrMore(1, parse.digit).keep(),
      );

      assert.deepEqual(parser.run("12+5").forKeeps, ["12", "5"]);
    });
  });
});
