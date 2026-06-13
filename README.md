# SpaceTracker

An AI-powered space situational awareness platform for tracking satellites, debris, and predicting orbital passes using real data from Space-Track and CelesTrak.

## Features
- **3D Globe Visualization**: See real-time positions of tracked satellites over a 3D Cesium globe.
- **AI Chat Assistant**: Ask natural language questions about space, orbits, and satellite passes.
- **Real-Time Data**: Syncs with Space-Track API for the latest Two-Line Elements (TLE).
- **Pass Predictions**: Predicts overhead passes for specific coordinates.

## Getting Started

To run the entire stack (both server and client) at once:
1. Ensure your database and `.env` are configured (see setup docs).
2. Run `npm run install:all` in the root folder to install all dependencies.
3. Run `npm run dev` in the root folder to start both services concurrently!

See [docs/setup-documentation.md](docs/setup-documentation.md) for detailed instructions on how to set up the SpaceTracker server, client, and database locally.
