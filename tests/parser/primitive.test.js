import * as parse from "../../src/parser/primitive";

test("Can parse single char from string", () =>
  expect(parse.chr("c")("cars")).toBe(true));
