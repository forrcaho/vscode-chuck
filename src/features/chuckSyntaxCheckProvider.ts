'use strict';

import * as path from 'path';
import * as cp from 'child_process';
import ChildProcess = cp.ChildProcess;

import * as vscode from 'vscode';

export default class ChuckSyntaxCheckProvider {

    private diagnosticCollection!: vscode.DiagnosticCollection;
    private document!: vscode.TextDocument;

    private chuckEMErrorRegex = /^\[([^\]]+)\]:line\((\d+)\)\.char\((\d+)\):\s(.*)$/;
    private chuckEMError2Regex = /^\[([^\]]+)\]:line\((\d+)\):\s(.*)$/;

    private doChuckSyntaxCheck(textDocument: vscode.TextDocument) {
        console.log("entering syntax check code");
        this.document = textDocument;
        if (this.document.languageId !== 'chuck') {
            return;
        }
        this.diagnosticCollection.clear(); // clear any previous errors before re-checking
        let diagnostics: vscode.Diagnostic[] = [];
        let errBuf = '';

        let config = vscode.workspace.getConfiguration("chuck");
        let command = config.get("executable", "chuck");
        let args: string[] = config.get("syntaxCheckArgs", []);
        args.push(textDocument.fileName);
        let options = vscode.workspace.rootPath ? { cwd: vscode.workspace.rootPath } : undefined;

        console.log('About to spawn child process');
        let childProcess = cp.spawn(command, args, options);
        if (childProcess.pid) {
            childProcess.stderr.on('data', (data: Buffer) => {
                console.log("Read from child stderr: " + data);
                errBuf += data;
            });

            childProcess.stderr.on('end', () => {
                console.log("Caught stderr end event");
                let diagnostic : vscode.Diagnostic | undefined;
                for (let errLine of errBuf.split(/\r?\n/)) {
                    diagnostic = this.parseLine(errLine);
                    if (diagnostic) {
                        diagnostics.push(diagnostic);
                    }
                }
                this.diagnosticCollection.set(this.document.uri, diagnostics);
            });
        }
    }

    private parseLine(errLine: string) : vscode.Diagnostic | undefined {
        console.log("Parsing line: " + errLine);
        let match = this.chuckEMErrorRegex.exec(errLine);
        if (match) {
            console.log("Matched first regex");
            let fileName = match[1];
            console.log("fileName: " + fileName + " basename: " + path.basename(this.document.uri.fsPath) );
            if (path.basename(this.document.uri.fsPath) !== fileName) {
                console.log("not this file");
                return;
            }
            let line = +match[2] - 1;
            let char = +match[3] - 1;
            let message = match[4];
            console.log("Making diagnostic: line = " + line + " char = " + char + " message = " + message);
            let range = new vscode.Range(new vscode.Position(line, char), new vscode.Position(line, char+1));
            return new vscode.Diagnostic(range, message);
        }
        match = this.chuckEMError2Regex.exec(errLine);
        if (match) {
            let fileName = match[1];
            if (path.basename(this.document.uri.fsPath) !== fileName) {
                return;
            }
            let line = +match[2] - 1;
            let message = match[3];
            let range = this.document.lineAt(line).range;
            return new vscode.Diagnostic(range, message);
        }
        return;
    }

    public activate(subscriptions: vscode.Disposable[]) {
        subscriptions.push(this);
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection();
        vscode.workspace.onDidOpenTextDocument(this.doChuckSyntaxCheck, this, subscriptions);
        vscode.workspace.onDidCloseTextDocument((textDocument)=> {
            this.diagnosticCollection.delete(textDocument.uri);
        }, null, subscriptions);
        vscode.workspace.onDidSaveTextDocument(this.doChuckSyntaxCheck, this);
    }

    public dispose(): void {
        this.diagnosticCollection.clear();
        this.diagnosticCollection.dispose();
    }
}
