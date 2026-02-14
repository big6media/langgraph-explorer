# LangGraph Explorer

A sample web application to explore [LangGraph JS SDK](https://github.com/langchain-ai/langgraphjs) capabilities through interactive examples.

![LangGraph Explorer](https://img.shields.io/badge/LangGraph-JS%20SDK-blue)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Features

This app demonstrates four key LangGraph concepts with interactive visualizations:

### 1. Simple Sequential Graph
- Basic node definitions and connections
- State management with Annotations
- Sequential workflow execution
- **Concepts**: `StateGraph`, `addNode`, `addEdge`

### 2. Agent Graph with Conditional Routing
- Conditional edges for dynamic routing
- Intent classification and tool selection
- Multiple tool-like nodes (calculator, weather, search)
- **Concepts**: `addConditionalEdges`, router functions

### 3. Multi-Step Graph with Cycles
- Iterative workflows with graph cycles
- State accumulation across iterations
- Conditional termination logic
- **Concepts**: Cycles, conditional continuation

### 4. Conversation Graph with Persistence
- Stateful conversations with memory
- Checkpointing across multiple requests
- Thread-based state isolation
- **Concepts**: `MemorySaver`, `checkpointer`, `thread_id`

### Graph Visualizations
Each graph includes interactive Mermaid diagrams showing the workflow structure.

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/big6media/langgraph-explorer.git
cd langgraph-explorer

# Install dependencies
npm install

# Copy environment file (optional - for LLM-powered features)
cp .env.example .env
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
├── server.js                # Express server with API endpoints
├── graphs/
│   ├── simple-graph.js      # Sequential workflow example
│   ├── agent-graph.js       # Conditional routing example
│   ├── multi-step-graph.js  # Cycles and iteration example
│   └── conversation-graph.js # Persistence/checkpointing example
├── public/
│   └── index.html           # Web UI with Mermaid visualizations
├── langgraph.json           # LangGraph Studio configuration
├── package.json
└── .env.example
```

## API Endpoints

### Graph Execution
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/simple-graph` | POST | Run the simple sequential graph |
| `/api/agent-graph` | POST | Run the agent with conditional routing |
| `/api/multi-step-graph` | POST | Run the iterative multi-step graph |
| `/api/conversation` | POST | Send message to conversation (with persistence) |
| `/api/conversation/history/:threadId` | GET | Get conversation history for a thread |
| `/api/conversation/clear` | POST | Clear conversation state |

### Diagrams
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/diagrams/simple` | GET | Get Mermaid diagram for simple graph |
| `/api/diagrams/agent` | GET | Get Mermaid diagram for agent graph |
| `/api/diagrams/multistep` | GET | Get Mermaid diagram for multi-step graph |
| `/api/diagrams/conversation` | GET | Get Mermaid diagram for conversation graph |

### Utility
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |

## LangGraph Concepts Demonstrated

| Concept | Description | Example |
|---------|-------------|----------|
| **StateGraph** | Core graph structure for workflows | All graphs |
| **Annotation** | Type-safe state schema with reducers | State definitions |
| **Nodes** | Functions that transform state | `processNode`, `classifyIntent` |
| **Edges** | Sequential connections between nodes | `addEdge()` |
| **Conditional Edges** | Dynamic routing based on state | Agent graph routing |
| **Cycles** | Iterative patterns with loops | Multi-step graph |
| **Checkpointer** | State persistence across invocations | `MemorySaver` |
| **Thread ID** | Isolate state per user/session | Conversation graph |

## Key Code Examples

### Basic Graph
```javascript
const workflow = new StateGraph(MyState)
  .addNode("step1", step1Function)
  .addNode("step2", step2Function)
  .addEdge("__start__", "step1")
  .addEdge("step1", "step2")
  .addEdge("step2", END);

const graph = workflow.compile();
await graph.invoke({ input: "hello" });
```

### With Persistence
```javascript
import { MemorySaver } from "@langchain/langgraph";

const checkpointer = new MemorySaver();
const graph = workflow.compile({ checkpointer });

// State persists across calls with same thread_id
await graph.invoke(input, { 
  configurable: { thread_id: "user-123" } 
});
```

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **LangGraph**: @langchain/langgraph (JS SDK)
- **Visualization**: Mermaid.js
- **Frontend**: Vanilla HTML/CSS/JS

## License

MIT
