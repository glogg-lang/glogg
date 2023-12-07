import * as parse from "#src/parser/primitive";
import * as assert from "node:assert";

describe("Parser primitives", () => {
  describe("char", () => {
    it("parses a single character from the start of a string", () => {
      assert.ok(parse.char("c")("cars"));
    });
  });
});
