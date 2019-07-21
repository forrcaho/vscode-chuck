'use strict';

import * as path from 'path';
import * as cp from 'child_process';

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
        const diagnostics: vscode.Diagnostic[] = [];
        let errBuf = '';

        const config = vscode.workspace.getConfiguration("chuck");
        const command = config.get("executable", "chuck");
        // We need to clone the args array because if we don't, when we push the filename on, it
        // will actually go into the config in memory, and be in the args of our next syntax check.
        const args: string[] = [...config.get("syntaxCheckArgs", [])];
        args.push(textDocument.fileName);
        const options = { cwd: path.dirname(this.document.fileName) };

        const childProcess = cp.spawn(command, args, options);
        if (childProcess.pid) {
            childProcess.stderr.on('data', (data: Buffer) => {
                errBuf += data;
            });

            childProcess.stderr.on('end', () => {
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
        let match = this.chuckEMErrorRegex.exec(errLine);
        if (match) {
            const fileName = match[1];
            if (path.basename(this.document.uri.fsPath) !== fileName) {
                // TODO: it _might_ be possible to return diagnostics for files other
                // than the currently active one if they're open in another tab.
                console.log("Syntax error for a different file");
                return;
            }
            const line = +match[2] - 1;
            const char = +match[3] - 1;
            const message = match[4];
            const range = new vscode.Range(new vscode.Position(line, char), new vscode.Position(line, char+1));
            return new vscode.Diagnostic(range, message);
        }
        match = this.chuckEMError2Regex.exec(errLine);
        if (match) {
            const fileName = match[1];
            if (path.basename(this.document.uri.fsPath) !== fileName) {
                // See TODO above
                console.log("Syntax error for a different file");
                return;
            }
            const line = +match[2] - 1;
            const message = match[3];
            const range = this.document.lineAt(line).range;
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

        vscode.workspace.textDocuments.forEach(this.doChuckSyntaxCheck, this);
    }

    public dispose(): void {
        this.diagnosticCollection.clear();
        this.diagnosticCollection.dispose();
    }
}
