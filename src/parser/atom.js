import * as parse from "./primitive.js";

export const whitespace = parse.nOrMore(0, parse.whitespace);
