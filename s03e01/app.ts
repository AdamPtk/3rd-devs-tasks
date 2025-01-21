import { join } from 'path';
import { readFile, writeFile, readdir } from 'fs/promises';
import type { ChatCompletion, ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { OpenAIService } from './OpenAIService';

async function generateMarkdownFromFacts(): Promise<string> {
  const factFiles = Array.from({ length: 9 }, (_, i) => `f${String(i + 1).padStart(2, '0')}.txt`);
  let markdownContent = '';

  for (let i = 0; i < factFiles.length; i++) {
    const filePath = join(__dirname, 'facts', factFiles[i]);
    const content = await readFile(filePath, 'utf-8');
    
    markdownContent += `# Fact${i + 1}\n\n${content}\n`;
  }

  return markdownContent;
}

async function generateKeywordsFromReports(): Promise<Record<string, string>> {
  const openAIService = new OpenAIService();
  const reportFiles = await readFile(join(__dirname, 'facts.md'), 'utf-8');
  const reportsDir = join(__dirname);
  
  // Get all .txt files from the root directory
  const files = (await readdir(reportsDir)).filter(file => 
    file.endsWith('.txt') && file.includes('report')
  );
  
  const keywordsByFile: Record<string, string> = {};
  
  for (const file of files) {
    const content = await readFile(join(reportsDir, file), 'utf-8');
    
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `Jesteś ekspertem w dziedzinie analizy danych i generowania słów kluczowych. Na podstawie kontekstu i raportu, generuj słowa kluczowe dotyczące zawartości raportu.
        <prompt_rules>
        - Podaj tylko słowa kluczowe oddzielone przecinkami, bez innego tekstu. Nie podawaj żadnych dodatkowych informacji.
        - Format: "lista, słów, kluczowych"
        - Nie podawaj żadnych dodatkowych informacji.
        - Jeśli znajdziesz coś wspólnego ze schwytaniem nauczyciela, to podaj słowa kluczowe dotyczące tego zdarzenia.
        </prompt_rules>
        `
      },
      {
        role: 'user',
        content: `Kontekst świata i postaci:\n${reportFiles}\n\nRaport do analizy:\n${content}\n\nPodaj tylko słowa kluczowe oddzielone przecinkami, bez innego tekstu. Nie podawaj żadnych dodatkowych informacji. Format: "lista, słów, kluczowych"`
      }
    ];

    const response = await openAIService.completion(messages, 'gpt-4o', false, false);
    const keywords = (response as ChatCompletion).choices[0].message.content || '';
    
    keywordsByFile[file] = keywords.trim();
    console.log(keywordsByFile);
  }

  return keywordsByFile;
}

async function main() {
  try {
    const markdownContent = await generateMarkdownFromFacts();
    await writeFile(join(__dirname, 'facts.md'), markdownContent);
    
    const keywordsByFile = await generateKeywordsFromReports();
    console.log('Keywords by file:', keywordsByFile);
    
    console.log('Process completed successfully.');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main();