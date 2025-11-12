# 00 Test Order

## Purpose

This file defines the required order for executing all manual tests in this project, and provides instructions for how to document test results.



## Testing Order

The number prefix (e.g. `00`, `01`, `02`, etc.) at the beginning of each test file determines its position in the test sequence.
Tests with lower number prefixes must be performed before those with higher number prefixes.

Example:
* `00-test-order.md` -> read this first.
* `01-launch-app.md` -> perform this test second.
* `02-filter-test.md` -> perform this test third.



## How to Read a Test File

Each test file follows this structure:
1. Title: The first line is the title of the test (typically the same as the file name).
2. Action Headers (Starts with `##`): Each section describes an action to perform (for example, clicking a button).
    * Each Action Header follows this structure:
        - The expected result of that action (such as a change in icon).
        - An image showing the expected outcome (optional).
3. Completed: The final header in every test file marks the end of the test, and states the next test to be executed.



## Documenting Test Results

Create a new file in 
`tests/client/review/<sprint-release-tag>/`
with the name: `<version>-<date>.md`
If the directory doesn't exist for that sprint release tag, create it first.

Definition of terms:
* `<spring-release-tags` -> the sprint's release tag.
* `<version>` -> the review number (starting from `00` and incrementing by 1 each time).
* `<date>` -> The date the final test was completed on.
    - You may leave this blank if the tests are not yet complete.

The structure of the review file should be as follows:
* `Title`: Same as the file's name, though it may be sylized (removing hyphens, capitalizing words, replacing day, month, or year numerical representation with the corresponding words).
* `Reviewers`: A list of everyone who ran the tests.
* `Test Header` (Starts with `##`): A header for each test file, with the file's name as the header's text
    * Under Each `Test Header` write either:
        - "Passed" - All actions passed, or
        - A description of any failed actions, noting only what visually appeared incorrect (No need to debug at this time, unless you really want to).



## Completed

You may move onto the next test, `01-launch-app.md`
