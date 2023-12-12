import * as parse from "#src/parser/atom";
import * as assert from "node:assert";

describe("Atom parsing", () => {
  describe("whitespace", () => {
    it("parses any number of leading white space characters", () => {
      const input = "    \n  \t  \r\n  ";
      const result = parse.whitespace.run(input);

      assert.ok(result.success);
      assert.equal(result.value, input);
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
});
