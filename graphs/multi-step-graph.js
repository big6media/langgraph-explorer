/**
 * Multi-Step Graph with Cycles
 * 
 * Demonstrates LangGraph capabilities:
 * - Cycles in the graph (iterative refinement)
 * - State accumulation
 * - Conditional continuation/termination
 */

import { StateGraph, Annotation, END } from "@langchain/langgraph";

// Define the state schema
const MultiStepState = Annotation.Root({
  input: Annotation({
    reducer: (_, y) => y,
    default: () => "",
  }),
  currentValue: Annotation({
    reducer: (_, y) => y,
    default: () => 0,
  }),
  targetValue: Annotation({
    reducer: (_, y) => y,
    default: () => 100,
  }),
  iteration: Annotation({
    reducer: (_, y) => y,
    default: () => 0,
  }),
  maxIterations: Annotation({
    reducer: (_, y) => y,
    default: () => 5,
  }),
  history: Annotation({
    reducer: (x, y) => [...x, y],
    default: () => [],
  }),
  status: Annotation({
    reducer: (_, y) => y,
    default: () => "running",
  }),
});

// Node: Initialize the process
function initializeNode(state) {
  // Parse target from input or use default
  const match = state.input.match(/\d+/);
  const target = match ? parseInt(match[0]) : 100;
  
  return {
    currentValue: 0,
    targetValue: Math.min(target, 1000), // Cap at 1000 for demo
    iteration: 0,
    history: `Initialized: target = ${Math.min(target, 1000)}`,
    status: "running",
  };
}

// Node: Process one step
function processStepNode(state) {
  const increment = Math.floor((state.targetValue - state.currentValue) / 2) || 1;
  const newValue = Math.min(state.currentValue + increment, state.targetValue);
  const newIteration = state.iteration + 1;
  
  return {
    currentValue: newValue,
    iteration: newIteration,
    history: `Step ${newIteration}: ${state.currentValue} → ${newValue} (added ${increment})`,
  };
}

// Node: Check if we should continue
function evaluateNode(state) {
  const reachedTarget = state.currentValue >= state.targetValue;
  const reachedMaxIterations = state.iteration >= state.maxIterations;
  
  let status;
  let historyEntry;
  
  if (reachedTarget) {
    status = "completed";
    historyEntry = `Evaluation: Reached target value ${state.targetValue}! ✓`;
  } else if (reachedMaxIterations) {
    status = "max_iterations";
    historyEntry = `Evaluation: Reached max iterations (${state.maxIterations}). Current: ${state.currentValue}`;
  } else {
    status = "continue";
    historyEntry = `Evaluation: Continue (${state.currentValue}/${state.targetValue}, iteration ${state.iteration}/${state.maxIterations})`;
  }
  
  return {
    status,
    history: historyEntry,
  };
}

// Node: Finalize
function finalizeNode(state) {
  const summary = state.status === "completed" 
    ? `Successfully reached ${state.targetValue} in ${state.iteration} steps!`
    : `Stopped at ${state.currentValue} after ${state.iteration} iterations (target was ${state.targetValue})`;
    
  return {
    history: `Finalized: ${summary}`,
  };
}

// Router function
function shouldContinue(state) {
  return state.status === "continue" ? "process" : "finalize";
}

// Build the multi-step graph
export function buildMultiStepGraph() {
  const workflow = new StateGraph(MultiStepState)
    .addNode("initialize", initializeNode)
    .addNode("process", processStepNode)
    .addNode("evaluate", evaluateNode)
    .addNode("finalize", finalizeNode)
    .addEdge("__start__", "initialize")
    .addEdge("initialize", "process")
    .addEdge("process", "evaluate")
    .addConditionalEdges("evaluate", shouldContinue, {
      process: "process",
      finalize: "finalize",
    })
    .addEdge("finalize", END);

  return workflow.compile();
}

export async function runMultiStepGraph(input, maxIterations = 5) {
  const graph = buildMultiStepGraph();
  
  const result = await graph.invoke({
    input: input || "Count to 100",
    maxIterations,
  });

  return {
    input: result.input,
    finalValue: result.currentValue,
    targetValue: result.targetValue,
    iterations: result.iteration,
    maxIterations: result.maxIterations,
    status: result.status,
    history: result.history,
    graphStructure: {
      nodes: ["initialize", "process", "evaluate", "finalize"],
      cycle: "process → evaluate → process (repeats until done)",
      termination: "evaluate → finalize (when target reached or max iterations)",
    },
  };
}

// Get Mermaid diagram for visualization
export async function getMultiStepGraphDiagram() {
  return `flowchart TD
    A[Start] --> B[Initialize]
    B --> C[Process]
    C --> D{Evaluate}
    D -->|continue| C
    D -->|done| E[Finalize]
    E --> F[End]`;
}
