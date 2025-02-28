import proc from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import * as glogg from "glogg-lang";

const tmpDir = ".e2etmp";
const tmpDirPath = path.join(process.cwd(), tmpDir);
const dbPath = path.join(process.cwd(), tmpDir, "db");

describe("E2E", () => {
  beforeEach(async () => {
    fs.mkdirSync(tmpDirPath);
    await glogg.init(dbPath);
    await glogg.addIntegration(dbPath, "terminal", "glogg-lang/terminal");
  });

  afterEach(() => {
    fs.rmSync(tmpDirPath, { recursive: true, force: true });
  });

  it("ancestor query", async () => {
    const result = await compileAndRun(`
commit:
  [ #duck name: "Scrooge" ]
  [ #duck name: "Donald" uncle: "Scrooge" ]
  [ #duck name: "Hewie" uncle: "Donald" ]
  [ #duck name: "Dewie" uncle: "Donald" ]
  [ #duck name: "Louie" uncle: "Donald" ]

search:
  [ #duck name: scrooges-nephew uncle: "Scrooge" ]
  [ #duck name: name uncle: scrooges-nephew ]
commit @terminal:
  [ #log message: name ]
`);

    assert.equal(["Hewie", "Dewie", "Louie", ""].join("\n"), result);
  });
});

async function compileAndRun(code) {
  await glogg.edit(dbPath, { code: code });
  const compiled = await glogg.make(dbPath);

  fs.writeFileSync(path.join(tmpDirPath, "app.js"), compiled, {
    encoding: "utf8",
  });

  return proc.execSync("node app.js", {
    cwd: tmpDirPath,
    encoding: "utf8",
  });
}
