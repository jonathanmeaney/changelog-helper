// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { window, workspace, commands, ExtensionContext, extensions }  from 'vscode';
import { posix } from 'path';

import LocalStorageService from './utils/localStorageService';
import { multiStepInput, multiSelectInput } from './inputs/multiStepInput';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
  let disposable = commands.registerCommand('changelog-helper.create', async () => {
		if (!workspace.workspaceFolders) {
			return window.showErrorMessage('No folder or workspace opened');
		}

		try{
      const storageManager = new LocalStorageService(context.globalState);
      let changeLogTypes = [];

      try{
        const storageChangeLogTypes : any = storageManager.getValue('changeLogTypes');
        if(storageChangeLogTypes){
          changeLogTypes = JSON.parse(storageChangeLogTypes);
        }
      }catch(error){
        window.showErrorMessage(`Failed to get from storage: ${error}`);
      }

			const gitExtension = (extensions.getExtension('vscode.git') || {}).exports;
			const api = gitExtension.getAPI(1);
			const repo = api.repositories[0];
			const head = repo.state.HEAD || {};

			// Get the branch and commit
			const {commit, name: branch} = head;

			// Format for Jira ticket ID.
			// Starts with any number of characters
			// followed by - or _
			// followed by any number of numbers
			// No additional characters after
			const format = /^[a-z]+[_-][0-9]+/i;
			let suggestedTicket = branch.match(format);
			if(suggestedTicket){
				suggestedTicket = suggestedTicket[0].replace(/[_]/g,'-').toUpperCase();
			}

			// Get log type and ticket number
			const {
        changeLogType,
        ticket,
        includeDeployTasks
      } = await multiStepInput(suggestedTicket, changeLogTypes);

      try{
        const defaultTypes = ["Improvements", "Bug Fixes"];

        if(!defaultTypes.includes(changeLogType) && !changeLogTypes.includes(changeLogType)){
          changeLogTypes.push(changeLogType)
          storageManager.setValue('changeLogTypes', JSON.stringify(changeLogTypes));
        }
      }catch(error){
        window.showErrorMessage(`Failed to update storage: ${error}`);
      }

			// Write to file
			const fileName = `${ticket}.yml`;
			let dataString = `${changeLogType}: "${ticket}: "`;

			// If deploy tasks to be included
			if(includeDeployTasks){
				dataString = `${dataString}\nDeploy Tasks: ""`;
			}

			let writeData = Buffer.from(dataString, 'utf8');

			const folderUri = workspace.workspaceFolders[0].uri;
			const fileUri = folderUri.with({ path: posix.join(`${folderUri.path}/change_log/next`, fileName) });

			await workspace.fs.writeFile(fileUri, writeData);

			// Display file
			window.showTextDocument(fileUri);

			// Display a message box to the user
			window.showInformationMessage(`Created changelog: ${fileName}`);
		}catch(error){
			// Display a message box to the user
			window.showErrorMessage(`Failed to create changelog: ${error}`);
		}
	});

	context.subscriptions.push(disposable);

  disposable = commands.registerCommand('changelog-helper.edit', async () => {
		if (!workspace.workspaceFolders) {
			return window.showErrorMessage('No folder or workspace opened');
		}

		try{
      const storageManager = new LocalStorageService(context.globalState);
      let changeLogTypes = [];

      try{
        const storageChangeLogTypes : any = storageManager.getValue('changeLogTypes');
        if(storageChangeLogTypes){
          changeLogTypes = JSON.parse(storageChangeLogTypes);
        }
      }catch(error){
        window.showErrorMessage(`Failed to get from storage: ${error}`);
      }

			// Get the list of types to remove
			const {
        changeLogTypesToRemove
      } = await multiSelectInput(changeLogTypes);

      try{
        changeLogTypes = changeLogTypes.filter((el: string) => {
          return !changeLogTypesToRemove.includes(el);
        });
        storageManager.setValue('changeLogTypes', JSON.stringify(changeLogTypes));
      }catch(error){
        window.showErrorMessage(`Failed to update storage: ${error}`);
      }

			// Display a message box to the user
			window.showInformationMessage(`Removed selected changelog types`);
		}catch(error){
			// Display a message box to the user
			window.showErrorMessage(`Failed to remove selected changelog types: ${error}`);
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
