import * as parse from "./primitive.js";
import * as atom from "./atom.js";
import * as rec from "./record.js";

const unconditionalCommit = parse
  .sequence(
    atom.whitespace,
    parse.word("commit:"),
    atom.whitespace,
    parse.nOrMore(1, rec.nonEmptyRecord).keep(),
  )
  .mapKeeps(([records]) => ({
    search: [],
    bind: [],
    commit: records,
  }));

const unconditionalBind = parse
  .sequence(
    atom.whitespace,
    parse.word("bind:"),
    atom.whitespace,
    parse.nOrMore(1, rec.nonEmptyRecord).keep(),
  )
  .mapKeeps(([records]) => ({
    search: [],
    bind: records,
    commit: [],
  }));

const conditionalQuery = parse
  .sequence(
    atom.whitespace,
    parse.word("search:"),
    atom.whitespace,
    parse.nOrMore(1, rec.nonEmptyRecord).keep(),
    parse.oneOf(unconditionalCommit, unconditionalBind).keep(),
  )
  .mapKeeps(([searchRecords, modifierRecords]) => ({
    search: searchRecords,
    bind: modifierRecords.bind,
    commit: modifierRecords.commit,
  }));

export const query = parse.oneOf(unconditionalCommit, conditionalQuery);
