import proc from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

const tmpDir = ".e2etmp";
const tmpDirPath = path.join(process.cwd(), tmpDir);

describe("E2E", () => {
  beforeEach(() => {
    fs.mkdirSync(tmpDir);
    proc.execSync("../bin/glg init", {
      cwd: tmpDirPath,
    });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("ancestor query", () => {
    const result = compileAndRun(`
commit:
  [ #duck name: "Scrooge" ]
  [ #duck name: "Donald" uncle: "Scrooge" ]
  [ #duck name: "Hewie" uncle: "Donald" ]
  [ #duck name: "Dewie" uncle: "Donald" ]
  [ #duck name: "Louie" uncle: "Donald" ]

search:
  [ #duck name: scrooges-nephew uncle: "Scrooge" ]
  [ #duck name: name uncle: scrooges-nephew ]
commit @stdio:
  [ #log message: name ]
`);

    assert.equal(["Hewie", "Dewie", "Louie", ""].join("\n"), result);
  });
});

function compileAndRun(code) {
  proc.execSync("../bin/glg edit --from=stdin", {
    cwd: tmpDirPath,
    input: code.trim(),
  });

  proc.execSync("../bin/glg make", {
    cwd: tmpDirPath,
  });

  return proc.execSync("node app.js", {
    cwd: tmpDirPath,
    encoding: "utf8",
  });
}
