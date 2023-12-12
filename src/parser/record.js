import * as parse from "./primitive.js";
import * as atom from "./atom.js";

export const emptyRecord = parse
  .sequence(parse.char("["), atom.whitespace, parse.char("]"))
  .map((_) => ({}));

export const nonEmptyRecord = parse.sequence(parse.char("["), parse.char("]"));

export const record = parse.oneOf(emptyRecord, nonEmptyRecord);
