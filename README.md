# Changelog Helper README

The Changelog Helper is designed to streamline the changelog creation process.

The changelog files are compatible with the [renogen](https://github.com/DDAZZA/renogen) release note generator Ruby gem.

## Features

The Changelog Helper extension adds two new commands to the command pallette:
- `Changelog Helper: Create`
- `Changelog Helper: Edit`

![Commands](images/screenshots/commands.png 'Commands')

### `Changelog Helper: Create` command

1. Open the command pallette with `CMD + SHIFT + P`
2. Type in `Changelog Helper: Create` and select it from the list.
3. The `Create Changelog` multi-step wizard will open. There are 3 steps which will then generate the changelog file.

#### Step 1: What is the changelog type?

Pick the type of changelog file you want to create. Is the change an `Improvement` or a `Bug Fix`.

> **Note** If you have created any custom types they will appear in the list too.

![Step 1](images/screenshots/step-one-including-custom.png 'Step 1 custom input')

If you choose `Other` then you will be given an input to enter a custom type to use. The custom type will be saved for future use.

![Step 1](images/screenshots/step-one-custom-input.png 'Step 1 custom input')

#### Step 2: Include deploy tasks?

Do you want to include `Deploy Tasks` in the changelog?

![Step 2](images/screenshots/step-two.png 'Step 2')

#### Step 3: What is the Jira ticket ID?

Enter the Jira ticket ID to use in the changelog.

> **Note** The helper will attempt to detect the ticket ID automatically from the branch name you are currently checked out on. The suggestion will be the default value in the input.

![Step 3](images/screenshots/step-three.png 'Step 3')

#### View new changelog file

After finishing the multi-step wizard the new `yml` file will be created in the `/change_log/next` directory. The changelog file will also be opened for you to customize further.

![New Changelog](images/screenshots/new-changelog.png 'New Changelog')

### `Changelog Helper: Edit` command

1. Open the command pallette with `CMD + SHIFT + P`
2. Type in `Changelog Helper: Edit` and select it from the list.
3. The `Edit Changelog Types` selection list will open. Here you can select any custom types you would like to remove.
4. Click on `OK` to confirm your select and remove the types.

![Edit Command](images/screenshots/edit-changelog-types.png 'Edit Command')
