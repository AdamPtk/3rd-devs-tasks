import express from "express";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import type {
  ChatCompletion,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import { v4 as uuidv4 } from "uuid";

import { OpenAIService } from "./OpenAIService";
import { Agent } from "./AgentService";
import { appendChatHistory, processConversations } from "./helpers";
import type { State } from "./types/agent";

// Constants
const API_URL =
  "https://centrala.ag3nts.org/data/ddbf3ad6-ac51-419d-9792-9b61323111c3/phone_sorted.json";
const MODEL_NAME = "gpt-4o-mini";
const OUTPUT_DIR = "markdowns";
const CONVERSATIONS_FILE = "conversationsWithAuthors.md";
const CHAT_HISTORY_FILE = "chatHistory.md";
const FACTS_FILE = "facts.md";
const PORT = 3000;

const factsPath = join(__dirname, OUTPUT_DIR, FACTS_FILE);
const conversationsPath = join(__dirname, OUTPUT_DIR, CONVERSATIONS_FILE);
const chatHistoryPath = join(__dirname, OUTPUT_DIR, CHAT_HISTORY_FILE);
const app = express();

app.use(express.json());
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const openAIService = new OpenAIService();

const state: State = {
  config: { max_steps: 10, current_step: 0, active_step: null },
  messages: [],
  tools: [
    // {
    //   uuid: uuidv4(),
    //   name: "extract_info",
    //   description:
    //     "Use this tool to extract neededinformation from the conversation before proceeding if you are not sure",
    //   instruction: "...",
    //   parameters: JSON.stringify({}),
    // },
    {
      uuid: uuidv4(),
      name: "add_authors",
      description: "Use this tool to add or modify authors of conversations",
      instruction: "...",
      parameters: JSON.stringify({}),
    },
    {
      uuid: uuidv4(),
      name: "fetch_info",
      description: "Use this tool if you are asked to fetch or about the API",
      instruction: "...",
      parameters: JSON.stringify({}),
    },
    {
      uuid: uuidv4(),
      name: "final_answer",
      description: "Use this tool to write a message to the user",
      instruction: "...",
      parameters: JSON.stringify({}),
    },
  ],
  documents: [
    {
      text: existsSync(conversationsPath)
        ? await readFile(conversationsPath, "utf-8")
        : "",
      metadata: {
        uuid: uuidv4(),
        name: CONVERSATIONS_FILE,
        description: "Conversations data",
        source: "",
        tokens: 0,
        type: "text",
        content_type: "chunk",
      },
    },
    {
      text: existsSync(factsPath) ? await readFile(factsPath, "utf-8") : "",
      metadata: {
        uuid: uuidv4(),
        name: FACTS_FILE,
        description: "Facts data",
        source: "",
        tokens: 0,
        type: "text",
        content_type: "chunk",
      },
    },
  ],
  actions: [],
  chatHistory: "",
};

async function main() {
  try {
    if (state.documents[0].text.trim() === "") {
      await processConversations(
        openAIService,
        state,
        API_URL,
        MODEL_NAME,
        CONVERSATIONS_FILE
      );
    }
    state.actions.push({
      uuid: uuidv4(),
      name: "add_authors",
      description: "Add authors to the conversations",
      result:
        "Authors of each conversation have been added after analysing the given facts",
      tool_uuid: "add_authors",
    });

    console.log("Enhancing conversations with authors done.");
  } catch (error) {
    console.error("Fatal error occurred:", error);
  }
}

main();

app.post("/api/chat", async (req, res) => {
  let { messages } = req.body;
  state.messages =
    messages.length === 1
      ? [
          ...state.messages,
          ...messages.filter(
            (m: ChatCompletionMessageParam) => m.role !== "system"
          ),
        ]
      : messages.filter((m: ChatCompletionMessageParam) => m.role !== "system");

  const agent = new Agent(state);

  state.chatHistory = existsSync(chatHistoryPath)
    ? await readFile(chatHistoryPath, "utf-8")
    : "";

  for (let i = 0; i < state.config.max_steps; i++) {
    // Make a plan
    const nextMove = await agent.plan();
    console.log("Thinking...", nextMove._reasoning);
    console.table([
      {
        Tool: nextMove.tool,
        Query: nextMove.query,
      },
    ]);
    // If there's no tool to use, we're done
    if (!nextMove.tool || nextMove.tool === "final_answer") break;
    // Set the active step
    state.config.active_step = {
      name: nextMove.tool,
      query: nextMove.query,
    };

    // Use the tool
    await agent.useTool(nextMove.tool, nextMove.query);

    // Increase the step counter
    state.config.current_step++;
  }

  // Generate the answer
  const answer = (await agent.generateAnswer()) as ChatCompletion;
  state.messages = [...state.messages, answer.choices[0].message];

  await appendChatHistory(
    messages[messages.length - 1].content,
    answer.choices[0].message.content ?? "",
    CHAT_HISTORY_FILE
  );
  console.log(state.actions);

  return res.json(answer);
});
