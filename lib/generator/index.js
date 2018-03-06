const vscodeLib = require("vscode");
const clipboardy = require("clipboardy");
const fs = require("fs");
const { generateTestTemplate, generateTest } = require("js-test-gen");
const {
  failedToCreateFileWarning,
  templateGenSuccess,
  pathExistsWarning,
  noSelectionWarning,
  selectionSuccess,
  noTestFromSelectionWarning,
  failedToCreateFolderWarning,
  templateGenFailed,
  noActiveFileWarning
} = require("../notifications");

/**
 * File related utils
 */
const createDir = (filePath, vscode = vscodeLib) => {
  try {
    fs.mkdirSync(filePath);
    return true;
  } catch (err) {
    console.error(err);
    vscode.window.showWarningMessage(failedToCreateFolderWarning);
    return false;
  }
};
// path up to just before fileName
const getFilePath = (path = "") => path.slice(0, path.lastIndexOf("/"));
// fileName without extension
const getFileName = (path = "") =>
  path
    .slice(path.lastIndexOf("/") + 1, path.length)
    .replace(/\.(js|ts|jsx|tsx)$/, "");

// no dirName specified ? import code from "./" : else "../"
const determinePath = (dirName = "", fileName = "") =>
  dirName ? `../${fileName}` : `./${fileName}`;

// No dirName specified ? write to current dir : write to specified dir
const determineSaveLoc = (dirName = "", filePath = "", fileName = "") =>
  dirName
    ? `${filePath}/${dirName}/${fileName}` // save to user specified loc
    : `${filePath}/${fileName}`; // save to current dir

// We dont want to overwrite an existing test file.
const doesPathExist = path => fs.existsSync(path);

const writeTemplate = (saveLocation, template, vscode = vscodeLib) => {
  return fs.writeFile(saveLocation, template, err => {
    if (err) {
      console.error(err);
      return vscode.window.showWarningMessage(failedToCreateFileWarning);
    }
    return vscode.window.showInformationMessage(templateGenSuccess);
  });
};

/**
 * User setting
 */

const determineTypeSystem = (typeSystem = "") => {
  if (typeSystem === "None") {
    return "";
  }
  return typeSystem.toUpperCase();
};

const generateTestFileTemplate = (vscode = vscodeLib) => {
  let editor = vscode.window.activeTextEditor;
  if (editor) {
    let doc = editor.document;
    // user settings
    const {
      testDirName,
      testSufix,
      typeSystem
    } = vscode.workspace.getConfiguration("jstestgen");
    // file info: Name, path
    const srcFileName = getFileName(doc.fileName);
    const filePath = getFilePath(doc.fileName);
    // generated test info: testFileName, saveLocation for test
    const testFileName = `${srcFileName}${testSufix}.js`; // Add the suffix
    const saveLocation = determineSaveLoc(testDirName, filePath, testFileName);

    // Do not overwrite users current test files !!!!
    if (doesPathExist(saveLocation)) {
      return vscode.window.showErrorMessage(pathExistsWarning);
    } else {
      // This is the test template
      const template = generateTestTemplate({
        contents: doc.getText(),
        srcFileName,
        importFromPath: determinePath(testDirName, srcFileName), // important for import
        typeSystem: determineTypeSystem(typeSystem)
      });
      // possibility template could be an empty string
      if (!template) {
        return vscode.window.showErrorMessage(templateGenFailed);
      }
      // check and write to user defined folder if it exists
      // write folder to disk if test folder specified
      const desiredPath = `${filePath}/${testDirName}`;
      if (testDirName && !doesPathExist(desiredPath)) {
        // check if able to write to disk
        createDir(desiredPath);
      }
      // Write the contents to the new test file.
      return writeTemplate(saveLocation, template);
    }
  }
  return vscode.window.showWarningMessage(noActiveFileWarning);
};

const generateTestFromSelection = (vscode = vscodeLib) => {
  let editor = vscode.window.activeTextEditor;
  if (editor) {
    const selection = editor.selection;
    const text = editor.document.getText(selection);
    if (text) {
      const { typeSystem } = vscode.workspace.getConfiguration("jstestgen");
      const template = generateTest(text, determineTypeSystem(typeSystem));

      // Check if their is actually a template, it could be an empty string
      if (template) {
        clipboardy.writeSync(template);
        return vscode.window.showInformationMessage(selectionSuccess);
      }
      return vscode.window.showWarningMessage(noTestFromSelectionWarning);
    }
    return vscode.window.showWarningMessage(noSelectionWarning);
  }
  return vscode.window.showWarningMessage(noActiveFileWarning);
};

module.exports = {
  generateTestFileTemplate,
  generateTestFromSelection
};
