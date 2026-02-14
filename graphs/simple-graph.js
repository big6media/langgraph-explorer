/**
 * Simple Sequential Graph
 * 
 * Demonstrates LangGraph basics:
 * - Creating a StateGraph
 * - Defining nodes
 * - Connecting nodes in sequence
 * - State management with annotations
 */

import { StateGraph, Annotation, END } from "@langchain/langgraph";

// Define the state schema using Annotation
const GraphState = Annotation.Root({
  input: Annotation({
    reducer: (_, y) => y,
    default: () => "",
  }),
  processed: Annotation({
    reducer: (_, y) => y,
    default: () => "",
  }),
  formatted: Annotation({
    reducer: (_, y) => y,
    default: () => "",
  }),
  steps: Annotation({
    reducer: (x, y) => [...x, y],
    default: () => [],
  }),
});

// Node 1: Process the input
function processNode(state) {
  const processed = state.input.toUpperCase();
  return {
    processed,
    steps: `Processed: converted to uppercase`,
  };
}

// Node 2: Format the output
function formatNode(state) {
  const formatted = `✨ ${state.processed} ✨`;
  return {
    formatted,
    steps: `Formatted: added decoration`,
  };
}

// Node 3: Finalize
function finalizeNode(state) {
  return {
    steps: `Finalized: workflow complete`,
  };
}

// Build and compile the graph
export function buildSimpleGraph() {
  const workflow = new StateGraph(GraphState)
    .addNode("process", processNode)
    .addNode("format", formatNode)
    .addNode("finalize", finalizeNode)
    .addEdge("__start__", "process")
    .addEdge("process", "format")
    .addEdge("format", "finalize")
    .addEdge("finalize", END);

  return workflow.compile();
}

// Get Mermaid diagram for visualization
export async function getSimpleGraphDiagram() {
  return `flowchart TD
    A[Start] --> B[Process]
    B --> C[Format]
    C --> D[Finalize]
    D --> E[End]`;
}

export async function runSimpleGraph(input) {
  const graph = buildSimpleGraph();
  
  const result = await graph.invoke({
    input: input || "Hello LangGraph!",
  });

  return {
    originalInput: input,
    processed: result.processed,
    formatted: result.formatted,
    steps: result.steps,
    graphStructure: {
      nodes: ["process", "format", "finalize"],
      edges: ["START → process", "process → format", "format → finalize", "finalize → END"],
    },
  };
}
