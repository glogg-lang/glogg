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
});
