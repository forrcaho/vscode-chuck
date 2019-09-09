'use strict';

import * as path from 'path';
import * as cp from 'child_process';

import * as vscode from 'vscode';

export default class ChuckSyntaxCheckProvider {

    private diagnosticCollection!: vscode.DiagnosticCollection;
    private document!: vscode.TextDocument;
    private config!: vscode.WorkspaceConfiguration;

    private chuckEMErrorRegex = /^\[([^\]]+)\]:line\((\d+)\)\.char\((\d+)\):\s(.*)$/;
    private chuckEMError2Regex = /^\[([^\]]+)\]:line\((\d+)\):\s(.*)$/;

    private doChuckSyntaxCheck(textDocument: vscode.TextDocument) {
        console.log("entering syntax check code");
        if (textDocument.languageId !== 'chuck') {
            return;
        }
        this.document = textDocument;
        this.config = vscode.workspace.getConfiguration("chuck");
        const diagnostics: vscode.Diagnostic[] = [];
        let errBuf = '';

        const command = this.config.get("executable", "chuck");
        // We need to clone the args array because if we don't, when we push the filename on, it
        // will actually go into the config in memory, and be in the args of our next syntax check.
        const args: string[] = [...this.config.get("syntaxCheckArgs", [])];
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
            const lineNum = +match[2] - 1;
            const charNum = +match[3] - 1;
            const message = match[4];
            const endPosition = new vscode.Position(lineNum, charNum+1);
            const startPosition = this.getErrorRangeStartPosition(new vscode.Position(lineNum, charNum));
            const range = new vscode.Range(startPosition, endPosition);
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
            const lineNum = +match[2] - 1;
            const message = match[3];
            const line = this.document.lineAt(lineNum)
            const endPosition = line.range.end;
            const startPosition = this.getErrorRangeStartPosition(line.range.start);
            const range = new vscode.Range(startPosition, endPosition);
            return new vscode.Diagnostic(range, message);
        }
        return;
    }

    private getErrorRangeStartPosition(reportedStartPosition: vscode.Position): vscode.Position {
        if (!this.config.get("extendErrorRegion")) {
            return reportedStartPosition;
        }
        // Find the first ";" or "}" before reportedStartPosition, and return
        // the posiition of the first non-whitespace character found after.

        // We don't try to parse out comments in this code, which means we might
        // find an end-of-block in a comment (especially commented-out code).
        // I didn't think it was worth the effort to avoid this. If you want to
        // fix it, please submit a PR.

        const statementEndRegex = /[;\}]/;
        const nonWhitespaceRegex = /\S/;
        let statementEndFound = false;
        let lineNum = reportedStartPosition.line;
        let charNum = reportedStartPosition.character;
        let lineText = this.document.lineAt(lineNum).text;
        console.log("Examining line: " + lineText);

        lineText = lineText.substring(0, charNum);
        console.log("Examining line text: " + lineText);
        let startPosition = reportedStartPosition;
        
        while (!statementEndFound) {
            let match = statementEndRegex.exec(lineText);
            if (match !== null) {
                statementEndFound = true;
                let lineOffset = match.index+1;
                lineText = lineText.substring(lineOffset);
                match = nonWhitespaceRegex.exec(lineText);
                if (match !== null) {
                    startPosition = new vscode.Position(lineNum, lineOffset + match.index);
                }
            } else {
                match = nonWhitespaceRegex.exec(lineText);
                if (match !== null) {
                    startPosition = new vscode.Position(lineNum, match.index);
                }
            }
            if (lineNum == 0) {
                statementEndFound = true;
            }
            if (!statementEndFound) {
                lineNum--;
                lineText = this.document.lineAt(lineNum).text;
            }
        }
        return startPosition;
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
