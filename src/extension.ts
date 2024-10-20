import * as vscode from 'vscode';

import ChuckSyntaxCheckProvider from './chuckSyntaxCheckProvider';
import ChuckHoverProvider from './chuckHoverProvider';
import * as commands from './chuckCommands';

export function activate(context: vscode.ExtensionContext) {

    // syntax checker
    const config = vscode.workspace.getConfiguration("chuck");
    const syntaxCheckEnabled = config.get("enableSyntaxCheck", false);
    if (syntaxCheckEnabled) {
        const syntaxChecker = new ChuckSyntaxCheckProvider();
        syntaxChecker.activate(context.subscriptions);
    }
    // hover provider
    const hoverProvider = new ChuckHoverProvider();
    vscode.languages.registerHoverProvider({language: "chuck"}, hoverProvider);

    // play command
    const playCommand = vscode.commands.registerTextEditorCommand(
        'extension.chuckPlayActiveDocument',
        commands.playActiveDocument);
    context.subscriptions.push(playCommand);

    const killCommand = vscode.commands.registerTextEditorCommand(
        'extension.chuckKillChuckProcess',
        commands.killChuckProcess);
    context.subscriptions.push(killCommand);
}

// this method is called when your extension is deactivated
export function deactivate() {
    commands.killChuckProcess();
}
