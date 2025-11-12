#!/bin/bash

# define directories
SERVER_DIR="/workspaces/development-project-ksds/server/"
CLIENT_DIR="/workspaces/development-project-ksds/client/"

# move into server directory
cd $SERVER_DIR

echo "Installing npm packages for the server"
npm install

# move into client directory
cd $CLIENT_DIR

echo "Installing npm packages for the client"
npm install
