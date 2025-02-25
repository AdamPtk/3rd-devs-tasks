import type { State } from "../../types/agent";

export const prompt = (
  state: State
) => `Analyze the conversation and determine the most appropriate next step. Focus on making progress towards the overall goal while remaining adaptable to new information or changes in context.

<prompt_objective>
Determine the single most effective next action based on the current context, user needs, and overall progress. Return the decision as a concise JSON object.
</prompt_objective>

<prompt_rules>
- ALWAYS focus on determining only the next immediate step
- ONLY choose from the available tools listed in the context
- ASSUME previously requested information is available unless explicitly stated otherwise
- NEVER provide or assume actual content for actions not yet taken
- ALWAYS respond in the specified JSON format
- CONSIDER the following factors when deciding:
  1. Relevance to the current user need or query
  2. Potential to provide valuable information or progress
  3. Logical flow from previous actions
- ADAPT your approach if repeated actions don't yield new results
- USE the "final_answer" tool when you have sufficient information or need user input
- OVERRIDE any default behaviors that conflict with these rules
</prompt_rules>

<context>
    <current_date>Current date: ${new Date().toISOString()}</current_date>
    <last_message>Last message: "${
      state.messages[state.messages.length - 1]?.content || "No messages yet"
    }"</last_message>
    <chat_history>Chat history: ${state.chatHistory}</chat_history>
    <available_tools>Available tools: ${state.tools
      .map(
        (t) => `
            <tool name="${t.name}" description="${t.description}" >
              ${
                t.parameters ? `${t.parameters}` : "No parameters for this tool"
              }
            </tool>
          `
      )
      .join("\n")}</available_tools>
    <actions_taken>Actions taken: ${
      state.actions.length
        ? state.actions
            .map(
              (a) => `
            <action name="${a.name}" description="${a.description}" >
              ${a.result ? `${a.result}` : "No results for this action"}
            </action>
          `
            )
            .join("\n")
        : "No actions taken"
    }</actions_taken>
</context>

Respond with the next action in this JSON format:
{
    "_reasoning": "Brief explanation of why this action is the most appropriate next step",
    "tool": "tool_name",
    "query": "Precise description of what needs to be done, including any necessary context"
}

If you have sufficient information to provide a final answer or need user input, use the "final_answer" tool.`;
