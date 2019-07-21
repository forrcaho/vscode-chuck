'use strict';

import * as path from 'path';
import * as cp from 'child_process';

import * as vscode from 'vscode';

export async function playActiveDocument(textEditor: vscode.TextEditor) {
    const config = vscode.workspace.getConfiguration("chuck");
    const document = textEditor.document;
    if (document.isDirty) {
        if (!config.get("saveSilentlyOnPlay")) {
            const selection = await saveToPlayDialog();
            if (selection === "Cancel") {
                return;
            }
        }
        document.save();
    }
    const command = config.get("executable", "chuck");
    // We need to clone the args array because if we don't, when we push the filename on, it
    // will actually go into the config in memory, and be in the args of our next syntax check.
    const args: string[] = [...config.get("playArgs", [])];
    args.push(document.fileName);
    const options = { cwd: path.dirname(document.fileName) };

    const childProcess = cp.spawn(command, args, options);
    if (childProcess.pid) {
        console.log("Chuck is playing");
    }
}

async function saveToPlayDialog(): Promise<string> {

    const selected = await vscode.window.showInformationMessage<vscode.MessageItem>(
        "Save file for ChucK to play?",
        { modal: true },
        { title: "Cancel", isCloseAffordance: true },
        { title: "Save", isCloseAffordance: false },
        { title: "Always silently save before playing", isCloseAffordance: false })

        .then((selected) => {
            if (selected) {
                if (selected.title === "Always silently save before playing") {
                    setSaveSilentlyOnPlay();
                }
                return "Save";
            } else {
                return "Cancel";
            }
        });
    return selected;
}

async function setSaveSilentlyOnPlay() {
    const config = vscode.workspace.getConfiguration("chuck");
    config.update("saveSilentlyOnPlay", "true", true);
}
