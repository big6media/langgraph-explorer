/**
 * Agent Graph with Conditional Routing
 * 
 * Demonstrates LangGraph capabilities:
 * - Conditional edges (routing based on state)
 * - Tool-like nodes
 * - Decision making without LLM (for demo purposes)
 */

import { StateGraph, Annotation, END } from "@langchain/langgraph";

// Define the state schema
const AgentState = Annotation.Root({
  input: Annotation({
    reducer: (_, y) => y,
    default: () => "",
  }),
  intent: Annotation({
    reducer: (_, y) => y,
    default: () => "",
  }),
  result: Annotation({
    reducer: (_, y) => y,
    default: () => "",
  }),
  steps: Annotation({
    reducer: (x, y) => [...x, y],
    default: () => [],
  }),
});

// Node: Classify the intent
function classifyIntent(state) {
  const input = state.input.toLowerCase();
  let intent;
  
  if (input.includes("calculate") || input.includes("math") || /\d+\s*[\+\-\*\/]\s*\d+/.test(input)) {
    intent = "calculator";
  } else if (input.includes("weather") || input.includes("temperature")) {
    intent = "weather";
  } else if (input.includes("search") || input.includes("find") || input.includes("look up")) {
    intent = "search";
  } else {
    intent = "general";
  }
  
  return {
    intent,
    steps: `Classified intent as: ${intent}`,
  };
}

// Tool nodes
function calculatorTool(state) {
  // Simple expression extraction and evaluation
  const match = state.input.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
  let result;
  
  if (match) {
    const [, a, op, b] = match;
    const num1 = parseInt(a);
    const num2 = parseInt(b);
    switch (op) {
      case "+": result = num1 + num2; break;
      case "-": result = num1 - num2; break;
      case "*": result = num1 * num2; break;
      case "/": result = num2 !== 0 ? num1 / num2 : "Error: Division by zero"; break;
    }
    result = `Calculator result: ${num1} ${op} ${num2} = ${result}`;
  } else {
    result = "Calculator: No valid expression found. Try something like 'calculate 5 + 3'";
  }
  
  return {
    result,
    steps: `Used calculator tool`,
  };
}

function weatherTool(state) {
  // Mock weather data
  const cities = {
    "new york": "72°F, Sunny",
    "london": "58°F, Cloudy",
    "tokyo": "68°F, Partly Cloudy",
    "paris": "64°F, Rainy",
  };
  
  const input = state.input.toLowerCase();
  let result = "Weather: City not found. Try: New York, London, Tokyo, or Paris";
  
  for (const [city, weather] of Object.entries(cities)) {
    if (input.includes(city)) {
      result = `Weather in ${city.charAt(0).toUpperCase() + city.slice(1)}: ${weather}`;
      break;
    }
  }
  
  return {
    result,
    steps: `Used weather tool`,
  };
}

function searchTool(state) {
  return {
    result: `Search: Would search for "${state.input.replace(/search|find|look up/gi, "").trim()}"`,
    steps: `Used search tool`,
  };
}

function generalResponse(state) {
  return {
    result: `I understood your message: "${state.input}". This is a general response since no specific tool matched.`,
    steps: `Generated general response`,
  };
}

// Router function for conditional edges
function routeByIntent(state) {
  const routes = {
    calculator: "calculator",
    weather: "weather",
    search: "search",
    general: "general",
  };
  return routes[state.intent] || "general";
}

// Build the agent graph
export function buildAgentGraph() {
  const workflow = new StateGraph(AgentState)
    .addNode("classify", classifyIntent)
    .addNode("calculator", calculatorTool)
    .addNode("weather", weatherTool)
    .addNode("search", searchTool)
    .addNode("general", generalResponse)
    .addEdge("__start__", "classify")
    .addConditionalEdges("classify", routeByIntent, {
      calculator: "calculator",
      weather: "weather",
      search: "search",
      general: "general",
    })
    .addEdge("calculator", END)
    .addEdge("weather", END)
    .addEdge("search", END)
    .addEdge("general", END);

  return workflow.compile();
}

export async function runAgentGraph(input) {
  const graph = buildAgentGraph();
  
  const result = await graph.invoke({
    input: input || "What's the weather in Tokyo?",
  });

  return {
    input: result.input,
    detectedIntent: result.intent,
    result: result.result,
    steps: result.steps,
    graphStructure: {
      nodes: ["classify", "calculator", "weather", "search", "general"],
      conditionalRouting: "classify → (calculator | weather | search | general) based on intent",
    },
  };
}

// Get Mermaid diagram for visualization
export async function getAgentGraphDiagram() {
  return `flowchart TD
    A[Start] --> B[Classify Intent]
    B --> C[Calculator]
    B --> D[Weather]
    B --> E[Search]
    B --> F[General]
    C --> G[End]
    D --> G
    E --> G
    F --> G`;
}
