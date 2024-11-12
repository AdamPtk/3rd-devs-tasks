import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import axios from 'axios';
import fs from 'fs';
import path from 'path';

import { OpenAIService } from "./OpenAIService";
import { test } from "gray-matter";

export class RobotService {
    private readonly baseUrl = 'https://centrala.ag3nts.org';
    private openAIService: OpenAIService;

    constructor() {
        this.openAIService = new OpenAIService();
    }

    async getData(apiKey: string): Promise<any> {
        const dataPath = path.join(__dirname, 'data.json');
        
        try {
            // Check if file exists
            if (fs.existsSync(dataPath)) {
                console.log('Reading from existing data.json file');
                const data = fs.readFileSync(dataPath, 'utf8');
                const jsonData = JSON.parse(data);
                
                const testQuestions = jsonData['test-data']
                    .filter((obj: any) => 'test' in obj)
                    .map((obj: any) => obj.test.q);

                const answers = await this.getAnswersForQuestions(testQuestions);
                let num = 0
                jsonData['test-data'].forEach((obj: any, index: number) => {
                    if ('test' in obj) {
                        obj.test.a = answers[num].answer;
                        num++;
                    }
                })
                
                return jsonData;
            }

            console.log('Fetching new data from API');
            const response = await axios.get(
                `${this.baseUrl}/data/${apiKey}/json.txt`
            );

            fs.writeFileSync(dataPath, JSON.stringify(response.data, null, 2));
            
            const testQuestions = response.data['test-data']
                .filter((obj: any) => 'test' in obj)
                .map((obj: any) => obj.test.q);

            const answers = await this.getAnswersForQuestions(testQuestions);
            let num = 0
            const data = response.data;
            data['test-data'].forEach((obj: any, index: number) => {
                if ('test' in obj) {
                    obj.test.a = answers[num].answer;
                    num++;
                }
            })
            
            return data;
        } catch (error) {
            console.error('Error in getData:', error);
            throw error;
        }
    }

    private async getAnswersForQuestions(questions: string[]): Promise<any[]> {
        const answers = [];
        
        for (const question of questions) {
            const messages: ChatCompletionMessageParam[] = [
                {
                    role: "system",
                    content: "You are a helpful assistant. Answer questions directly and concisely, without explanations. Return ONLY the answer in one word, without any other text."
                },
                {
                    role: "user",
                    content: question
                }
            ];

            const response = await this.openAIService.completion(messages, "gpt-4o-mini") as OpenAI.Chat.Completions.ChatCompletion;
            
            const answer = response.choices[0].message.content?.trim() || "";
            
            answers.push({
                question,
                answer
            });
        }

        return answers;
    }
}
