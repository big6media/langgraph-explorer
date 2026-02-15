# API Documentation

## Base URL
```
http://localhost:3000
```

## Overview

The LangGraph Explorer API provides endpoints to interact with four different graph examples demonstrating various LangGraph capabilities. All endpoints accept JSON payloads and return JSON responses.

---

## Health Check

### GET `/api/health`

Check if the server is running and responsive.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-02-14T19:42:27.000Z"
}
```

---

## Simple Sequential Graph

### POST `/api/simple-graph`

Execute a simple sequential workflow that processes input through three sequential nodes.

**Request Body:**
```json
{
  "input": "Hello LangGraph!"
}
```

**Parameters:**
- `input` (string, optional): Text to process. Default: "Hello LangGraph!"

**Response:**
```json
{
  "success": true,
  "result": {
    "originalInput": "Hello LangGraph!",
    "processed": "HELLO LANGGRAPH!",
    "formatted": "✨ HELLO LANGGRAPH! ✨",
    "steps": [
      "Processed: converted to uppercase",
      "Formatted: added decoration",
      "Finalized: workflow complete"
    ],
    "graphStructure": {
      "nodes": ["process", "format", "finalize"],
      "edges": [
        "START → process",
        "process → format",
        "format → finalize",
        "finalize → END"
      ]
    }
  }
}
```

**Graph Flow:**
```
START → Process (uppercase) → Format (add decoration) → Finalize → END
```

---

## Agent Graph with Conditional Routing

### POST `/api/agent-graph`

Execute an agent that routes requests to different tools based on detected intent.

**Request Body:**
```json
{
  "input": "What's the weather in Tokyo?"
}
```

**Parameters:**
- `input` (string, optional): User query. Default: "What's the weather in Tokyo?"

**Supported Intents:**
- **calculator**: Math operations (e.g., "calculate 5 + 3")
- **weather**: Weather queries (supports: New York, London, Tokyo, Paris)
- **search**: Search queries (e.g., "search for LangGraph")
- **general**: Default for unmatched queries

**Response:**
```json
{
  "success": true,
  "result": {
    "input": "What's the weather in Tokyo?",
    "detectedIntent": "weather",
    "result": "Weather in Tokyo: 68°F, Partly Cloudy",
    "steps": [
      "Classified intent as: weather",
      "Used weather tool"
    ],
    "graphStructure": {
      "nodes": ["classify", "calculator", "weather", "search", "general"],
      "conditionalRouting": "classify → (calculator | weather | search | general) based on intent"
    }
  }
}
```

**Examples:**

```bash
# Calculator
curl -X POST http://localhost:3000/api/agent-graph \
  -H "Content-Type: application/json" \
  -d '{"input": "calculate 42 * 3"}'

# Weather
curl -X POST http://localhost:3000/api/agent-graph \
  -H "Content-Type: application/json" \
  -d '{"input": "weather in New York"}'

# Search
curl -X POST http://localhost:3000/api/agent-graph \
  -H "Content-Type: application/json" \
  -d '{"input": "search for best restaurants"}'
```

**Graph Flow:**
```
START → Classify Intent → [Calculator | Weather | Search | General] → END
```

---

## Multi-Step Graph with Cycles

### POST `/api/multi-step-graph`

Execute an iterative workflow that progresses toward a target value through multiple cycles.

**Request Body:**
```json
{
  "input": "Count to 100",
  "maxIterations": 5
}
```

**Parameters:**
- `input` (string, optional): Description containing target number. Default: "Count to 100"
- `maxIterations` (number, optional): Maximum iterations allowed. Default: 3

**Response:**
```json
{
  "success": true,
  "result": {
    "input": "Count to 100",
    "finalValue": 100,
    "targetValue": 100,
    "iterations": 4,
    "maxIterations": 5,
    "status": "completed",
    "history": [
      "Initialized: target = 100",
      "Step 1: 0 → 50 (added 50)",
      "Evaluation: Continue (50/100, iteration 1/5)",
      "Step 2: 50 → 75 (added 25)",
      "Evaluation: Continue (75/100, iteration 2/5)",
      "Step 3: 75 → 87 (added 12)",
      "Evaluation: Continue (87/100, iteration 3/5)",
      "Step 4: 87 → 93 (added 6)",
      "Evaluation: Continue (93/100, iteration 4/5)",
      "Step 5: 93 → 100 (added 7)",
      "Evaluation: Reached target value 100! ✓",
      "Finalized: Successfully reached 100 in 4 steps!"
    ],
    "graphStructure": {
      "nodes": ["initialize", "process", "evaluate", "finalize"],
      "cycle": "process → evaluate → process (repeats until done)",
      "termination": "evaluate → finalize (when target reached or max iterations)"
    }
  }
}
```

**Status Values:**
- `completed`: Target value reached
- `max_iterations`: Stopped at max iterations
- `running`: Still processing

**Examples:**

```bash
# Quick task (reaches target in fewer iterations)
curl -X POST http://localhost:3000/api/multi-step-graph \
  -H "Content-Type: application/json" \
  -d '{"input": "Count to 50", "maxIterations": 10}'

# Limited iterations
curl -X POST http://localhost:3000/api/multi-step-graph \
  -H "Content-Type: application/json" \
  -d '{"input": "Count to 500", "maxIterations": 3}'
```

**Graph Flow:**
```
START → Initialize → Process → Evaluate → [Process (continue) | Finalize (done)] → END
                         ↑__________________|
                              (cycle)
```

---

## Conversation Graph with Persistence

### POST `/api/conversation`

Send a message in a stateful conversation with memory persistence.

**Request Body:**
```json
{
  "input": "Hello, how are you?",
  "threadId": "user-123"
}
```

**Parameters:**
- `input` (string, required): User message
- `threadId` (string, optional): Conversation thread identifier. Default: "default"

**Response:**
```json
{
  "success": true,
  "result": {
    "threadId": "user-123",
    "input": "Hello, how are you?",
    "response": "Hello! Welcome to the conversation. How can I help you today?",
    "sentiment": "neutral",
    "turnCount": 1,
    "messageCount": 2,
    "conversationHistory": [
      {
        "role": "user",
        "content": "Hello, how are you?",
        "timestamp": "2024-02-14T19:42:27.123Z"
      },
      {
        "role": "assistant",
        "content": "Hello! Welcome to the conversation. How can I help you today?",
        "timestamp": "2024-02-14T19:42:27.456Z",
        "detectedSentiment": "neutral"
      }
    ],
    "persistenceDemo": {
      "explanation": "Each thread_id maintains separate conversation state",
      "feature": "Messages persist across multiple invocations with same thread_id"
    }
  }
}
```

**Sentiment Detection:**
- `positive`: Happy, great, good, love, thanks, awesome, excellent, wonderful
- `negative`: Sad, bad, hate, angry, terrible, awful, frustrated, annoyed
- `neutral`: Default

**Special Queries:**
- Greetings: "hello", "hi", "hey" → Personalized greeting
- Memory test: "what did I say", "remember" → Recalls previous messages
- Stats: "how many messages" → Returns message count

### GET `/api/conversation/history/:threadId`

Retrieve conversation history for a specific thread.

**Parameters:**
- `threadId` (string, path): Thread identifier

**Response:**
```json
{
  "success": true,
  "result": {
    "threadId": "user-123",
    "messages": [
      {
        "role": "user",
        "content": "Hello!",
        "timestamp": "2024-02-14T19:42:27.123Z"
      },
      {
        "role": "assistant",
        "content": "Hello! Welcome...",
        "timestamp": "2024-02-14T19:42:27.456Z",
        "detectedSentiment": "neutral"
      }
    ],
    "turnCount": 5
  }
}
```

### POST `/api/conversation/clear`

Clear conversation state for a specific thread.

**Request Body:**
```json
{
  "threadId": "user-123"
}
```

**Parameters:**
- `threadId` (string, optional): Thread identifier. Default: "default"

**Response:**
```json
{
  "success": true,
  "result": {
    "cleared": true,
    "threadId": "user-123"
  }
}
```

**Conversation Examples:**

```bash
# Start a conversation
curl -X POST http://localhost:3000/api/conversation \
  -H "Content-Type: application/json" \
  -d '{"input": "Hi there!", "threadId": "alice"}'

# Continue the conversation (state persists)
curl -X POST http://localhost:3000/api/conversation \
  -H "Content-Type: application/json" \
  -d '{"input": "What did I say before?", "threadId": "alice"}'

# Get history
curl http://localhost:3000/api/conversation/history/alice

# Clear history
curl -X POST http://localhost:3000/api/conversation/clear \
  -H "Content-Type: application/json" \
  -d '{"threadId": "alice"}'
```

**Graph Flow:**
```
START → Process Input → Analyze Sentiment → Generate Response → END
(State persists via MemorySaver checkpointer)
```

---

## Graph Diagrams

Get Mermaid diagram definitions for visualization.

### GET `/api/diagrams/simple`
### GET `/api/diagrams/agent`
### GET `/api/diagrams/multistep`
### GET `/api/diagrams/conversation`

**Response:**
```json
{
  "success": true,
  "diagram": "flowchart TD\n    A[Start] --> B[Process]\n    ..."
}
```

**Usage:**
```javascript
// Fetch and render diagram
const response = await fetch('/api/diagrams/simple');
const { diagram } = await response.json();

// Render with Mermaid.js
mermaid.render('graphDiagram', diagram);
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**Status Codes:**
- `200`: Success
- `500`: Internal server error

---

## Rate Limiting

Currently no rate limiting is implemented. This is suitable for development and demonstration purposes only.

---

## CORS

CORS is enabled for all origins in development mode. Configure appropriately for production use.

---

## Authentication

No authentication is required for this demonstration application. Implement authentication before deploying to production.
