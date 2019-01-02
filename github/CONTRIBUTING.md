# Contributing to Apisauce

We welcome all contributions! This guide should help you get up and running to submit your first pull request.

## Requirements

- Yarn 1.7+

## Getting Started

1. Fork and then clone the repo (`git clone git@github.com:<YOURGITHUBUSER>/apisauce.git`)
2. cd into the directory (`cd apisauce`)
3. Install dependencies: `yarn`
4. Make your changes! You can test them out in a React or React Native project by installing from your github branch: `yarn install <git remote url>`

## Before Submitting

Before submitting a pull request, you will want to make sure your branch meets the following requirements:

- Everything works on iOS/Android
- Unit tests are passing (`yarn test`)
- New unit tests have been included for any new features or functionality
- Code is compliant with the linter and typescript compiles (`yarn lint && yarn compile`)
- Branch has been [synced with the upstream repo](https://help.github.com/articles/syncing-a-fork/) and any merge conflicts have been resolved.

## Submitting

When you are at the stage of opening your pull request on GitHub, make sure you include the following info in the description:

- The reasoning behind this change. What bug is it fixing? If it's a new feature, what need is it addressing, or value is it adding?
- Any notes to help us review the code or test the change.
- Any relevant screenshots or evidence of this feature in action. GIFs are particularly great to show new functionality.

[Here](https://blog.github.com/2015-01-21-how-to-write-the-perfect-pull-request/) is a great guide from GitHub on how to write a great pull request!

## Git Hooks

We use git hooks (via [Husky](https://github.com/typicode/husky)) to ensure our codebase remains properly formatted.

The hooks will run the linter and the compiler on any staged code before committing.

If you have to bypass the linter for a special commit that you will come back and clean (pushing something to a branch etc.) then you can bypass git hooks with adding `--no-verify` to your commit command.

**Understanding Linting Errors**

The linting rules are from TSLint. [TSLint errors can be found with descriptions here](https://palantir.github.io/tslint/rules/).
