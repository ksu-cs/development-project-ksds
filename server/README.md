# Server

The server is a Node.js application responsible for serving static files and the client application.

## Responsibilities

The server strictly serves static files to the user.

# Development/Production

In development, the server is started alongside the client and doesn't serve the client when queried at a specific endpoint.

In production, the server serves the client application to the user when queried at a specific endpoint.