import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

// Import LangGraph examples
import { runSimpleGraph, getSimpleGraphDiagram } from "./graphs/simple-graph.js";
import { runAgentGraph, getAgentGraphDiagram } from "./graphs/agent-graph.js";
import { runMultiStepGraph, getMultiStepGraphDiagram } from "./graphs/multi-step-graph.js";
import { runConversationGraph, getConversationHistory, clearConversation, getConversationGraphDiagram } from "./graphs/conversation-graph.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, "public")));

// API Routes

// Simple sequential graph - demonstrates basic node connections
app.post("/api/simple-graph", async (req, res) => {
  try {
    const { input } = req.body;
    const result = await runSimpleGraph(input);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Agent graph - demonstrates conditional routing and tool use
app.post("/api/agent-graph", async (req, res) => {
  try {
    const { input } = req.body;
    const result = await runAgentGraph(input);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Multi-step graph - demonstrates state management and cycles
app.post("/api/multi-step-graph", async (req, res) => {
  try {
    const { input, maxIterations } = req.body;
    const result = await runMultiStepGraph(input, maxIterations || 3);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Conversation graph with persistence
app.post("/api/conversation", async (req, res) => {
  try {
    const { input, threadId } = req.body;
    const result = await runConversationGraph(input, threadId || "default");
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/conversation/history/:threadId", async (req, res) => {
  try {
    const result = await getConversationHistory(req.params.threadId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/conversation/clear", async (req, res) => {
  try {
    const { threadId } = req.body;
    const result = clearConversation(threadId || "default");
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper to clean Mermaid diagrams for browser rendering
function cleanMermaidDiagram(diagram) {
  return diagram
    .replace(/<p>/g, '')
    .replace(/<\/p>/g, '')
    .replace(/\t/g, '  ')
    .replace(/:::first/g, '')
    .replace(/:::last/g, '')
    .replace(/classDef[^;]+;/g, '')
    .replace(/%%\{init:.*?\}%%\n?/g, '')
    .replace(/\n\s*\n/g, '\n');
}

// Graph diagram endpoints
app.get("/api/diagrams/simple", async (req, res) => {
  try {
    const diagram = await getSimpleGraphDiagram();
    res.json({ success: true, diagram: cleanMermaidDiagram(diagram) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/diagrams/agent", async (req, res) => {
  try {
    const diagram = await getAgentGraphDiagram();
    res.json({ success: true, diagram: cleanMermaidDiagram(diagram) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/diagrams/multistep", async (req, res) => {
  try {
    const diagram = await getMultiStepGraphDiagram();
    res.json({ success: true, diagram: cleanMermaidDiagram(diagram) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/diagrams/conversation", async (req, res) => {
  try {
    const diagram = await getConversationGraphDiagram();
    res.json({ success: true, diagram: cleanMermaidDiagram(diagram) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 LangGraph Explorer running at http://localhost:${PORT}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  POST /api/simple-graph    - Basic sequential workflow`);
  console.log(`  POST /api/agent-graph     - Agent with conditional routing`);
  console.log(`  POST /api/multi-step-graph - Iterative refinement workflow`);
});
