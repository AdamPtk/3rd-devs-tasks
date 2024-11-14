import axios from 'axios';

import { systemPrompt } from "./prompts";

export class RobotService {
    private readonly baseUrl = 'https://centrala.ag3nts.org';

    async getData(apiKey: string): Promise<string> {
        
        try {
            const response = await axios.get(
                `${this.baseUrl}/data/${apiKey}/cenzura.txt`
            );
            
            return response.data;
        } catch (error) {
            console.error('Error in getData:', error);
            throw error;
        }
    }

    async askModel(text: string): Promise<string> {
        
        try {
            const response = await axios.post(
                `http://localhost:11434/api/generate`, {
                    // model: "llama2:7b",
                    model: "gemma2:2b",
                    system: systemPrompt,
                    prompt: text,
                    stream: false,
                }
            );
            console.log(response.data.response)
            
            return response.data.response;
        } catch (error) {
            console.error('Error in getData:', error);
            throw error;
        }
    }

    async sendFlag(apikey: string, answer: string): Promise<string> {
        
        try {
            const response = await axios.post(
                `${this.baseUrl}/report`, {
                    task: 'CENZURA',
                    apikey,
                    answer,
                }
            );
            console.log(response.data)
            
            return response.data;
        } catch (error) {
            console.error('Error in getData:', error);
            throw error;
        }
    }
}
