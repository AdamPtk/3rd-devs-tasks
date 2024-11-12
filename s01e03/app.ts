import express from 'express';
import { RobotService } from './RobotService';
import { OpenAIService } from './OpenAIService';

interface dataItem {
    question: string;
    answer: number;
    test?: {q: string, a: string};
  }

const app = express();
const port = 3000;
app.use(express.json());

const robotService = new RobotService();
const openaiService = new OpenAIService();

app.get('/api/getFlag', async (req, res) => {
  try {
    const apiKey = process.env.AIDEVS_API_KEY;
    if (!apiKey) {
      throw new Error('AIDEVS_API_KEY is not set in environment variables');
    }

    const data = await robotService.getData(apiKey);
    console.log('AI Answers:', data);
    
    res.json(data);

  } catch (error) {
    console.error('Error in getFlag:', error);
    res.status(500).json({ error: 'An error occurred during the flag retrieval process' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Use GET /api/getFlag to start the flag retrieval process');
});
