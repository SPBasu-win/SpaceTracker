# SpaceTracker

An AI-powered space situational awareness platform for tracking satellites, debris, and predicting orbital passes using real data from Space-Track and CelesTrak.

## Features
- **3D Globe Visualization**: See real-time positions of tracked satellites over a 3D Cesium globe with dynamic depth and altitude scaling.
- **Agent-Driven Globe Interactions**: AI responses automatically fly the camera to specific satellites and highlight queried satellite categories.
- **AI Chat Assistant**: Ask natural language questions about space, orbits, and celestial events using real-time API integrations.
- **Location-Aware AI**: Provides native web search and location context for celestial events without needing additional search API keys.
- **Multi-Provider AI Fallback**: Integrates multiple AI providers (Google, Anthropic, OpenAI, Groq, OpenRouter) and automatically rotates on rate limits or errors.
- **Real-Time Data & Interpolation**: Syncs with Space-Track API for the latest Two-Line Elements (TLE) and uses 60fps real-time ECEF velocity interpolation.
- **Interactive UI**: Glassmorphic UI with floating hover cards, detailed satellite info panels, and dynamic satellite imagery toggles.

## Setup Instructions

### Prerequisites
- Node.js v19+
- Docker & docker-compose
- Free account on [Space-Track.org](https://www.space-track.org/auth/createAccount)
- API key from an AI provider (Google Gemini, Anthropic, OpenAI, Groq, or OpenRouter)

### 1. Database Setup
Start the local PostgreSQL database using Docker:
```bash
docker-compose up -d
```

### 2. Install Dependencies
Install dependencies for both the server and the client with a single command from the root directory:
```bash
npm run install:all
```

### 3. Server Configuration
Create a `.env` file from the example in the server directory:
```bash
cd server
cp .env.example .env
```

Update your `.env` file with your Space-Track credentials, at least one AI API key (e.g., `GOOGLE_AI_API_KEY`), and optionally a Cesium Ion token:
```env
SPACE_TRACK_USERNAME=...
SPACE_TRACK_PASSWORD=...
GOOGLE_AI_API_KEY=...
VITE_CESIUM_ION_TOKEN=... # Optional: Get a free token at cesium.com/ion for ultra-HD imagery
```

Run database migrations and seed the data:
```bash
npx prisma migrate dev
npm run seed
cd ..
```

### 4. Running the App
To start both the client and server concurrently, run this from the **root** directory:
```bash
npm run dev
```

On first load, the app will request your location to enable location-aware AI and pass predictions. If denied, a prompt will let you enter your city manually. Access the application at `http://localhost:5173`.
