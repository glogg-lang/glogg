import * as parse from "./primitive.js";

export class Var {
  constructor(name) {
    this.name = name;
  }
}

export const whitespace = parse.nOrMore(0, parse.whitespace);

const termination = parse.oneOf(
  parse.end,
  parse.char(":"),
  parse.char("]"),
  parse.nOrMore(1, parse.whitespace),
);

const nameInner = parse.oneOf(parse.lowercase, parse.digit, parse.char("-"));

export const name = parse
  .sequence(
    parse.lowercase.keep(),
    parse.nOrMore(0, nameInner).keep(),
    termination.backtrack(),
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

export const integer = parse
  .sequence(parse.nOrMore(1, parse.digit).keep(), termination.backtrack())
  .mapKeeps(([digits]) => parseInt(digits.join("")));

export const variable = name.map((name) => new Var(name));
