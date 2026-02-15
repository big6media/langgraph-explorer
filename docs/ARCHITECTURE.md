# Architecture Documentation

## Overview

LangGraph Explorer is a demonstration application showcasing the capabilities of the [LangGraph JS SDK](https://github.com/langchain-ai/langgraphjs). It implements four distinct graph patterns through a simple Express.js API with a web-based visualization interface.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Web UI (public/index.html)                           │ │
│  │  - Interactive form controls                          │ │
│  │  - Mermaid.js graph visualization                     │ │
│  │  - Real-time API interaction                          │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/JSON
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Express Server                         │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  API Routes (server.js)                               │ │
│  │  - Graph execution endpoints                          │ │
│  │  - Diagram retrieval endpoints                        │ │
│  │  - Conversation management                            │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Import/Invoke
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    LangGraph Examples                       │
│  ┌────────────────┐  ┌────────────────┐                    │
│  │ Simple Graph   │  │  Agent Graph   │                    │
│  │  (sequential)  │  │ (conditional)  │                    │
│  └────────────────┘  └────────────────┘                    │
│  ┌────────────────┐  ┌────────────────┐                    │
│  │ Multi-Step     │  │ Conversation   │                    │
│  │   (cycles)     │  │ (persistence)  │                    │
│  └────────────────┘  └────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ State Management
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  LangGraph Core                             │
│  - StateGraph                                               │
│  - Annotation (state schemas)                               │
│  - MemorySaver (checkpointing)                              │
│  - Graph compilation & execution                            │
└─────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Web Frontend (`public/index.html`)

**Purpose**: Interactive UI for testing and visualizing graphs

**Key Features**:
- Tab-based navigation for each graph example
- Form controls for input parameters
- JSON response display
- Real-time Mermaid diagram rendering
- Clean, accessible interface

**Technology**:
- Vanilla HTML/CSS/JavaScript
- Mermaid.js for graph visualization
- Fetch API for backend communication

### 2. Express Server (`server.js`)

**Purpose**: HTTP API layer for graph execution

**Responsibilities**:
- Route handling for all API endpoints
- Request/response transformation
- Error handling and logging
- Static file serving
- CORS configuration

**Key Endpoints**:
```
POST /api/simple-graph       → Execute simple sequential workflow
POST /api/agent-graph        → Execute agent with routing
POST /api/multi-step-graph   → Execute iterative workflow
POST /api/conversation       → Send conversation message
GET  /api/conversation/history/:id → Get conversation history
POST /api/conversation/clear → Clear conversation state
GET  /api/diagrams/*         → Retrieve Mermaid diagrams
GET  /api/health             → Health check
```

### 3. Graph Implementations

#### Simple Sequential Graph (`graphs/simple-graph.js`)

**Pattern**: Linear workflow
**State**: Input, processed text, formatted text, steps history
**Flow**: START → Process → Format → Finalize → END

**Key Concepts**:
- `StateGraph` initialization
- Node definitions with pure functions
- Sequential edge connections
- State transformation

**Code Structure**:
```javascript
StateGraph(Schema)
  .addNode("process", fn)
  .addNode("format", fn)
  .addNode("finalize", fn)
  .addEdge("__start__", "process")
  .addEdge("process", "format")
  .addEdge("format", "finalize")
  .addEdge("finalize", END)
  .compile()
```

#### Agent Graph (`graphs/agent-graph.js`)

**Pattern**: Conditional routing (fan-out)
**State**: Input, detected intent, result, steps history
**Flow**: START → Classify → [Calculator|Weather|Search|General] → END

**Key Concepts**:
- `addConditionalEdges` for dynamic routing
- Router function based on state
- Multiple tool-like nodes
- Intent classification

**Code Structure**:
```javascript
StateGraph(Schema)
  .addNode("classify", classifyFn)
  .addNode("calculator", calcFn)
  .addNode("weather", weatherFn)
  .addNode("search", searchFn)
  .addNode("general", generalFn)
  .addEdge("__start__", "classify")
  .addConditionalEdges("classify", routerFn, {
    calculator: "calculator",
    weather: "weather",
    // ...
  })
  .addEdge("calculator", END)
  // ...
  .compile()
```

#### Multi-Step Graph (`graphs/multi-step-graph.js`)

**Pattern**: Iterative cycles
**State**: Current value, target, iteration count, history, status
**Flow**: START → Initialize → Process → Evaluate → [Process|Finalize] → END

**Key Concepts**:
- Graph cycles for iteration
- Conditional termination logic
- State accumulation across loops
- Progress tracking

**Code Structure**:
```javascript
StateGraph(Schema)
  .addNode("initialize", initFn)
  .addNode("process", processFn)
  .addNode("evaluate", evaluateFn)
  .addNode("finalize", finalizeFn)
  .addEdge("__start__", "initialize")
  .addEdge("initialize", "process")
  .addEdge("process", "evaluate")
  .addConditionalEdges("evaluate", shouldContinueFn, {
    process: "process",    // Loop back
    finalize: "finalize"   // Exit loop
  })
  .addEdge("finalize", END)
  .compile()
```

#### Conversation Graph (`graphs/conversation-graph.js`)

**Pattern**: Stateful persistence
**State**: Messages array, current input, sentiment, turn count
**Flow**: START → ProcessInput → AnalyzeSentiment → GenerateResponse → END

**Key Concepts**:
- `MemorySaver` for checkpointing
- Thread-based state isolation
- State persistence across invocations
- Conversation memory

**Code Structure**:
```javascript
const checkpointer = new MemorySaver();

StateGraph(Schema)
  .addNode("processInput", processFn)
  .addNode("analyzeSentiment", sentimentFn)
  .addNode("generateResponse", responseFn)
  .addEdge("__start__", "processInput")
  .addEdge("processInput", "analyzeSentiment")
  .addEdge("analyzeSentiment", "generateResponse")
  .addEdge("generateResponse", END)
  .compile({ checkpointer })

// Invoke with thread_id
graph.invoke(input, {
  configurable: { thread_id: "user-123" }
})
```

## State Management

### State Schema Definition

All graphs use `Annotation` for type-safe state schemas:

```javascript
const MyState = Annotation.Root({
  field1: Annotation({
    reducer: (prev, next) => next,  // Replacement
    default: () => ""
  }),
  field2: Annotation({
    reducer: (prev, next) => [...prev, next],  // Accumulation
    default: () => []
  })
});
```

**Reducer Types**:
- **Replace**: `(_, y) => y` - New value replaces old
- **Accumulate**: `(x, y) => [...x, y]` - New value appends to array
- **Custom**: Any function `(prev, next) => result`

### State Flow

1. **Initialization**: Graph starts with default state values
2. **Node Execution**: Each node receives current state, returns partial update
3. **State Update**: Reducers merge partial updates into current state
4. **Propagation**: Updated state flows to next node(s)
5. **Termination**: Graph ends when reaching END node

### Persistence (Conversation Graph Only)

**MemorySaver Checkpointing**:
- State snapshots saved after each node execution
- Thread isolation via `thread_id` in config
- State retrieved and restored on subsequent invocations
- In-memory storage (production would use database)

## Design Patterns

### 1. Pure Node Functions

All nodes are pure functions: `(state) => partialUpdate`

**Benefits**:
- Testable
- Predictable
- Composable
- Side-effect free

### 2. Declarative Graph Construction

Graphs built through chaining API:

```javascript
graph
  .addNode(...)
  .addEdge(...)
  .addConditionalEdges(...)
  .compile()
```

**Benefits**:
- Clear graph structure
- Self-documenting
- Easy to modify

### 3. Router Functions

Conditional routing via router functions: `(state) => nextNode`

**Benefits**:
- Dynamic flow control
- State-based decisions
- Flexible branching

### 4. State Accumulation

History tracking via array reducers:

```javascript
steps: Annotation({
  reducer: (x, y) => [...x, y],
  default: () => []
})
```

**Benefits**:
- Complete execution trace
- Debugging support
- User feedback

## Data Flow

### Request Flow

```
User Input
    ↓
Web Form
    ↓
HTTP POST → Express Route
    ↓
Graph Import
    ↓
graph.invoke(input)
    ↓
[Node 1] → [Node 2] → ... → [Node N]
    ↓
Final State
    ↓
JSON Response
    ↓
UI Update + Diagram
```

### State Transformation Flow

```
Initial State (defaults)
    ↓
Node 1: Partial Update
    ↓
State Merge (via reducers)
    ↓
Updated State
    ↓
Node 2: Partial Update
    ↓
State Merge
    ↓
...
    ↓
Final State
```

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.x
- **LangGraph**: @langchain/langgraph 1.x
- **LangChain Core**: @langchain/core 1.x

### Frontend
- **HTML5/CSS3**: Modern web standards
- **JavaScript**: ES6+ (vanilla, no framework)
- **Mermaid.js**: Graph visualization

### Development
- **Module System**: ES Modules (`"type": "module"`)
- **Environment**: dotenv for configuration
- **CORS**: Enabled for development

## File Structure

```
langgraph-explorer/
├── server.js                 # Express server & routing
├── graphs/
│   ├── simple-graph.js       # Sequential workflow
│   ├── agent-graph.js        # Conditional routing
│   ├── multi-step-graph.js   # Iterative cycles
│   └── conversation-graph.js # Stateful persistence
├── public/
│   └── index.html            # Web UI
├── docs/
│   ├── API.md                # API documentation
│   ├── ARCHITECTURE.md       # This file
│   └── EXAMPLES.md           # Usage examples
├── langgraph.json            # LangGraph Studio config
├── package.json              # Dependencies & scripts
├── .env.example              # Environment template
├── .env                      # Local environment (git-ignored)
└── README.md                 # Project overview
```

## Deployment Considerations

### Development
- Run with `npm start` or `npm run dev`
- Accessible at `http://localhost:3000`
- CORS enabled for all origins
- No authentication required

### Production
**Security**:
- Implement authentication/authorization
- Configure CORS whitelist
- Add rate limiting
- Use HTTPS
- Sanitize inputs
- Add request validation

**Persistence**:
- Replace `MemorySaver` with database checkpointer
- Implement proper session management
- Add data retention policies

**Monitoring**:
- Add logging (Winston, Pino)
- Error tracking (Sentry)
- Performance monitoring
- Health checks

**Scalability**:
- Horizontal scaling with load balancer
- Separate graph execution service
- Cache frequently used graphs
- Connection pooling for DB

## Extension Points

### Adding New Graphs

1. Create graph file in `graphs/`
2. Export `build*Graph()` and `run*Graph()` functions
3. Add route in `server.js`
4. Add tab in `public/index.html`
5. Update documentation

### Adding LLM Integration

Currently graphs use mock logic. To add real LLM:

```javascript
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

async function llmNode(state) {
  const response = await model.invoke(state.input);
  return { result: response.content };
}
```

### Adding Database Persistence

Replace `MemorySaver` with database checkpointer:

```javascript
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

const checkpointer = new PostgresSaver(connectionString);
```

## Testing Strategy

### Unit Tests
- Test individual node functions
- Test router functions
- Test state reducers

### Integration Tests
- Test graph execution end-to-end
- Test API endpoints
- Test persistence behavior

### Example
```javascript
import { describe, it, expect } from 'vitest';
import { buildSimpleGraph } from './graphs/simple-graph.js';

describe('Simple Graph', () => {
  it('should uppercase and format input', async () => {
    const graph = buildSimpleGraph();
    const result = await graph.invoke({ input: 'hello' });
    
    expect(result.processed).toBe('HELLO');
    expect(result.formatted).toBe('✨ HELLO ✨');
  });
});
```

## Performance Considerations

### Graph Execution
- Node functions should be fast (< 100ms)
- Avoid blocking operations in nodes
- Use async/await for I/O

### Caching
- Compile graphs once, reuse instances
- Cache diagram generation results
- Consider memoization for expensive operations

### Memory
- `MemorySaver` keeps all state in memory
- Conversation history grows unbounded
- Implement cleanup for production

## Security Considerations

### Input Validation
- Sanitize all user inputs
- Validate parameter types
- Limit string lengths
- Prevent injection attacks

### State Management
- Don't store sensitive data in state
- Implement data encryption for persistence
- Add access controls per thread

### API Security
- Add authentication
- Implement rate limiting
- Use HTTPS in production
- Add CSRF protection

## Further Reading

- [LangGraph JS Documentation](https://langchain-ai.github.io/langgraphjs/)
- [LangChain JS Documentation](https://js.langchain.com/)
- [Express.js Documentation](https://expressjs.com/)
- [Mermaid.js Documentation](https://mermaid.js.org/)
