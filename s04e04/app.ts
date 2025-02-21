import express from 'express';
import { OpenAIService } from './OpenAIService';
import { prompt as navigatePrompt } from './prompts/navigate';
import type OpenAI from 'openai';
const app = express();
const port = 3000;

const openaiService = new OpenAIService();

app.use(express.json());

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});

app.post('/answer', async (req, res) => {
  console.log('req:', req.body);
  const { instruction } = req.body;

  try {
    const result = await openaiService.completion({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: navigatePrompt,
        },
        {
          role: 'user',
          content: instruction,
        },
      ],
    }) as OpenAI.Chat.Completions.ChatCompletion;

    console.log('answer:', result.choices[0].message.content);

    const answer = { description: result.choices[0].message.content };
    res.json(answer);
  } catch (error) {
    console.error('Error during Google authentication:', error);
    res.status(500).send('Authentication failed');
  }
});
