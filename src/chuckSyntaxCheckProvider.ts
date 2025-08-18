import * as cp from "node:child_process";
import * as path from "node:path";
import * as vscode from "vscode";
import { fixMSWindowsPath, runningOnMSWindows } from "./utils";

export default class ChuckSyntaxCheckProvider {
  private diagnosticCollection!: vscode.DiagnosticCollection;
  private document!: vscode.TextDocument;
  private config!: vscode.WorkspaceConfiguration;

  // commented-out regexes are pre-1.5 syntax
  //  private chuckEMErrorRegex = /^\[([^\]]+)\]:line\((\d+)\)\.char\((\d+)\):\s(.*)$/;
  private chuckEMErrorRegex = /^([^:]+):(\d+):(\d+):\s(.*)$/;

  //  private chuckEMError2Regex = /^\[([^\]]+)\]:line\((\d+)\):\s(.*)$/;
  private chuckEMError2Regex = /^([^:]+):(\d+):\s(.*)$/;

  private statementEndRegex = /[;\}]/;
  private nonWhitespaceRegex = /\S/;

  private doChuckSyntaxCheck(textDocument: vscode.TextDocument) {
    if (textDocument.languageId !== "chuck") {
      return;
    }
    this.document = textDocument;
    this.config = vscode.workspace.getConfiguration("chuck");
    const diagnostics: vscode.Diagnostic[] = [];
    let errBuf = "";

    const childProcess = this.spawnChuckProcess();
    if (childProcess.pid) {
      childProcess.stderr?.on("data", (data: Buffer) => {
        console.log(`Recevied stderr data event with \n${data}`);
        errBuf += data;
      });

      childProcess.stderr?.on("end", () => {
        console.log(`Received stderr end event`);
        let diagnostic: vscode.Diagnostic | undefined;
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

  private spawnChuckProcess(): cp.ChildProcess {
    const commandName = this.config.get("executable", "chuck");
    const args = [...(this.config.get("syntaxCheckArgs") as string[])];
    const cwd = path.dirname(this.document.fileName);
    if (runningOnMSWindows()) {
      // Windows requires this subprocess to run in a cmd shell and the file path be quoted
      args.push(fixMSWindowsPath(this.document.fileName));
      return cp.spawn(commandName, args, { cwd, shell: true, stdio: "overlapped" });
    }
    // For Mac and Linux, this subprocess does not run in a shell and file path must not be quoted
    args.push(this.document.fileName);
    return cp.spawn(commandName, args, { cwd });
  }

  private parseLine(errLine: string): vscode.Diagnostic | undefined {
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
      const endPosition = new vscode.Position(lineNum, charNum + 1);
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
      const line = this.document.lineAt(lineNum);
      const endPosition = line.range.end;
      let startCharNum = line.isEmptyOrWhitespace ? 0 : line.firstNonWhitespaceCharacterIndex;
      const startPosition = this.getErrorRangeStartPosition(new vscode.Position(lineNum, startCharNum));
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

    let statementEndFound = false;
    let lineNum = reportedStartPosition.line;
    let charNum = reportedStartPosition.character;
    let lineText = this.document.lineAt(lineNum).text;
    lineText = lineText.substring(0, charNum);
    let startPosition = reportedStartPosition;

    while (!statementEndFound) {
      let match = this.statementEndRegex.exec(lineText);
      if (match !== null) {
        statementEndFound = true;
        let lineOffset = match.index + 1;
        lineText = lineText.substring(lineOffset);
        match = this.nonWhitespaceRegex.exec(lineText);
        if (match !== null) {
          startPosition = new vscode.Position(lineNum, lineOffset + match.index);
        }
      } else {
        match = this.nonWhitespaceRegex.exec(lineText);
        if (match !== null) {
          startPosition = new vscode.Position(lineNum, match.index);
        }
      }
      if (lineNum === 0) {
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
    vscode.workspace.onDidCloseTextDocument(
      (textDocument) => {
        this.diagnosticCollection.delete(textDocument.uri);
      },
      null,
      subscriptions
    );
    vscode.workspace.onDidSaveTextDocument(this.doChuckSyntaxCheck, this);

    vscode.workspace.textDocuments.forEach(this.doChuckSyntaxCheck, this);
  }

  public dispose(): void {
    this.diagnosticCollection.clear();
    this.diagnosticCollection.dispose();
  }
}
