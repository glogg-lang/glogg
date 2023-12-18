import * as parse from "./primitive.js";
import * as atom from "./atom.js";

export const emptyRecord = parse
  .sequence(parse.char("["), atom.whitespace, parse.char("]"))
  .map((_) => ({}));

const keyValuePair = parse
  .sequence(
    atom.name.keep(),
    atom.whitespace,
    parse.char(":"),
    atom.whitespace,
    atom.string.keep(),
    atom.whitespace,
  )
  .mapKeeps((val) => val);

export const nonEmptyRecord = parse
  .sequence(
    parse.char("["),
    atom.whitespace,
    parse.nOrMore(1, keyValuePair).keep(),
    parse.char("]"),
  )
  .mapKeeps(([val]) => {
    const result = {};

    val.forEach(([key, val]) => {
      result[key] = val;
    });

    return result;
  });

export const record = parse.oneOf(emptyRecord, nonEmptyRecord);
