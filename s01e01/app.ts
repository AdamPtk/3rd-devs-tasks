import express from 'express';
import { RobotService } from './RobotService';

const app = express();
const port = 3000;
app.use(express.json());

const robotService = new RobotService();

async function attemptLogin() {
  try {
    // Get the current question
    const question = await robotService.getQuestion();
    console.log('Current question:', question);

    // Get answer from LLM
    const answer = await robotService.getAnswer(question);
    console.log('LLM answer:', answer);

    // Attempt login with the answer
    const secretUrl = await robotService.login(answer);
    console.log('Received secret URL:', secretUrl);

    // Access the secret page
    const secretContent = await robotService.accessSecretPage(secretUrl);
    console.log('Secret page content:', secretContent);

    return secretContent;
  } catch (error) {
    console.error('Error in login attempt:', error);
    throw error;
  }
}

// Endpoint to trigger the login process
app.post('/api/robot-login', async (req, res) => {
  try {
    const result = await attemptLogin();
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error in robot login:', error);
    res.status(500).json({ error: 'An error occurred during the robot login process' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Use POST /api/robot-login to attempt robot system login');
}); 