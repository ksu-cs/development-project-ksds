# Overview

Where Did They Go? is an interactive web application that visualizes rural population migration in the state of Kansas. The application aggregates demographic and geographic datasets to help users explore potential causes of rural outmigration.

Users can:
- View populations trends through the decades
- Compare changes in population with geographic data


This project aims to provide students and teachers with tools to better understand the meaning behind changes in their communities.

## Getting started

### Prerequisites
- Docker
- VS Code (Recommended)
- Node.js (if running locally without containers)

1. Clone the repository

    git clone https://github.com/ksu-cs/development-project-ksds.git

2. Open the project in VS Code.

3. Reopen the project in a Dev Container

4. The client and server should start automatically.

For more information, view our [CONTRIBUTING](/CONTRIBUTING.md) file

## Project Structure

```
development-project-ksds/
+-- client/ # Frontend Application
+-- server/ # Backend Application
+-- tests/ # Testing information
+-- documentation/ # Documentation and design materials
\-- .devcontainer/ # Development container information
```

Client: http://localhost:5173

Server: http://localhost:3000

## Tech Stack

Frontend: Vue + Javascript + d3.js

Backend: Node.js

Data: JSON / GeoJSON

Development Environment: Docker Dev Containers

## Licenses

This project is licensed under the MIT license.

See [LICENSE](/LICENSE.md) for details.

## Authors

Developed by students at Kansas State University

## Acknowledgements

Data sources include:
- U.S. Census Bureau
