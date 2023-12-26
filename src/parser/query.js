import * as parse from "./primitive.js";
import * as atom from "./atom.js";
import * as rec from "./record.js";

const context = parse
  .sequence(parse.char("@"), atom.name.keep())
  .mapKeeps(([name]) => name);

const unconditionalCommit = parse
  .sequence(
    atom.whitespace,
    parse.word("commit"),
    atom.whitespace,
    parse.optional(context).keep(),
    atom.whitespace,
    parse.char(":"),
    atom.whitespace,
    parse.nOrMore(1, rec.nonEmptyRecord).keep(),
  )
  .mapKeeps(([context, records]) => ({
    search: emptyBlock(),
    bind: emptyBlock(),
    commit: {
      context: context,
      steps: records,
    },
  }));

const unconditionalBind = parse
  .sequence(
    atom.whitespace,
    parse.word("bind"),
    atom.whitespace,
    parse.optional(context).keep(),
    atom.whitespace,
    parse.char(":"),
    atom.whitespace,
    parse.nOrMore(1, rec.nonEmptyRecord).keep(),
  )
  .mapKeeps(([context, records]) => ({
    search: emptyBlock(),
    bind: {
      context: context,
      steps: records,
    },
    commit: emptyBlock(),
  }));

const conditionalQuery = parse
  .sequence(
    atom.whitespace,
    parse.word("search"),
    atom.whitespace,
    parse.optional(context).keep(),
    atom.whitespace,
    parse.char(":"),
    atom.whitespace,
    parse.nOrMore(1, rec.nonEmptyRecord).keep(),
    parse.oneOf(unconditionalCommit, unconditionalBind).keep(),
  )
  .mapKeeps(([searchContext, searchRecords, modifierRecords]) => ({
    search: {
      context: searchContext,
      steps: searchRecords,
    },
    bind: modifierRecords.bind,
    commit: modifierRecords.commit,
  }));

export const query = parse.oneOf(unconditionalCommit, conditionalQuery);

function emptyBlock() {
  return {
    context: null,
    steps: [],
  };
}
