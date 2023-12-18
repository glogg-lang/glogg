import * as parse from "./primitive.js";

export const whitespace = parse.nOrMore(0, parse.whitespace);

const nameInner = parse.oneOf(parse.lowercase, parse.digit, parse.char("-"));

export const name = parse
  .sequence(
    parse.lowercase.keep(),
    parse.nOrMore(0, nameInner).keep(),
    parse
      .oneOf(parse.end, parse.char(":"), parse.nOrMore(1, parse.whitespace))
      .backtrack(),
  )
  .mapKeeps(([first, rest]) => {
    return first + rest.join("");
  });

export const string = parse
  .sequence(
    parse.char('"'),
    parse.nOrMore(0, parse.anythingBut('"')).keep(),
    parse.char('"'),
  )
  .mapKeeps(([str]) => str.join(""));
