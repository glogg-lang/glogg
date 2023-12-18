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

  describe("anythingBut", () => {
    it("Accepts anything except a specific character", () => {
      const result = parse.anythingBut(";").run("here; but no longer");

      assert.ok(result.success);
      assert.equal(result.value, "h");
      assert.equal(result.rest, "ere; but no longer");
    });

    it("Fails if given the specific character", () => {
      const result = parse.anythingBut(";").run("; but no longer");

      assert.equal(result.success, false);
    });
  });

  describe("word", () => {
    it("matches a string", () => {
      const parser = parse.word("hello");
      const result = parser.run("hello world");

      assert.ok(result.success);
      assert.equal(result.value, "hello");
      assert.equal(result.rest, " world");
    });

    it("fails if the strings doesn't match", () => {
      assert.equal(parse.word("hello").run("hallo").success, false);
    });

    it("fails if the string to parse isn't long enough", () => {
      assert.equal(parse.word("hello").run("hell").success, false);
    });
  });

  describe("whitespace", () => {
    it("parses a single whitespace character", () => {
      for (const input of " \r\n\t".split("")) {
        const result = parse.whitespace.run(input);

        assert.ok(result.success);
        assert.equal(result.value, input);
        assert.equal(result.rest, "");
      }
    });

    it("fails for any other kind of character", () => {
      assert.equal(parse.whitespace.run("a").success, false);
    });
  });

  describe("end", () => {
    it("checks for the end of input", () => {
      const result = parse.end.run("");

      assert.ok(result.success);
      assert.equal(result.value, "");
      assert.equal(result.rest, "");
    });

    it("fails if any input remains", () => {
      assert.equal(parse.end.run(" ").success, false);
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

  describe("lowercase", () => {
    it("parses a single unicode lowercase letter", () => {
      for (const letter of ["a", "z", "ø"]) {
        const result = parse.lowercase.run(letter);

        assert.ok(result.success);
        assert.equal(result.value, letter);
        assert.equal(result.rest, "");
      }
    });

    it("fails on uppercase letters", () => {
      assert.equal(parse.lowercase.run("A").success, false);
    });

    it("fails on numbers", () => {
      assert.equal(parse.lowercase.run("1").success, false);
    });

    it("fails on punctiation", () => {
      assert.equal(parse.lowercase.run(".").success, false);
    });

    it("fails on empty string", () => {
      assert.equal(parse.lowercase.run("").success, false);
    });
  });

  describe("uppercase", () => {
    it("parses a single unicode uppercase letter", () => {
      for (const letter of ["A", "Z", "Å"]) {
        const result = parse.uppercase.run(letter);

        assert.ok(result.success);
        assert.equal(result.value, letter);
        assert.equal(result.rest, "");
      }
    });

    it("fails on lowercase letters", () => {
      assert.equal(parse.uppercase.run("a").success, false);
    });

    it("fails on numbers", () => {
      assert.equal(parse.uppercase.run("1").success, false);
    });

    it("fails on punctiation", () => {
      assert.equal(parse.uppercase.run(".").success, false);
    });

    it("fails on empty string", () => {
      assert.equal(parse.uppercase.run("").success, false);
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
      assert.equal(res.value.join(""), "(5)");
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
      assert.equal(result.value.join(""), "123");
      assert.equal(result.rest, ".456");
    });

    it("if it cannot match N times, it fails", () => {
      assert.equal(parse.nOrMore(3, parse.digit).run("12.456").success, false);
    });

    it("continues matching past N", () => {
      const result = parse.nOrMore(3, parse.digit).run("123456+pi");

      assert.ok(result.success);
      assert.equal(result.value.join(""), "123456");
      assert.equal(result.rest, "+pi");
    });

    it("more complicated case", () => {
      const result = parse
        .sequence(
          parse.nOrMore(1, parse.digit).map((digits) => digits.join("")),
          parse.char("."),
          parse.nOrMore(1, parse.digit).map((digits) => digits.join("")),
        )
        .run("1.0");

      assert.ok(result.success);
      assert.equal(result.value.join(""), "1.0");
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

      assert.deepEqual(parser.run("12+5").forKeeps, [["1", "2"], ["5"]]);
    });
  });

  describe("backtrack", () => {
    it("unconsumes characters from a successfull parser", () => {
      const parser = parse.sequence(
        parse.char("a"),
        parse.char("b"),
        parse.char(";").backtrack(),
      );

      const result = parser.run("ab;");

      assert.ok(result.success);
      assert.equal(result.value.join(""), "ab;");
      assert.equal(result.rest, ";");
    });
  });

  describe("map", () => {
    it("can further process a value once it's been parsed", () => {
      const parser = parse
        .nOrMore(1, parse.digit)
        .map((digits) => parseInt(digits.join("")));
      const result = parser.run("123456");

      assert.ok(result.success);
      assert.equal(result.value, 123456);
    });

    it("fails parsing if map operations throws", () => {
      const parser = parse.nOrMore(1, parse.digit).map(parseInt);
      const result = parser.run("hello");

      assert.equal(result.success, false);
    });

    it("works for sequences and keeps, as well", () => {
      const parser = parse
        .sequence(
          parse
            .nOrMore(1, parse.digit)
            .map((digits) => parseInt(digits.join("")))
            .keep(),
          parse.char("+"),
          parse
            .nOrMore(1, parse.digit)
            .map((digits) => parseInt(digits.join("")))
            .keep(),
        )
        .mapKeeps(([left, right]) => left + right);

      const result = parser.run("12+8");

      assert.ok(result.success);
      assert.equal(result.value, 20);
    });
  });
});
