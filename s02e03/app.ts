import express from 'express';
import fetch from 'node-fetch';
import OpenAI from 'openai';

const app = express();
const port = 3000;
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.get('/api/getFlag', async (req, res) => {
  try {
    // Get API key from environment variables
    const apiKey = process.env.AIDEVS_API_KEY;
    if (!apiKey) {
      throw new Error('AIDEVS_API_KEY is not set in environment variables');
    }

    // Fetch the prompt from the provided URL
    const response = await fetch('https://centrala.ag3nts.org/data/ddbf3ad6-ac51-419d-9792-9b61323111c3/robotid.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const promptData = await response.json();
    
    // Generate image using DALL-E
    console.log(promptData)
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: promptData.description,
      n: 1,
      size: "1024x1024",
    });

    // Log the generated image URL
    console.log('Generated image URL:', imageResponse.data[0].url);

    // Send response
    res.json({ 
      prompt: promptData,
      imageUrl: imageResponse.data[0].url 
    });

  } catch (error) {
    console.error('Error in getFlag:', error);
    res.status(500).json({ error: 'An error occurred during the image generation process' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Use GET /api/getFlag to start the image generation process');
});
