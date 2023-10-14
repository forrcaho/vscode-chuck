import * as cp from "child_process";
import * as path from "path";
import * as vscode from "vscode";

import { fixMSWindowsPath, runningOnMSWindows } from "./utils";

let output: vscode.OutputChannel;
const processMap: { [pid: number]: cp.ChildProcess | undefined } = {};

export async function playActiveDocument(textEditor: vscode.TextEditor) {
  const config = vscode.workspace.getConfiguration("chuck");
  const document = textEditor.document;
  if (document.languageId !== "chuck") {
    return;
  }
  if (document.isDirty) {
    if (!config.get("saveSilentlyOnPlay")) {
      const selection = await saveToPlayDialog();
      if (selection === "Cancel") {
        return;
      }
    }
    await document.save();
  }

  if (output === undefined) {
    output = vscode.window.createOutputChannel("ChucK output");
  }

  const command = config.get("executable", "chuck");
  // We need to clone the args array because if we don't, when we push the filename on, it
  // will actually go into the config in memory, and be in the args of our next play command.
  const args: string[] = [...config.get("playArgs", [])];
  const fileName = fixMSWindowsPath(document.fileName);
  args.push(`"${fileName}"`);
  const options: cp.SpawnOptions = { cwd: path.dirname(fileName) };
  if (runningOnMSWindows()) {
    options.shell = true;
  }
  const childProcess = cp.spawn(command, args, options);
  processMap[childProcess.pid] = childProcess;

  childProcess.stdout.on("data", (data) => {
    output.append(data.toString());
    output.show(true); // show output but preserve focus
  });
  childProcess.stderr.on("data", (data) => {
    output.append(data.toString());
    output.show(true); // show output but preserve focus
  });

  childProcess.on("exit", () => {
    console.log("Chuck is done.");
  });

  if (childProcess.pid) {
    console.log(`Chuck is playing (pid ${childProcess.pid})`);
  }
}

async function saveToPlayDialog(): Promise<string> {
  const selected = await vscode.window.showInformationMessage<vscode.MessageItem>(
    "Save file for ChucK to play?",
    { modal: true },
    { title: "Cancel", isCloseAffordance: true },
    { title: "Save", isCloseAffordance: false },
    { title: "Always silently save before playing", isCloseAffordance: false }
  );

  if (selected) {
    if (selected.title === "Always silently save before playing") {
      setSaveSilentlyOnPlay();
      return "Save";
    } else {
      return selected.title;
    }
  }
  return "Cancel";
}

async function setSaveSilentlyOnPlay() {
  const config = vscode.workspace.getConfiguration("chuck");
  config.update("saveSilentlyOnPlay", true, true);
}

export function killChuckProcess() {
  for (let pid in processMap) {
    let p = processMap[pid];
    if (p === undefined) {
      delete processMap[pid];
    } else {
      console.log(`Killing Chuck process (pid ${p.pid})`);
      if (runningOnMSWindows()) {
        cp.exec(`taskkill -F -T -PID ${p.pid}`);
      } else {
        p.kill("SIGTERM");
      }
      console.log("Chuck subprocess terminated");
    }
  }
}
