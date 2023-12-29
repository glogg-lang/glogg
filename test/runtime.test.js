import { Db } from "#src/runtime";
import * as assert from "node:assert";

describe("Runtime", () => {
  describe("Storing facts", () => {
    it("New facts can be appended", () => {
      const factsToStore = [
        { tag: "person", name: "Nibor" },
        { tag: "person", name: "Robin" },
        { tag: "cat", name: "Percy" },
      ];

      const db = new Db();

      db.commit(factsToStore);

      assert.deepStrictEqual(factsToStore, db.facts);
    });
  });

  describe("Listening to changes", () => {
    it("You can register a change listener, triggered after each commit", () => {
      const db = new Db();

      let triggered = false;

      db.onChange(() => {
        triggered = true;
      });

      db.commit([{ tag: "test" }]);

      assert.ok(triggered);
    });
  });
});
