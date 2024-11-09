import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import axios from 'axios';
import * as cheerio from 'cheerio';

export class RobotService {
  private openaiService: OpenAI;
  private baseUrl: string;
  private credentials: {
    username: string;
    password: string;
  };

  constructor() {
    this.openaiService = new OpenAI();
    this.baseUrl = 'https://xyz.ag3nts.org';
    this.credentials = {
      username: 'tester',
      password: '574e112a'
    };
  }

  async getQuestion(): Promise<string> {
    try {
      const response = await axios.get(this.baseUrl);
      const $ = cheerio.load(response.data);
      // Adjust the selector based on the actual HTML structure
      const question = $('#human-question').text().trim();
      return question;
    } catch (error) {
      console.error('Error fetching question:', error);
      throw error;
    }
  }

  async getAnswer(question: string): Promise<string> {
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are a helpful assistant that answers simple questions. 
                 Provide only the answer without any explanation or additional text.
                 Keep answers as concise as possible. Give only the answer you are asked for. No more, no less.`
      },
      {
        role: 'user',
        content: question
      }
    ];

    try {
      const completion = await this.openaiService.chat.completions.create({
        messages,
        model: "gpt-4o-mini",
        temperature: 0,
        max_tokens: 50
      });

      return completion.choices[0].message.content?.trim() || '';
    } catch (error) {
      console.error('Error getting answer from LLM:', error);
      throw error;
    }
  }

  async login(answer: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('username', this.credentials.username);
      formData.append('password', this.credentials.password);
      formData.append('answer', answer);

      const response = await axios.post(this.baseUrl, formData);
      console.log('response:', response.data)

      if (response.data.url) {
        return response.data.url;
      }

      throw new Error('No URL in response');
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  async accessSecretPage(url: string): Promise<string> {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error accessing secret page:', error);
      throw error;
    }
  }
} 