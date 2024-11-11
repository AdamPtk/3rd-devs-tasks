import express from 'express';
import { RobotService } from './RobotService';
import { OpenAIService } from './OpenAIService';

const app = express();
const port = 3000;
app.use(express.json());

const robotService = new RobotService();
const openaiService = new OpenAIService();

app.get('/api/getFlag', async (req, res) => {
  try {
    // Step 1: Get the initial prompt
    const initialData = await robotService.getInitialData();
    const initialMessage = initialData.initialMessage;
    const securityAnalysis = initialData.securityAnalysis;
    console.log('Initial message received:', initialMessage);
    console.log('Security analysis:', securityAnalysis);

    // // Step 2: Verify and get the question
    const question = await robotService.verifyStep(JSON.parse(initialMessage));
    const msgID = question.msgID;
    const text = question.text;
    console.log('Question received:', question);

    // // Step 3: Get answer for the question
    const answer = await robotService.getAnswerForQuestion(text, securityAnalysis);
    console.log('Generated answer:', answer);

    // // Step 4: Submit the answer
    const nextStep = await robotService.submitAnswer(msgID, answer);
    console.log('Next step:', nextStep);

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
