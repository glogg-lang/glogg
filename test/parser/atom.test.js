import * as parse from "#src/parser/atom";
import * as assert from "node:assert";

describe("Atom parsing", () => {
  describe("whitespace", () => {
    it("parses any number of leading white space characters", () => {
      const input = "    \n  \t  \r\n  ";
      const result = parse.whitespace.run(input);

      assert.ok(result.success);
      assert.equal(result.value.join(""), input);
      assert.equal(result.rest, "");
    });

    it("always succeeds", () => {
      const res1 = parse.whitespace.run("");

      assert.ok(res1.success);
      assert.equal(res1.value, "");
      assert.equal(res1.rest, "");

      const res2 = parse.whitespace.run("abc");

      assert.ok(res2.success);
      assert.equal(res2.value, "");
      assert.equal(res2.rest, "abc");
    });
  });

  describe("name", () => {
    it("a name starts with a lowercase letter, and contains lowercase letters, hyphens and numbers", () => {
      const input = "ny-båre1";
      const result = parse.name.run(input);

      assert.ok(result.success);
      assert.equal(result.value, input);
      assert.equal(result.rest, "");
    });

    it("cannot begin with a number", () => {
      assert.equal(parse.name.run("1bar").success, false);
    });

    it("cannot begin with a hyphen", () => {
      assert.equal(parse.name.run("-foo").success, false);
    });

    it("cannot begin with a uppercase letter", () => {
      assert.equal(parse.name.run("Fbar").success, false);
    });

    it("cannot contain uppercase letters", () => {
      assert.equal(parse.name.run("fooBar").success, false);
    });

    it("cannot contain spaces", () => {
      const result = parse.name.run("foo bar");

      assert.ok(result.success);
      assert.equal(result.value, "foo");
      assert.equal(result.rest, " bar");
    });
  });

  describe("string", () => {
    it('Begins and ends with ", contains arbitrary text', () => {
      const input = '"this is a test 🥳"';
      const result = parse.string.run(input);

      assert.ok(result.success);
      assert.equal(result.value, input.slice(1, -1));
      assert.equal(result.rest, "");
    });
  });
});
