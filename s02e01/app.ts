import express from 'express';
import { OpenAIService } from '../audio/OpenAIService';
import fs from 'fs/promises';
import path from 'path';

const app = express();
const port = 3000;
const openaiService = new OpenAIService();

app.use(express.json());

async function transcribeFiles() {
    try {
        // Get all m4a files in the current directory
        const files = await fs.readdir(__dirname);
        const m4aFiles = files.filter(file => file.endsWith('.m4a'));

        console.log('Found m4a files:', m4aFiles);

        // Store all transcriptions
        const transcriptions: { [key: string]: string } = {};

        // Transcribe each file
        for (const file of m4aFiles) {
            const filePath = path.join(__dirname, file);
            const fileBuffer = await fs.readFile(filePath);
            
            console.log(`Transcribing ${file}...`);
            const transcription = await openaiService.transcribeGroq(fileBuffer);
            transcriptions[file] = transcription;
            
            console.log(`Transcription for ${file}:`, transcription);
        }

        // Build a prompt from all transcriptions
        const prompt = buildPrompt(transcriptions);
        
        // Save transcriptions and prompt to a file
        await fs.writeFile(
            path.join(__dirname, 'transcriptions.json'), 
            JSON.stringify({ transcriptions, prompt }, null, 2)
        );

        console.log('All files transcribed successfully!');
        console.log('Generated prompt:', prompt);
        
        return { prompt };

    } catch (error) {
        console.error('Error during transcription:', error);
        throw error;
    }
}

function buildPrompt(transcriptions: { [key: string]: string }): string {
    // Sort files by name to maintain order
    const sortedFiles = Object.keys(transcriptions).sort();
    
    // Build prompt combining all transcriptions
    let prompt = 'Oto transkrybcje nagrań z przesłuchań świadków oskarżonych o kontakty z profesorem Majem. Zeznania mogą się wzajemnie wykluczać lub uzupełniać. Warunkowo dopuszczamy do analizy nagranie Rafała, ponieważ to jedyna osoba utrzymywała bliskie kontakty z profesorem. Podaj proszę nazwę ulicy, na której znajduje się uczelnia (konkretny instytut!), gdzie wykłada profesor.:\n\n';
    
    sortedFiles.forEach((file, index) => {
        const name = file.replace('.m4a', ''); // Remove the .m4a extension
        prompt += `${name}:\n${transcriptions[file]}\n\n`;
    });
    
    prompt += 'Przeprowadź analizę tych transkrypcji i podajnazwę ulicy, na której znajduje się uczelnia (konkretny instytut!), gdzie wykłada profesor.';
    
    return prompt;
}

// Endpoint to trigger transcription
app.post('/api/transcribe-all', async (req, res) => {
    try {
        const result = await transcribeFiles();
        res.json(result);
    } catch (error) {
        console.error('Error in transcribe-all endpoint:', error);
        res.status(500).json({ error: 'Failed to transcribe files' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Use POST /api/transcribe-all to start transcription');
});
