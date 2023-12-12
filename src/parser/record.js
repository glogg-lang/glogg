import * as parse from "./primitive.js";

export const emptyRecord = parse.sequence(parse.char("["), parse.char("]"));

export const nonEmptyRecord = parse.sequence(parse.char("["), parse.char("]"));

export const record = parse.oneOf(emptyRecord, nonEmptyRecord);
