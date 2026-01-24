# Contributing Code to development-project-ksds

Code contributions are not currently being accepted since the project is in its infancy and we do not have appropriate guidelines in place. Content contributions are accepted such as submitting issues or data relevant to the project.

## Opening a Dev Container

It is recommended to either open this repository in a Github Codespace or VS Code.

### Github Codespaces

If opened in a Codespace, the server and client are setup to automatically launch. The client is also configured to automatically open in a new tab.

### VS Code

To open a Dev Container in VS Code, first you will need to clone this repository to your local machine.

After opening the repository folder in VS Code, you should be prompted to reopen it in a Dev Container by VS Code. Click `yes` and then wait for the container to build.

If you are not prompted to reopen in a Dev Container, do not fret, just find the container icon in the sidebar and click on it. Hovering over this icon should give the tool tip `Containers`.

This should open the Containers tab. Find the drop-down titled `CONTAINERS` and hover over it. This should bring up a `+` icon, which says `New Dev Container` in a tool tip. Click on this and then click on `Open Current Folder in Container` in the drop down that appears.

If your container fails to build, submit an issue with your error log.

The server and client are setup to automatically launch on mounting onto the container.

## Contributing Issues

If you believe you've found an issue, first check if it already exists.

### Bugs

If you've found a bug, please follow the below guidelines:
* Attempt to reproduce the bug before submitting an issue.
* Include a list of steps to reproduce the bug.
* If you are not using the provided Dev Container configuration files, please state that.
* Explain why you believe the issue to be a bug.

### Feature Requests



## Contributing Data

To submit relevant data that you've gathered, contact a maintainer of this project so we can determine if the data is relevant to the current goals of this project. Preferably, data should be in the form of a JSON or GeoJSON file.

## Contributing Code

If we are accepting code contributions, you will first need to fork this project. Once you've made your changes, submit a pull request against the correct development branch.

Please follow the guidelines in our [Style Guide](https://github.com/ksu-cs/development-project-ksds/wiki/Style-Guide)

### Tasks

There are three build tasks configured (can be quickly accessed with ctrl + shift + B):
1. start server: launches the server on port 3000
2. start client: launches the client on port 5173
3. start client and server: runs the first and second build tasks.