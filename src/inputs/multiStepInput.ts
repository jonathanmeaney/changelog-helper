/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  QuickPickItem,
  window,
  Disposable,
  QuickInput,
  QuickInputButtons,
} from "vscode";

function shouldResume() {
  // Could show a notification with the option to resume.
  return new Promise<boolean>((resolve, reject) => {
    // noop
  });
}

/**
 * A multi-step input using window.createQuickPick() and window.createInputBox().
 *
 * This first part uses the helper class `MultiStepInput` that wraps the API for the multi-step case.
 */
export async function multiStepInput(
  suggestedTicket: string,
  changeLogTypes: string[]
) {
  const changeLogTypeItems: QuickPickItem[] = [
    "Improvements",
    "Bug Fixes",
    ...changeLogTypes,
    "Other",
  ].map((label) => ({ label }));

  const includeDeployTasks: QuickPickItem[] = ["No", "Yes"].map((label) => ({
    label,
  }));

  interface State {
    title: string;
    step: number;
    totalSteps: number;
    changeLogType: string;
    includeDeployTasks: string;
    ticket: string;
    runtime: QuickPickItem;
  }

  async function collectInputs() {
    const state = {} as Partial<State>;
    await MultiStepInput.run((input) => pickChangeLogTypeGroup(input, state));
    return state as State;
  }

  const title = "Create Changelog";

  async function pickChangeLogTypeGroup(
    input: MultiStepInput,
    state: Partial<State>
  ) {
    const selection = await input.showQuickPick({
      title,
      step: 1,
      totalSteps: 3,
      placeholder: "Pick a changelog type",
      items: changeLogTypeItems,
      canSelectMany: false,
      activeItem:
        typeof state.changeLogType !== "string"
          ? state.changeLogType
          : undefined,
      shouldResume: shouldResume,
    });

    state.changeLogType = selection.label;
    if (state.changeLogType == "Other") {
      return (input: MultiStepInput) => inputOtherChangelogType(input, state);
    }
    return (input: MultiStepInput) => pickIncludeDeployTasksGroup(input, state);
  }

  async function inputOtherChangelogType(
    input: MultiStepInput,
    state: Partial<State>
  ) {
    state.changeLogType = await input.showInputBox({
      title,
      step: 1,
      totalSteps: 3,
      value: "",
      prompt: "Please enter a custom changelog type",
      validate: async () => undefined,
      shouldResume: shouldResume,
    });

    return (input: MultiStepInput) => pickIncludeDeployTasksGroup(input, state);
  }

  async function pickIncludeDeployTasksGroup(
    input: MultiStepInput,
    state: Partial<State>
  ) {
    const selection = await input.showQuickPick({
      title,
      step: 2,
      totalSteps: 3,
      placeholder: "Include deploy tasks?",
      items: includeDeployTasks,
      canSelectMany: false,
      activeItem:
        typeof state.includeDeployTasks !== "string"
          ? state.includeDeployTasks
          : undefined,
      shouldResume: shouldResume,
    });
    state.includeDeployTasks = selection.label;

    return (input: MultiStepInput) => inputTicketID(input, state);
  }

  async function inputTicketID(input: MultiStepInput, state: Partial<State>) {
    state.ticket = await input.showInputBox({
      title,
      step: 3,
      totalSteps: 3,
      value: suggestedTicket || "",
      prompt: "What is the Jira ticket ID? e.g. PVE-1234",
      validate: validateInputTicketID,
      shouldResume: shouldResume,
    });
  }

  async function validateInputTicketID(str: string) {
    return /^[a-z]+[-][0-9]+$/i.test(str)
      ? undefined
      : "The ticket ID should be something like PVE-1234";
  }

  const state = await collectInputs();

  return {
    ticket: state.ticket.toUpperCase(),
    changeLogType: state.changeLogType,
    includeDeployTasks: state.includeDeployTasks === "Yes",
  };
}

export async function multiSelectInput(changeLogTypes: string[]) {
  const changeLogTypeItems: QuickPickItem[] = changeLogTypes.map((label) => ({
    label,
  }));

  interface State {
    title: string;
    step: number;
    totalSteps: number;
    changeLogTypesToRemove: string[];
    runtime: QuickPickItem;
  }

  const title = "Edit Changelog Types";

  async function collectInputs() {
    const state = {} as Partial<State>;
    await pickChangeLogTypesToRemoveGroup(state);
    return state as State;
  }

  async function pickChangeLogTypesToRemoveGroup(state: Partial<State>) {
    async function getSelectedValues() {
      return new Promise((resolve) => {
        const quickPick = window.createQuickPick();
        quickPick.items = changeLogTypeItems;
        quickPick.title = title;
        quickPick.placeholder = "Select the custom types you want to remove";
        quickPick.canSelectMany = true;

        quickPick.onDidAccept(() => {
          const selections = quickPick.selectedItems.map(i => i.label);
          resolve(selections);
          quickPick.hide();
        });
        quickPick.show();
      });
    }

    const selected : any = await getSelectedValues();
    console.log('selected', selected);
    state.changeLogTypesToRemove = selected;
  }

  const state = await collectInputs();

  return {
    changeLogTypesToRemove: state.changeLogTypesToRemove,
  };
}

// -------------------------------------------------------
// Helper code that wraps the API for the multi-step case.
// -------------------------------------------------------

class InputFlowAction {
  static back = new InputFlowAction();
  static cancel = new InputFlowAction();
  static resume = new InputFlowAction();
}

type InputStep = (input: MultiStepInput) => Thenable<InputStep | void>;

interface QuickPickParameters<T extends QuickPickItem> {
  title: string;
  step: number;
  totalSteps: number;
  items: T[];
  activeItem?: T;
  canSelectMany: boolean;
  placeholder: string;
  shouldResume: () => Thenable<boolean>;
}

interface InputBoxParameters {
  title: string;
  step: number;
  totalSteps: number;
  value: string;
  prompt: string;
  validate: (value: string) => Promise<string | undefined>;
  shouldResume: () => Thenable<boolean>;
}

class MultiStepInput {
  static async run<T>(start: InputStep) {
    const input = new MultiStepInput();
    return input.stepThrough(start);
  }

  private current?: QuickInput;
  private steps: InputStep[] = [];

  private async stepThrough<T>(start: InputStep) {
    let step: InputStep | void = start;
    while (step) {
      this.steps.push(step);
      if (this.current) {
        this.current.enabled = false;
        this.current.busy = true;
      }
      try {
        step = await step(this);
      } catch (err) {
        if (err === InputFlowAction.back) {
          this.steps.pop();
          step = this.steps.pop();
        } else if (err === InputFlowAction.resume) {
          step = this.steps.pop();
        } else if (err === InputFlowAction.cancel) {
          step = undefined;
        } else {
          throw err;
        }
      }
    }
    if (this.current) {
      this.current.dispose();
    }
  }

  async showQuickPick<
    T extends QuickPickItem,
    P extends QuickPickParameters<T>
  >({
    title,
    step,
    totalSteps,
    items,
    activeItem,
    canSelectMany,
    placeholder,
    shouldResume,
  }: P) {
    const disposables: Disposable[] = [];
    try {
      return await new Promise<
        T | (P extends { buttons: (infer I)[] } ? I : never)
      >((resolve, reject) => {
        const input = window.createQuickPick<T>();
        input.title = title;
        input.step = step;
        input.totalSteps = totalSteps;
        input.placeholder = placeholder;
        input.canSelectMany = canSelectMany;
        input.items = items;
        if (activeItem) {
          input.activeItems = [activeItem];
        }
        input.buttons = [
          ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
          ...[],
        ];
        disposables.push(
          input.onDidTriggerButton((item) => {
            if (item === QuickInputButtons.Back) {
              reject(InputFlowAction.back);
            } else {
              resolve(<any>item);
            }
          }),
          input.onDidChangeSelection((items) => items.map((i) => resolve(i))),
          input.onDidHide(() => {
            (async () => {
              reject(
                shouldResume && (await shouldResume())
                  ? InputFlowAction.resume
                  : InputFlowAction.cancel
              );
            })().catch(reject);
          })
        );
        if (this.current) {
          this.current.dispose();
        }
        this.current = input;
        this.current.show();
      });
    } finally {
      disposables.forEach((d) => d.dispose());
    }
  }

  async showInputBox<P extends InputBoxParameters>({
    title,
    step,
    totalSteps,
    value,
    prompt,
    validate,
    shouldResume,
  }: P) {
    const disposables: Disposable[] = [];
    try {
      return await new Promise<
        string | (P extends { buttons: (infer I)[] } ? I : never)
      >((resolve, reject) => {
        const input = window.createInputBox();
        input.title = title;
        input.step = step;
        input.totalSteps = totalSteps;
        input.value = value || "";
        input.prompt = prompt;
        input.buttons = [
          ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
          ...[],
        ];
        let validating = validate("");
        disposables.push(
          input.onDidTriggerButton((item) => {
            if (item === QuickInputButtons.Back) {
              reject(InputFlowAction.back);
            } else {
              resolve(<any>item);
            }
          }),
          input.onDidAccept(async () => {
            const value = input.value;
            input.enabled = false;
            input.busy = true;
            if (!(await validate(value))) {
              resolve(value);
            }
            input.enabled = true;
            input.busy = false;
          }),
          input.onDidChangeValue(async (text) => {
            const current = validate(text);
            validating = current;
            const validationMessage = await current;
            if (current === validating) {
              input.validationMessage = validationMessage;
            }
          }),
          input.onDidHide(() => {
            (async () => {
              reject(
                shouldResume && (await shouldResume())
                  ? InputFlowAction.resume
                  : InputFlowAction.cancel
              );
            })().catch(reject);
          })
        );
        if (this.current) {
          this.current.dispose();
        }
        this.current = input;
        this.current.show();
      });
    } finally {
      disposables.forEach((d) => d.dispose());
    }
  }
}
