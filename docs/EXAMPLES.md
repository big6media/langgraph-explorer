# Usage Examples

This document provides practical examples for using the LangGraph Explorer API and understanding the graph patterns.

## Table of Contents
- [Getting Started](#getting-started)
- [Simple Sequential Graph](#simple-sequential-graph)
- [Agent Graph with Conditional Routing](#agent-graph-with-conditional-routing)
- [Multi-Step Graph with Cycles](#multi-step-graph-with-cycles)
- [Conversation Graph with Persistence](#conversation-graph-with-persistence)
- [Integration Examples](#integration-examples)

---

## Getting Started

### Starting the Server

```bash
# Clone and setup
git clone https://github.com/big6media/langgraph-explorer.git
cd langgraph-explorer
npm install

# Configure environment (optional)
cp .env.example .env
# Edit .env to add OPENAI_API_KEY if needed

# Start server
npm start
```

### Testing the API

```bash
# Health check
curl http://localhost:3000/api/health

# Expected response:
# {"status":"ok","timestamp":"2024-02-14T19:42:27.000Z"}
```

---

## Simple Sequential Graph

The simple graph demonstrates basic sequential workflow execution.

### Example 1: Basic Text Processing

```bash
curl -X POST http://localhost:3000/api/simple-graph \
  -H "Content-Type: application/json" \
  -d '{"input": "hello world"}'
```

**Response:**
```json
{
  "success": true,
  "result": {
    "originalInput": "hello world",
    "processed": "HELLO WORLD",
    "formatted": "✨ HELLO WORLD ✨",
    "steps": [
      "Processed: converted to uppercase",
      "Formatted: added decoration",
      "Finalized: workflow complete"
    ],
    "graphStructure": {
      "nodes": ["process", "format", "finalize"],
      "edges": ["START → process", "process → format", "format → finalize", "finalize → END"]
    }
  }
}
```

### Example 2: Using JavaScript Fetch

```javascript
async function runSimpleGraph(text) {
  const response = await fetch('http://localhost:3000/api/simple-graph', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: text })
  });
  
  const data = await response.json();
  console.log('Formatted:', data.result.formatted);
  console.log('Steps:', data.result.steps);
}

await runSimpleGraph('LangGraph is awesome');
// Output:
// Formatted: ✨ LANGGRAPH IS AWESOME ✨
// Steps: [ 'Processed: ...', 'Formatted: ...', 'Finalized: ...' ]
```

### Use Cases
- Text transformation pipelines
- Data preprocessing workflows
- Sequential validation steps
- Report generation

---

## Agent Graph with Conditional Routing

The agent graph demonstrates conditional routing to different "tools" based on input classification.

### Example 1: Calculator Tool

```bash
curl -X POST http://localhost:3000/api/agent-graph \
  -H "Content-Type: application/json" \
  -d '{"input": "calculate 42 * 3"}'
```

**Response:**
```json
{
  "success": true,
  "result": {
    "input": "calculate 42 * 3",
    "detectedIntent": "calculator",
    "result": "Calculator result: 42 * 3 = 126",
    "steps": [
      "Classified intent as: calculator",
      "Used calculator tool"
    ]
  }
}
```

### Example 2: Weather Tool

```bash
curl -X POST http://localhost:3000/api/agent-graph \
  -H "Content-Type: application/json" \
  -d '{"input": "What is the weather in Tokyo?"}'
```

**Response:**
```json
{
  "success": true,
  "result": {
    "input": "What is the weather in Tokyo?",
    "detectedIntent": "weather",
    "result": "Weather in Tokyo: 68°F, Partly Cloudy",
    "steps": [
      "Classified intent as: weather",
      "Used weather tool"
    ]
  }
}
```

### Example 3: Search Tool

```bash
curl -X POST http://localhost:3000/api/agent-graph \
  -H "Content-Type: application/json" \
  -d '{"input": "search for best restaurants in Paris"}'
```

**Response:**
```json
{
  "success": true,
  "result": {
    "input": "search for best restaurants in Paris",
    "detectedIntent": "search",
    "result": "Search: Would search for \"best restaurants in Paris\"",
    "steps": [
      "Classified intent as: search",
      "Used search tool"
    ]
  }
}
```

### Example 4: Multiple Requests

```javascript
async function testAgent(queries) {
  for (const query of queries) {
    const response = await fetch('http://localhost:3000/api/agent-graph', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: query })
    });
    
    const data = await response.json();
    console.log(`Query: ${query}`);
    console.log(`Intent: ${data.result.detectedIntent}`);
    console.log(`Result: ${data.result.result}\n`);
  }
}

await testAgent([
  'calculate 15 + 27',
  'weather in New York',
  'search for LangGraph tutorials',
  'tell me a joke'
]);
```

### Supported Cities for Weather
- New York
- London
- Tokyo
- Paris

### Supported Math Operations
- Addition: `+`
- Subtraction: `-`
- Multiplication: `*`
- Division: `/`

### Use Cases
- Intent-based routing
- Tool selection in agents
- Dynamic workflow branching
- Multi-capability assistants

---

## Multi-Step Graph with Cycles

The multi-step graph demonstrates iterative workflows with cycles and conditional termination.

### Example 1: Basic Iteration

```bash
curl -X POST http://localhost:3000/api/multi-step-graph \
  -H "Content-Type: application/json" \
  -d '{"input": "Count to 100", "maxIterations": 5}'
```

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
      "Evaluation: Reached target value 100! ✓",
      "Finalized: Successfully reached 100 in 4 steps!"
    ]
  }
}
```

### Example 2: Limited Iterations

```bash
curl -X POST http://localhost:3000/api/multi-step-graph \
  -H "Content-Type: application/json" \
  -d '{"input": "Count to 500", "maxIterations": 3}'
```

**Response:**
```json
{
  "success": true,
  "result": {
    "finalValue": 437,
    "targetValue": 500,
    "iterations": 3,
    "status": "max_iterations",
    "history": [
      "Initialized: target = 500",
      "Step 1: 0 → 250 (added 250)",
      "Step 2: 250 → 375 (added 125)",
      "Step 3: 375 → 437 (added 62)",
      "Evaluation: Reached max iterations (3). Current: 437",
      "Finalized: Stopped at 437 after 3 iterations (target was 500)"
    ]
  }
}
```

### Example 3: Monitoring Progress

```javascript
async function monitorProgress(target, maxIter) {
  const response = await fetch('http://localhost:3000/api/multi-step-graph', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      input: `Count to ${target}`, 
      maxIterations: maxIter 
    })
  });
  
  const data = await response.json();
  const result = data.result;
  
  console.log(`Target: ${result.targetValue}`);
  console.log(`Final Value: ${result.finalValue}`);
  console.log(`Status: ${result.status}`);
  console.log(`\nProgress History:`);
  result.history.forEach((step, i) => console.log(`${i+1}. ${step}`));
}

await monitorProgress(200, 10);
```

### Understanding the Algorithm

The multi-step graph uses a "halving" strategy:
- Each iteration adds half of the remaining distance to the target
- This creates diminishing increments: 50%, 25%, 12.5%, etc.
- Converges quickly but may need several steps for final precision

### Status Values
- `completed`: Target value reached
- `max_iterations`: Stopped at maximum iterations
- `running`: Still processing (shouldn't appear in final result)

### Use Cases
- Iterative refinement workflows
- Approximation algorithms
- Retry logic with backoff
- Progressive enhancement processes

---

## Conversation Graph with Persistence

The conversation graph demonstrates stateful interactions with memory persistence across multiple requests.

### Example 1: Starting a Conversation

```bash
# First message
curl -X POST http://localhost:3000/api/conversation \
  -H "Content-Type: application/json" \
  -d '{"input": "Hello!", "threadId": "user123"}'
```

**Response:**
```json
{
  "success": true,
  "result": {
    "threadId": "user123",
    "input": "Hello!",
    "response": "Hello! Welcome to the conversation. How can I help you today?",
    "sentiment": "neutral",
    "turnCount": 1,
    "messageCount": 2,
    "conversationHistory": [
      {
        "role": "user",
        "content": "Hello!",
        "timestamp": "2024-02-14T19:42:27.123Z"
      },
      {
        "role": "assistant",
        "content": "Hello! Welcome to the conversation. How can I help you today?",
        "timestamp": "2024-02-14T19:42:27.456Z",
        "detectedSentiment": "neutral"
      }
    ]
  }
}
```

### Example 2: Continuing the Conversation

```bash
# Second message (state persists)
curl -X POST http://localhost:3000/api/conversation \
  -H "Content-Type: application/json" \
  -d '{"input": "This is great!", "threadId": "user123"}'
```

**Response:**
```json
{
  "success": true,
  "result": {
    "threadId": "user123",
    "input": "This is great!",
    "response": "I'm glad to hear that! Your positive energy is contagious. What else is on your mind?",
    "sentiment": "positive",
    "turnCount": 2,
    "messageCount": 4,
    "conversationHistory": [
      // Previous messages...
      {
        "role": "user",
        "content": "This is great!",
        "timestamp": "2024-02-14T19:42:30.123Z"
      },
      {
        "role": "assistant",
        "content": "I'm glad to hear that!...",
        "timestamp": "2024-02-14T19:42:30.456Z",
        "detectedSentiment": "positive"
      }
    ]
  }
}
```

### Example 3: Testing Memory

```bash
# Ask about previous messages
curl -X POST http://localhost:3000/api/conversation \
  -H "Content-Type: application/json" \
  -d '{"input": "What did I say before?", "threadId": "user123"}'
```

**Response:**
```json
{
  "success": true,
  "result": {
    "threadId": "user123",
    "response": "You've said: \"Hello!\", \"This is great!\"",
    "turnCount": 3,
    "messageCount": 6
  }
}
```

### Example 4: Getting Conversation History

```bash
curl http://localhost:3000/api/conversation/history/user123
```

**Response:**
```json
{
  "success": true,
  "result": {
    "threadId": "user123",
    "messages": [
      // All messages in chronological order...
    ],
    "turnCount": 3
  }
}
```

### Example 5: Clearing Conversation

```bash
curl -X POST http://localhost:3000/api/conversation/clear \
  -H "Content-Type: application/json" \
  -d '{"threadId": "user123"}'
```

**Response:**
```json
{
  "success": true,
  "result": {
    "cleared": true,
    "threadId": "user123"
  }
}
```

### Example 6: Full Conversation Flow

```javascript
class ConversationClient {
  constructor(threadId = 'default') {
    this.threadId = threadId;
    this.baseUrl = 'http://localhost:3000';
  }
  
  async send(message) {
    const response = await fetch(`${this.baseUrl}/api/conversation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        input: message, 
        threadId: this.threadId 
      })
    });
    
    const data = await response.json();
    return data.result.response;
  }
  
  async getHistory() {
    const response = await fetch(
      `${this.baseUrl}/api/conversation/history/${this.threadId}`
    );
    const data = await response.json();
    return data.result.messages;
  }
  
  async clear() {
    await fetch(`${this.baseUrl}/api/conversation/clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId: this.threadId })
    });
  }
}

// Usage
const chat = new ConversationClient('alice');

console.log(await chat.send('Hi there!'));
// "Hello! Welcome to the conversation..."

console.log(await chat.send('I love this app!'));
// "I'm glad to hear that!..."

console.log(await chat.send('What did I say?'));
// "You've said: \"Hi there!\", \"I love this app!\""

const history = await chat.getHistory();
console.log(`Total messages: ${history.length}`);

await chat.clear();
```

### Sentiment Detection

The conversation graph detects sentiment based on keywords:

**Positive Keywords:**
- happy, great, good, love, thanks, awesome, excellent, wonderful

**Negative Keywords:**
- sad, bad, hate, angry, terrible, awful, frustrated, annoyed

**Examples:**

```bash
# Positive sentiment
curl -X POST http://localhost:3000/api/conversation \
  -H "Content-Type: application/json" \
  -d '{"input": "This is awesome!", "threadId": "test"}'
# Response: "I'm glad to hear that! Your positive energy is contagious..."

# Negative sentiment
curl -X POST http://localhost:3000/api/conversation \
  -H "Content-Type: application/json" \
  -d '{"input": "I'm frustrated", "threadId": "test"}'
# Response: "I'm sorry to hear that. Is there anything I can help with..."
```

### Thread Isolation

Different thread IDs maintain separate conversation states:

```javascript
// Two independent conversations
const user1 = new ConversationClient('alice');
const user2 = new ConversationClient('bob');

await user1.send('My name is Alice');
await user2.send('My name is Bob');

await user1.send('What did I say?');
// "You said: \"My name is Alice\""

await user2.send('What did I say?');
// "You said: \"My name is Bob\""
```

### Use Cases
- Chatbots with memory
- Multi-turn conversations
- Customer support systems
- Interactive assistants
- Session-based workflows

---

## Integration Examples

### Example 1: React Component

```jsx
import { useState } from 'react';

function SimpleGraphDemo() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:3000/api/simple-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input })
      });
      
      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter text..."
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Run Graph'}
        </button>
      </form>
      
      {result && (
        <div>
          <h3>Result: {result.formatted}</h3>
          <ul>
            {result.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### Example 2: Python Client

```python
import requests
import json

class LangGraphClient:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
    
    def simple_graph(self, text):
        response = requests.post(
            f"{self.base_url}/api/simple-graph",
            json={"input": text}
        )
        return response.json()["result"]
    
    def agent_graph(self, query):
        response = requests.post(
            f"{self.base_url}/api/agent-graph",
            json={"input": query}
        )
        return response.json()["result"]
    
    def multi_step_graph(self, text, max_iterations=5):
        response = requests.post(
            f"{self.base_url}/api/multi-step-graph",
            json={"input": text, "maxIterations": max_iterations}
        )
        return response.json()["result"]
    
    def send_message(self, message, thread_id="default"):
        response = requests.post(
            f"{self.base_url}/api/conversation",
            json={"input": message, "threadId": thread_id}
        )
        return response.json()["result"]

# Usage
client = LangGraphClient()

# Test simple graph
result = client.simple_graph("hello world")
print(f"Formatted: {result['formatted']}")

# Test agent
result = client.agent_graph("calculate 10 + 5")
print(f"Result: {result['result']}")

# Test conversation
response = client.send_message("Hi!", thread_id="user1")
print(f"Bot: {response['response']}")
```

### Example 3: Command Line Tool

```bash
#!/bin/bash
# langgraph-cli.sh - Simple CLI wrapper

API_BASE="http://localhost:3000"

case "$1" in
  simple)
    curl -s -X POST "$API_BASE/api/simple-graph" \
      -H "Content-Type: application/json" \
      -d "{\"input\": \"$2\"}" | jq -r '.result.formatted'
    ;;
  agent)
    curl -s -X POST "$API_BASE/api/agent-graph" \
      -H "Content-Type: application/json" \
      -d "{\"input\": \"$2\"}" | jq -r '.result.result'
    ;;
  chat)
    THREAD_ID="${3:-default}"
    curl -s -X POST "$API_BASE/api/conversation" \
      -H "Content-Type: application/json" \
      -d "{\"input\": \"$2\", \"threadId\": \"$THREAD_ID\"}" \
      | jq -r '.result.response'
    ;;
  *)
    echo "Usage: $0 {simple|agent|chat} \"message\" [thread_id]"
    exit 1
    ;;
esac
```

**Usage:**
```bash
chmod +x langgraph-cli.sh

./langgraph-cli.sh simple "hello"
# ✨ HELLO ✨

./langgraph-cli.sh agent "calculate 5 * 8"
# Calculator result: 5 * 8 = 40

./langgraph-cli.sh chat "Hi there" alice
# Hello! Welcome to the conversation...
```

---

## Troubleshooting

### Connection Refused

```bash
curl: (7) Failed to connect to localhost port 3000
```

**Solution:** Make sure the server is running:
```bash
npm start
```

### CORS Errors (Browser)

```javascript
// Error: CORS policy blocked
```

**Solution:** CORS is enabled by default. If you still see errors, check:
1. Server is running
2. Using correct port (3000)
3. No proxy/firewall blocking requests

### Empty Responses

```json
{"success": false, "error": "..."}
```

**Solution:** Check the error message in the response. Common issues:
- Invalid JSON in request body
- Missing required parameters
- Internal server error (check server logs)

---

## Next Steps

- Read the [API Documentation](./API.md) for complete endpoint reference
- See [Architecture Documentation](./ARCHITECTURE.md) to understand the system design
- Explore the graph implementations in the `graphs/` directory
- Try modifying graphs to add custom logic
- Integrate with your own applications
