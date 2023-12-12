import * as parse from "./primitive.js";

export const query = parse.word("commit:").map((_) => ({
  search: [],
  bind: [],
  commit: [],
}));
