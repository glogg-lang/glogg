import * as ast from "#src/ast";
import * as db from "#src/db";
import * as assert from "node:assert";

describe("AST", () => {
  describe("save", () => {
    it("Parsed AST can be stored into a database", async () => {
      const store = await db.setup(":memory:");

      await ast.save(
        store,
        'commit: [#person name: "Robin" pets: 2 role: role]',
      );

      const extracted = await ast.load(store);

      assert.equal(
        ["commit:", '  [ #person name: "Robin" pets: 2 role: role ]'].join(
          "\n",
        ),
        extracted,
      );
    });
  });
});
