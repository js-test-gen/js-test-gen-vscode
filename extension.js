// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const { generateTestTemplate, generateTest } = require("js-test-gen");
const clipboardy = require("clipboardy");
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

function activate(context) {
  let testFromFile = vscode.commands.registerCommand(
    "extension.generateTestTemplate",
    generateTestFileTemplate
  );

  let testFromSelection = vscode.commands.registerCommand(
    "extension.generateTest",
    generateTestFromSelection
  );

  context.subscriptions.push(testFromFile);
  context.subscriptions.push(testFromSelection);
}
exports.activate = activate;

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

const generateTestFromSelection = () => {
  let editor = vscode.window.activeTextEditor;
  if (editor) {
    const selection = editor.selection;
    const text = editor.document.getText(selection);
    if (selection) {
      const template = generateTest(text);
      if (template) {
        // Check if their is actually a template, it could be an empty string
        clipboardy.writeSync(template);
        return vscode.window.showInformationMessage(selectionSuccess);
      }
      return vscode.window.showWarningMessage(noTestFromSelectionWarning);
    } else {
      return vscode.window.showWarningMessage(noSelectionWarning);
    }
  }
  return vscode.window.showWarningMessage(noActiveFileWarning);
};
