# LangGraph Explorer

A sample web application to explore [LangGraph JS SDK](https://github.com/langchain-ai/langgraphjs) capabilities through interactive examples.

## Features

This app demonstrates three key LangGraph concepts:

### 1. Simple Sequential Graph
- Basic node definitions and connections
- State management with Annotations
- Sequential workflow execution

### 2. Agent Graph with Conditional Routing
- Conditional edges for dynamic routing
- Intent classification and tool selection
- Multiple tool-like nodes (calculator, weather, search)

### 3. Multi-Step Graph with Cycles
- Iterative workflows with graph cycles
- State accumulation across iterations
- Conditional termination logic

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Install dependencies
npm install

# Copy environment file (optional - for LLM-powered features)
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY if needed
```

### Running the App

```bash
# Start the server
npm start

# Or with auto-reload during development
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
langgraph-explorer/
├── server.js              # Express server with API endpoints
├── graphs/
│   ├── simple-graph.js    # Sequential workflow example
│   ├── agent-graph.js     # Conditional routing example
│   └── multi-step-graph.js # Cycles and iteration example
├── public/
│   └── index.html         # Web UI
├── package.json
└── .env.example
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/simple-graph` | POST | Run the simple sequential graph |
| `/api/agent-graph` | POST | Run the agent with conditional routing |
| `/api/multi-step-graph` | POST | Run the iterative multi-step graph |
| `/api/health` | GET | Health check |

## LangGraph Concepts Demonstrated

- **StateGraph**: Core graph structure for defining workflows
- **Annotation**: Type-safe state schema definition with reducers
- **Nodes**: Functions that transform state
- **Edges**: Connections between nodes (sequential and conditional)
- **Conditional Edges**: Dynamic routing based on state
- **Cycles**: Iterative patterns with termination conditions

## License

MIT
