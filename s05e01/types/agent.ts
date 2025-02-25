import type { IDoc } from "./types";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export interface Tool {
  uuid: string;
  name: string;
  description: string;
  instruction: string;
  parameters: string;
}

export interface Action {
  uuid: string;
  name: string;
  description: string;
  result: string;
  tool_uuid: string;
}

export interface Step {
  name: string;
  query: string;
}

export interface State {
  messages: ChatCompletionMessageParam[];
  tools: Tool[];
  documents: IDoc[];
  actions: Action[];
  chatHistory: string;
  config: {
    max_steps: number;
    current_step: number;
    current_tool?: Tool;
    active_step?: Step | null;
  };
}

export interface ConversationResponse {
  _thinking: string;
  answer: string[];
}
