// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const { generateTestTemplate, generateTest } = require("js-test-gen");
const fs = require("fs");

/**
 * User messages
 */

// fs related messages
const pathExistsWarning = "Test already exists, cannot overwrite existing test";
const failedToCreateFileWarning = "Failed to write test template to disk";
const failedToCreateFolderWarning = "Failed to write folder to disk";

// common warning's
const noActiveFileWarning = "No active file open to generate test";

// selection related messages
const noSelectionWarning = "No text selected ";
const selectionSuccess = "Test copied to clipboard";
const noTestFromSelectionWarning = "Could not create test from selection";

// Template generation related messages
const templateGenSuccess = "Test Template Generated";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "js-test-gen-vscode" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "extension.generateTestTemplate",
    generateTestFileTemplate
  );

  context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate;

//function generateTest() {}
const getFilePath = (path = "") => path.slice(0, path.lastIndexOf("/"));
const getFileName = (path = "") => {
  return path.slice(path.lastIndexOf("/"), path.length).replace(/\.(js)$/, "");
};

const areExistingTestFile = path => (fs.existsSync(path) ? true : false);

const ensureDirectoryExistence = filePath => {
  if (fs.existsSync(filePath)) {
    return true;
  }
  try {
    fs.mkdirSync(filePath);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

const writeTemplate = (saveLocation, template) => {
  return fs.writeFile(saveLocation, template, err => {
    if (err) {
      console.error(err);
      return vscode.window.showWarningMessage(failedToCreateFileWarning);
    }
    return vscode.window.showInformationMessage(templateGenSuccess);
  });
};

const generateTestFileTemplate = () => {
  let editor = vscode.window.activeTextEditor;
  if (editor) {
    let doc = editor.document;
    const srcFileName = getFileName(doc.fileName);
    const testFilePath = getFilePath(doc.fileName);
    const { testDirName, testSufix } = vscode.workspace.getConfiguration(
      "jstestgen"
    );
    const testFileName = `${srcFileName}${testSufix}.js`; // Add the suffix
    const saveLocation = testDirName
      ? `${testFilePath}/${testDirName}/${testFileName}` // save to user specified loc
      : `${testFilePath}/${testFileName}`; // save to current dir
    if (areExistingTestFile(saveLocation)) {
      return vscode.window.showErrorMessage(pathExistsWarning);
    } else {
      const template = generateTestTemplate({
        contents: doc.getText(),
        srcFileName,
        importFromPath: testDirName ? `../${srcFileName}` : `./${srcFileName}` // important for import
      });
      if (testDirName) {
        // check if able to write to disk
        if (!ensureDirectoryExistence(`${testFilePath}/${testDirName}`)) {
          return vscode.window.showErrorMessage(failedToCreateFolderWarning);
        }
      }
      // Write the contents to the new test file.
      return writeTemplate(saveLocation, template);
    }
  } else {
    return vscode.window.showWarningMessage(noActiveFileWarning);
  }
};
