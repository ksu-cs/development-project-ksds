#!/bin/bash

# define directories
SERVER_DIR="/workspaces/development-project-ksds/server/"
CLIENT_DIR="/workspaces/development-project-ksds/client/"

echo "Starting server"
bash -c "cd $SERVER_DIR && npm run dev" &

echo "Starting client"
bash -c "cd $CLIENT_DIR && npm run dev" &

wait
