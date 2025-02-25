import { appendFile, writeFile } from "fs/promises";
import { join } from "path";

import { OpenAIService } from "./OpenAIService";
import { prompt as authorsPrompt } from "./prompts/conversations/authors";

import type { ConversationResponse, State } from "./types/agent";
import type OpenAI from "openai";

export async function appendToMarkdown(
  conversation: string[],
  key: string,
  CONVERSATIONS_FILE: string
) {
  const content = `
  ## ${key}
  
  ${conversation.join("\n\n")}
  
  ---
  `;

  await appendFile(
    join(__dirname, "markdowns", CONVERSATIONS_FILE),
    content,
    "utf-8"
  );
}

export async function processConversations(
  openAIService: OpenAIService,
  state: State,
  API_URL: string,
  MODEL_NAME: string,
  CONVERSATIONS_FILE: string
) {
  const conversationsPath = join(__dirname, "markdowns", CONVERSATIONS_FILE);
  await writeFile(conversationsPath, "", "utf-8");
  console.log("Fetching conversations from API...");
  let conversationsWithAuthors = "";

  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch conversations: ${response.statusText}`);
  }
  const conversations = await response.json();

  for (const [key, conversation] of Object.entries(conversations)) {
    try {
      const enhancedConversation = (await openAIService.completion({
        messages: [
          {
            role: "user",
            content: authorsPrompt(
              state.documents[1].text,
              conversation as string[]
            ),
          },
        ],
        model: MODEL_NAME,
        jsonMode: true,
      })) as OpenAI.Chat.Completions.ChatCompletion;

      const content = enhancedConversation.choices[0].message.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }

      const result = JSON.parse(content) as ConversationResponse;
      console.log(`Processing conversation ${key}:`, result._thinking);
      await appendToMarkdown(result.answer, key, CONVERSATIONS_FILE);
      conversationsWithAuthors += `## ${key}\n\n${result.answer.join(
        "\n\n"
      )}\n\n---\n\n`;
    } catch (error) {
      console.error(`Error processing conversation ${key}:`, error);
      continue;
    }
  }
}

export async function appendChatHistory(
  userMessage: string,
  assistantResponse: string,
  CHAT_HISTORY_FILE: string
): Promise<void> {
  const timestamp = new Date().toISOString();
  const content = `
## Conversation at ${timestamp}

### User
${userMessage}

### Assistant
${assistantResponse}

---
`;

  await appendFile(
    join(__dirname, "markdowns", CHAT_HISTORY_FILE),
    content,
    "utf-8"
  );
}
