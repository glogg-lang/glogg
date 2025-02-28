import process from "node:process";
import path from "node:path";
import fs from "node:fs";
import childProcess from "node:child_process";
import * as glogDb from "#src/db";
import * as persistence from "#src/persistence";
import * as codegen from "#src/codegen";

export async function init(dbPath) {
  const store = await glogDb.setup(dbPath);
  store.close();
}

export async function edit(dbPath, { editor, code }) {
  const store = await glogDb.setup(dbPath);

  if (code) {
    try {
      await persistence.save(store, code);
    } catch (e) {
      throw e;
    } finally {
      store.close();
    }

    return;
  }

  const draftPath = path.join(process.cwd(), "draft.glogg");

  const existingCode = await persistence.load(store);
  fs.writeFileSync(draftPath, existingCode, { encoding: "utf8" });

  childProcess.spawnSync(editor, [draftPath], { stdio: "inherit" });

  const writtenCode = fs.readFileSync(draftPath, { encoding: "utf8" });

  if (writtenCode.trim() !== existingCode.trim()) {
    const tmpPath = dbPath + ".tmp";
    const tmpStore = await glogDb.setup(tmpPath);

    await persistence.save(tmpStore, writtenCode);

    const existingIntegrations = await glogDb.all(
      "SELECT * FROM integration",
      {},
      store,
    );

    for (let integration of existingIntegrations) {
      await persistence.addIntegration(
        tmpStore,
        integration.context_prefix,
        integration.import_name,
      );
    }

    store.close();
    tmpStore.close();

    fs.rmSync(dbPath);
    fs.renameSync(tmpPath, dbPath);
  } else {
    store.close();
  }

  fs.rmSync(draftPath);
}

export async function make(dbPath) {
  const store = await glogDb.setup(dbPath);

  try {
    return await codegen.make(store);
  } catch (e) {
    throw e;
  } finally {
    store.close();
  }
}

export async function addIntegration(dbPath, contextPrefix, importName) {
  const store = await glogDb.setup(dbPath);

  try {
    await persistence.addIntegration(store, contextPrefix, importName);
  } catch (e) {
    throw e;
  } finally {
    store.close();
  }
}

export function getDbPath() {
  const dbPath = path.join(process.cwd(), "app.glogg.db");
  const exists = fs.existsSync(dbPath);

  return [exists, dbPath];
}
