'use strict';

import * as path from 'path';
import * as cp from 'child_process';
import ChildProcess = cp.ChildProcess;

import * as vscode from 'vscode';

export function playActiveDocument(textEditor: vscode.TextEditor) {
    let document = textEditor.document;
    if (document.isDirty) {
        // TODO: have a config setting controlling whether to prompt
        // or save silently here.
        document.save();
    }
    let config = vscode.workspace.getConfiguration("chuck");
    let command = config.get("executable", "chuck");
    // We need to clone the args array because if we don't, when we push the filename on, it
    // will actually go into the config in memory, and be in the args of our next syntax check.
    let args: string[] = [...config.get("playArgs", [])];
    args.push(document.fileName);
    let options = { cwd: path.dirname(document.fileName) };

    let childProcess = cp.spawn(command, args, options);
    if (childProcess.pid) {
        console.log("Chuck is playing");
    }
}