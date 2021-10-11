# Changelog Helper README

The Changelog Helper is designed to streamline the changelog creation process.

The changelog files are compatible with the [renogen](https://github.com/DDAZZA/renogen) release note generator gem.

## Features

The Changelog Helper extension add one new command to the command pallette `Create Changelog`.

### Create Changelog command

1. Open the command pallette with `CMD + SHIFT + P`
2. Type in `Create Changelog` and select it from the list.
3. The `Create Changelog` multi-step wizard will open. There are 3 steps which will then generate the changelog file.

#### Step 1: What is the changelog type?

Pick the type of changelog file you want to create. Is the change an `Improvement` or a `Bug Fix`.

![Step 1](images/screenshots/step-1.png 'Step 1')

#### Step 2: Include deploy tasks?

Do you want to include `Deploy Tasks` in the changelog?

![Step 2](images/screenshots/step-2.png 'Step 2')

#### Step 3: What is the Jira ticket number?

Enter the Jira ticket number to use in the changelog.

> **Note** The helper will attempt to detect the ticket number automatically from the branch name of the branch you are currently checked out on. The suggestion will be the default value in the input.

![Step 3](images/screenshots/step-3.png 'Step 3')

#### Edit new changelog file

After finishing the multi-step wizard the new `yml` file will be created in the `/change_log/next` directory. The changelog file will also be opened for you to customize further.

![New Changelog](images/screenshots/new-change-log.png 'New Changelog')
