import * as parse from "./primitive.js";
import * as atom from "./atom.js";

export const emptyRecord = parse
  .sequence(parse.char("["), atom.whitespace, parse.char("]"))
  .map((_) => ({}));

const tag = parse
  .sequence(parse.char("#"), atom.name.keep(), atom.whitespace)
  .mapKeeps(([name]) => ["tag", name]);

const keyValuePair = parse
  .sequence(
    atom.name.keep(),
    atom.whitespace,
    parse.char(":"),
    atom.whitespace,
    parse.oneOf(atom.string, atom.integer).keep(),
    atom.whitespace,
  )
  .mapKeeps((val) => val);

export const nonEmptyRecord = parse
  .sequence(
    parse.char("["),
    atom.whitespace,
    parse.nOrMore(1, parse.oneOf(tag, keyValuePair)).keep(),
    parse.char("]"),
    atom.whitespace,
  )
  .mapKeeps(([val]) => {
    const result = {};

    val.forEach(([key, val]) => {
      result[key] = val;
    });

    return result;
  });

export const record = parse.oneOf(emptyRecord, nonEmptyRecord);
