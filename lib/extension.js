// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const {
  generateTestFileTemplate,
  generateTestFromSelection
} = require("./generator");

function activate(context) {
  let testFromFile = vscode.commands.registerCommand(
    "jsTestGen.generateTestTemplate",
    generateTestFileTemplate
  );

  let testFromSelection = vscode.commands.registerCommand(
    "jsTestGen.generateTest",
    generateTestFromSelection
  );

  context.subscriptions.push(testFromFile);
  context.subscriptions.push(testFromSelection);
}
exports.activate = activate;

function deactivate() {}
exports.deactivate = deactivate;
