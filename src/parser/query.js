import * as parse from "./primitive.js";
import * as atom from "./atom.js";
import * as rec from "./record.js";

export const query = parse
  .sequence(
    parse.word("commit:"),
    atom.whitespace,
    parse.nOrMore(1, rec.nonEmptyRecord).keep(),
  )
  .mapKeeps(([records]) => ({
    search: [],
    bind: [],
    commit: records,
  }));
