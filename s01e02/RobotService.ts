import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import axios from 'axios';
import { OpenAIService } from "./OpenAIService";

export class RobotService {
  private openAIService: OpenAIService;
  private baseUrl: string;

  constructor() {
    this.openAIService = new OpenAIService();
    this.baseUrl = 'https://xyz.ag3nts.org';
  }

  async getInitialData(): Promise<{initialMessage: string, securityAnalysis: string}> {
    try {
      const response = await axios.get(`${this.baseUrl}/files/0_13_4b.txt`);
      const data = response.data;

      // First completion to extract JSON configuration
      const configMessages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: 'Extract only the JSON configuration for starting a conversation from the provided text. Return a valid JSON object in format: {"...": ...,"...": "..."}, nothing else.'
        },
        {
          role: 'user',
          content: data
        }
      ];

      // Second completion to check for security issues
      const securityMessages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: 'Find the standard incorrect information according to RoboISO 2230 norm. Do not modify them.Return ONLY the findings in markdown-alike format.'
        },
        {
          role: 'user',
          content: data
        }
      ];

      const [configResult, securityResult] = await Promise.all([
        this.openAIService.completion(configMessages, 'gpt-4o-mini', false),
        this.openAIService.completion(securityMessages, 'gpt-4o-mini', false)
      ]);

      if ('choices' in configResult && configResult.choices[0].message.content && 'choices' in securityResult && securityResult.choices[0].message.content) {
        return {initialMessage: configResult.choices[0].message.content, securityAnalysis: securityResult.choices[0].message.content};
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching initial data:', error);
      throw error;
    }
  }

  async verifyStep(payload: any): Promise<{ msgID: number, text: string }> {
    try {
      const response = await axios.post(`${this.baseUrl}/verify`, payload);
      console.log('verifyStep response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in verification step:', error);
      throw error;
    }
  }

  async getAnswerForQuestion(question: string, securityAnalysis: string): Promise<string> {
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are a helpful assistant. Provide ONLY the direct answer to the question. Answer in English. No explanations or additional text. No markdown. No dots and commas.
        If the question requires some of the following information, use it: ${securityAnalysis}
        <snippet_examples>
          QUESTION: What is the capital of Poland?
          AI: Krakow\
          
          QUESTION: Dwucyforwa liczba jaka jest?
          AI: 69
          
          QUESTION: Current year?
          AI: 1999

          QUESTION: Kolor nieba?
          AI: Blue
          
        </snippet_examples>`
      },
      {
        role: 'user',
        content: question
      }
    ];

    const result = await this.openAIService.completion(messages, 'gpt-4o', false);
    if ('choices' in result && result.choices[0].message.content) {
      return result.choices[0].message.content.trim();
    }
    
    throw new Error('Failed to get answer from OpenAI');
  }

  async submitAnswer(msgID: number, text: string): Promise<{ msgID: number, text: string }> {
    const payload = {
      msgID,
      text
    };
    return this.verifyStep(payload);
  }
}
