import * as vscode from 'vscode';

import ChuckSyntaxCheckProvider from './chuckSyntaxCheckProvider';
import * as commands from './chuckCommands';

export function activate(context: vscode.ExtensionContext) {

    // syntax checker
    const config = vscode.workspace.getConfiguration("chuck");
    const syntaxCheckEnabled = config.get("enableSyntaxCheck", false);
    if (syntaxCheckEnabled) {
        console.log("Syntax check enabled: loading provider");
        const syntaxChecker = new ChuckSyntaxCheckProvider();
        syntaxChecker.activate(context.subscriptions);
    } else {
        console.log("Syntax check not enabled.");
    }

    // play command
    const playCommand = vscode.commands.registerTextEditorCommand(
        'extension.chuckPlayActiveDocument',
        commands.playActiveDocument);
    context.subscriptions.push(playCommand);

}

// this method is called when your extension is deactivated
export function deactivate() { }
