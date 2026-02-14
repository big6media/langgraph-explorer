/**
 * Conversation Graph with Persistence
 * 
 * Demonstrates LangGraph's stateful capabilities:
 * - Checkpointing (persistence across invocations)
 * - Conversation memory
 * - Thread-based state isolation
 * - Human-in-the-loop patterns
 */

import { StateGraph, Annotation, END, MemorySaver } from "@langchain/langgraph";

// Define conversation state schema
const ConversationState = Annotation.Root({
  messages: Annotation({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),
  currentInput: Annotation({
    reducer: (_, y) => y,
    default: () => "",
  }),
  sentiment: Annotation({
    reducer: (_, y) => y,
    default: () => "neutral",
  }),
  turnCount: Annotation({
    reducer: (_, y) => y,
    default: () => 0,
  }),
});

// Node: Process user input and add to history
function processInput(state) {
  const userMessage = {
    role: "user",
    content: state.currentInput,
    timestamp: new Date().toISOString(),
  };
  
  return {
    messages: [userMessage],
    turnCount: state.turnCount + 1,
  };
}

// Node: Analyze sentiment (simple keyword-based)
function analyzeSentiment(state) {
  const input = state.currentInput.toLowerCase();
  let sentiment = "neutral";
  
  const positiveWords = ["happy", "great", "good", "love", "thanks", "awesome", "excellent", "wonderful"];
  const negativeWords = ["sad", "bad", "hate", "angry", "terrible", "awful", "frustrated", "annoyed"];
  
  if (positiveWords.some(word => input.includes(word))) {
    sentiment = "positive";
  } else if (negativeWords.some(word => input.includes(word))) {
    sentiment = "negative";
  }
  
  return { sentiment };
}

// Node: Generate response based on context and sentiment
function generateResponse(state) {
  const { sentiment, turnCount, messages } = state;
  
  let response;
  
  // Check for greetings
  const input = state.currentInput.toLowerCase();
  if (input.includes("hello") || input.includes("hi") || input.includes("hey")) {
    response = turnCount === 1 
      ? "Hello! Welcome to the conversation. How can I help you today?"
      : "Hello again! What else would you like to discuss?";
  }
  // Check for questions about conversation
  else if (input.includes("how many") && input.includes("message")) {
    response = `We've exchanged ${messages.length} messages so far in this conversation.`;
  }
  // Check for memory test
  else if (input.includes("what did i say") || input.includes("remember")) {
    const userMessages = messages.filter(m => m.role === "user").map(m => m.content);
    if (userMessages.length > 1) {
      response = `You've said: "${userMessages.slice(0, -1).join('", "')}"`;
    } else {
      response = "This is your first message in our conversation!";
    }
  }
  // Sentiment-based responses
  else if (sentiment === "positive") {
    response = "I'm glad to hear that! Your positive energy is contagious. What else is on your mind?";
  } else if (sentiment === "negative") {
    response = "I'm sorry to hear that. Is there anything I can help with to make things better?";
  }
  // Default response
  else {
    const responses = [
      `Interesting! You mentioned "${state.currentInput}". Tell me more about that.`,
      `I see. This is turn ${turnCount} of our conversation. What would you like to explore?`,
      `Thanks for sharing. Our conversation history is being preserved across messages.`,
    ];
    response = responses[turnCount % responses.length];
  }
  
  const assistantMessage = {
    role: "assistant",
    content: response,
    timestamp: new Date().toISOString(),
    detectedSentiment: sentiment,
  };
  
  return {
    messages: [assistantMessage],
  };
}

// Build the conversation graph
export function buildConversationGraph() {
  const workflow = new StateGraph(ConversationState)
    .addNode("processInput", processInput)
    .addNode("analyzeSentiment", analyzeSentiment)
    .addNode("generateResponse", generateResponse)
    .addEdge("__start__", "processInput")
    .addEdge("processInput", "analyzeSentiment")
    .addEdge("analyzeSentiment", "generateResponse")
    .addEdge("generateResponse", END);

  return workflow.compile();
}

// In-memory store for thread states (simulating persistence)
const threadStore = new Map();

// Get or create checkpointer for a thread
function getCheckpointer() {
  return new MemorySaver();
}

// Compiled graph with checkpointing
let compiledGraphWithMemory = null;
let checkpointer = null;

function getGraphWithMemory() {
  if (!compiledGraphWithMemory) {
    checkpointer = getCheckpointer();
    const workflow = new StateGraph(ConversationState)
      .addNode("processInput", processInput)
      .addNode("analyzeSentiment", analyzeSentiment)
      .addNode("generateResponse", generateResponse)
      .addEdge("__start__", "processInput")
      .addEdge("processInput", "analyzeSentiment")
      .addEdge("analyzeSentiment", "generateResponse")
      .addEdge("generateResponse", END);
    
    compiledGraphWithMemory = workflow.compile({ checkpointer });
  }
  return compiledGraphWithMemory;
}

export async function runConversationGraph(input, threadId = "default") {
  const graph = getGraphWithMemory();
  
  // Configuration with thread_id for state isolation
  const config = {
    configurable: {
      thread_id: threadId,
    },
  };
  
  const result = await graph.invoke(
    { currentInput: input },
    config
  );
  
  // Get the latest assistant message
  const assistantMessages = result.messages.filter(m => m.role === "assistant");
  const latestResponse = assistantMessages[assistantMessages.length - 1];
  
  return {
    threadId,
    input,
    response: latestResponse?.content || "No response generated",
    sentiment: result.sentiment,
    turnCount: result.turnCount,
    messageCount: result.messages.length,
    conversationHistory: result.messages,
    persistenceDemo: {
      explanation: "Each thread_id maintains separate conversation state",
      feature: "Messages persist across multiple invocations with same thread_id",
    },
  };
}

// Get conversation history for a thread
export async function getConversationHistory(threadId = "default") {
  const graph = getGraphWithMemory();
  
  const config = {
    configurable: {
      thread_id: threadId,
    },
  };
  
  try {
    const state = await graph.getState(config);
    return {
      threadId,
      messages: state.values?.messages || [],
      turnCount: state.values?.turnCount || 0,
    };
  } catch (error) {
    return {
      threadId,
      messages: [],
      turnCount: 0,
    };
  }
}

// Clear conversation (reset thread)
export function clearConversation(threadId = "default") {
  // Note: With MemorySaver, we can't easily delete. 
  // In production, you'd use a database-backed checkpointer.
  // For this demo, we recreate the graph.
  compiledGraphWithMemory = null;
  checkpointer = null;
  return { cleared: true, threadId };
}

// Get Mermaid diagram
export async function getConversationGraphDiagram() {
  return `flowchart TD
    A[Start] --> B[Process Input]
    B --> C[Analyze Sentiment]
    C --> D[Generate Response]
    D --> E[End]`;
}
