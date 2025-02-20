import { Db } from "#src/runtime";
import assert from "node:assert";

describe("Runtime", () => {
  describe("Storing facts", () => {
    it("New facts can be appended", () => {
      const factsToStore = [
        { tag: "person", name: "Nibor" },
        { tag: "person", name: "Robin" },
        { tag: "cat", name: "Percy" },
      ];

      const db = new Db();

      db.commit(factsToStore.slice(0, -1));
      db.commit(factsToStore.slice(2));

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

  describe("Values are de-duplicated on commits", () => {
    const db = new Db();

    db.commit([{ tag: "test" }]);
    db.commit([{ tag: "test" }]);

    assert.deepStrictEqual(db.facts, [{ tag: "test" }]);
  });

  describe("Listeners are only triggered when the database _actually_ changes", () => {
    const db = new Db();

    let triggered = 0;

    db.onChange(() => {
      triggered += 1;
    });

    db.commit([{ tag: "test" }]);
    db.commit([{ tag: "test" }]);

    assert.strictEqual(1, triggered);
  });
});
