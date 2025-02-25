import type {
  ChatCompletionMessageParam,
  ChatCompletion,
} from "openai/resources/chat/completions";
import type OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";

import { OpenAIService } from "./OpenAIService";
// import { WebSearchService } from "./WebSearch";
import { prompt as answerPrompt } from "./prompts/assistant/answer"; // Import the answer prompt
import { prompt as planPrompt } from "./prompts/agent/plan";
import { prompt as authorsRevalidatePrompt } from "./prompts/conversations/authorsRevalidate";
import { prompt as fetchInfoPrompt } from "./prompts/agent/fetch";
import type { State } from "./types/agent";

export class Agent {
  private openaiService: OpenAIService;
  // private webSearchService: WebSearchService;
  private state: State;

  constructor(state: State) {
    this.openaiService = new OpenAIService();
    // this.webSearchService = new WebSearchService();
    this.state = state;
  }

  async plan() {
    const systemMessage: ChatCompletionMessageParam = {
      role: "system",
      content: planPrompt(this.state),
    };

    const answer = (await this.openaiService.completion({
      messages: [systemMessage],
      model: "gpt-4o",
      stream: false,
      jsonMode: true,
    })) as ChatCompletion;

    const result = JSON.parse(answer.choices[0].message.content ?? "{}");
    return result.hasOwnProperty("tool") ? result : null;
  }

  async useTool(tool: string, query: string) {
    // if (tool === "extract_info") {
    //   const answer = (await this.openaiService.completion({
    //     messages: [
    //       {
    //         role: "system",
    //         content: extractInfoPrompt(this.state),
    //       },
    //     ],
    //     model: "gpt-4o",
    //   })) as OpenAI.Chat.Completions.ChatCompletion;
    // }
    if (tool === "add_authors") {
      const answer = (await this.openaiService.completion({
        messages: [
          {
            role: "system",
            content: authorsRevalidatePrompt(this.state),
          },
          {
            role: "user",
            content: `Query: ${query}`,
          },
        ],
        model: "gpt-4o",
      })) as OpenAI.Chat.Completions.ChatCompletion;

      this.state.actions.push({
        uuid: uuidv4(),
        name: tool,
        description: "Revalidate the authors of the conversations",
        result: answer.choices[0].message.content ?? "",
        tool_uuid: tool,
      });
    }
    if (tool === "fetch_info") {
      const answer = (await this.openaiService.completion({
        messages: [
          {
            role: "system",
            content: fetchInfoPrompt(this.state),
          },
        ],
        model: "gpt-4o",
        jsonMode: true,
      })) as OpenAI.Chat.Completions.ChatCompletion;
    }
  }

  async generateAnswer() {
    const context = this.state.actions;

    const answer = await this.openaiService.completion({
      messages: [
        {
          role: "system",
          content: answerPrompt({
            conversations: this.state.documents[0].text,
            facts: this.state.documents[1].text,
            context,
            chatHistory: this.state.chatHistory,
          }), // Use the answer prompt with context
        },
        ...this.state.messages,
      ],
      model: "gpt-4o",
      stream: false,
    });

    return answer;
  }
}
