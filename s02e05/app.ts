import type { ChatCompletion, ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { OpenAIService } from './OpenAIService';
import { readFile, writeFile } from 'fs/promises';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import fs from 'fs';

import { join } from 'path';
import { extractImageContextSystemMessage, previewImageSystemMessage, refineDescriptionSystemMessage } from "./prompts";

const openaiService = new OpenAIService();

export type Image = {
    alt: string;
    url: string;
    context: string;
    description: string;
    preview: string;
    base64: string;
    name: string;
};

async function getHtml(url: string): Promise<string> {
    const response = await fetch(url);
    const html = await response.text();
    return html;
}

async function convertHtmlToMarkdown(html: string): Promise<string> {
    const markdownMessage: ChatCompletionMessageParam = {
        content: `Convert the following HTML to markdown. We will use your response as a markdown file so it must be valid markdown.
        <prompt_rules>
        - Return ONLY the markdown-formatted text, do not include any other text.
        - Do not include any other text than the markdown-formatted text.
        - Focus only on the <body> tag.
        - Keep all images and links.
        - Do not remove any images or links.
        - Do not remove any headers or subheaders.
        - Do not leave any html tags.
        - In that case return empty string.
        </prompt_rules>
        <html>${html}</html>`,
        role: 'user'
    };
    const response = await openaiService.completion([markdownMessage], 'gpt-4o', false) as ChatCompletion;
    const tokens = await openaiService.countTokens([markdownMessage], 'gpt-4o');
    console.log('tokens:', tokens);
    return response.choices[0].message.content || '';
}



async function fillResourcesLinks(markdown: string): Promise<string> {
    const fillLinksMessage: ChatCompletionMessageParam = {
        content: `Fill the resources links in the following markdown. We will use your response as a markdown file so it must be valid markdown. DO TO CHANGE ANYTHING ELSE THAN LINKS.
        <prompt_examples>
        i/rynek.png -> https://centrala.ag3nts.org/dane/i/rynek.png
        i/rynek_glitch.png -> https://centrala.ag3nts.org/dane/i/rynek_glitch.png
        i/rafal_dyktafon.mp3 -> https://centrala.ag3nts.org/dane/i/rafal_dyktafon.mp3
        </prompt_examples>
        <prompt_rules>
        - Return ONLY the markdown-formatted text, do not include any other text.
        - Do not include any other text than the markdown-formatted text.
        - Do not remove any images or links.
        - Do not remove any headers or subheaders.
        - Do not modify any text other than the links.
        - Do not add any new links.
        - Do not remove any existing links.
        </prompt_rules>
        <markdown>${markdown}</markdown>`,
        role: 'user'
    };
    const response = await openaiService.completion([fillLinksMessage], 'gpt-4o-mini', false) as ChatCompletion;
    return response.choices[0].message.content || '';
}

async function extractImages(article: string): Promise<Image[]> {
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const matches = [...article.matchAll(imageRegex)];

    const imagePromises = matches.map(async ([, alt, url]) => {
        try {
            const name = url.split('/').pop() || '';
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
            const arrayBuffer = await response.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');

            return {
                alt,
                url,
                context: '',
                description: '',
                preview: '',
                base64,
                name
            };
        } catch (error) {
            console.error(`Error processing image ${url}:`, error);
            return null;
        }
    });

    const results = await Promise.all(imagePromises);
    return results.filter((link): link is Image => link !== null);
}

async function previewImage(image: Image): Promise<{ name: string; preview: string }> {
    const userMessage: ChatCompletionMessageParam = {
        role: 'user',
        content: [
            {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${image.base64}` }
            },
            {
                type: "text",
                text: `Describe the image ${image.name} concisely. Focus on the main elements and overall composition. Return the result in JSON format with only 'name' and 'preview' properties.`
            }
        ]
    };

    const response = await openaiService.completion([previewImageSystemMessage, userMessage], 'gpt-4o', false, true) as ChatCompletion;
    const result = JSON.parse(response.choices[0].message.content || '{}');
    return { name: result.name || image.name, preview: result.preview || '' };
}

async function getImageContext(title: string, article: string, images: Image[]): Promise<{ images: Array<{ name: string, context: string, preview: string }> }> {
    const userMessage: ChatCompletionMessageParam = {
        role: 'user',
        content: `Title: ${title}\n\n${article}`
    };

    const response = await openaiService.completion([extractImageContextSystemMessage(images), userMessage], 'gpt-4o', false, true) as ChatCompletion;
    const result = JSON.parse(response.choices[0].message.content || '{}');

    // Generate previews for all images simultaneously
    const previewPromises = images.map(image => previewImage(image));
    const previews = await Promise.all(previewPromises);

    // Merge context and preview information
    const mergedResults = result.images.map((contextImage: { name: string, context: string }) => {
        const preview = previews.find(p => p.name === contextImage.name);
        return {
            ...contextImage,
            preview: preview ? preview.preview : ''
        };
    });

    return { images: mergedResults };
}

async function refineDescription(image: Image): Promise<Image> {
    const userMessage: ChatCompletionMessageParam = {
        role: 'user',
        content: [
            {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${image.base64}` }
            },
            {
                type: "text",
                text: `Napisz opis obrazu ${image.name}. Mam pewien <context>${image.context}</context>, który powinien być przydatny do lepszego zrozumienia obrazu. Wstępny podgląd obrazu to: <preview>${image.preview}</preview>. Dobry opis krótko przedstawia, co znajduje się na obrazie, i wykorzystuje kontekst, aby uczynić go bardziej istotnym dla artykułu. Celem tego opisu jest podsumowanie artykułu, więc potrzebujemy jedynie istoty obrazu z uwzględnieniem kontekstu, a nie szczegółowego opisu tego, co znajduje się na obrazie.`
            }
        ]
    };


    const response = await openaiService.completion([refineDescriptionSystemMessage, userMessage], 'gpt-4o-mini', false) as ChatCompletion;
    const result = response.choices[0].message.content || '';
    return { ...image, description: result };
}

async function fillDescriptions(markdown: string, captions: { url: string, description: string }[]): Promise<string> {
    let updatedMarkdown = markdown;
    for (const { url, description } of captions) {
        updatedMarkdown = updatedMarkdown.replace(url, description);
    }
    return updatedMarkdown;
}


// Ensure the API key is set in the environment variables
if (!process.env.GOOGLE_AI_STUDIO_API_KEY) {
  throw new Error("GOOGLE_AI_STUDIO_API_KEY is not set in environment variables");
}

const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
const fileManager = new GoogleAIFileManager(apiKey);
const genAI = new GoogleGenerativeAI(apiKey);

async function uploadMediaFile(filePath: string, mimeType: string, displayName: string) {
  const MAX_FILE_SIZE = 4 * 1024 * 1024; // 3MB in bytes
  
  const stats = fs.statSync(filePath);
  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds the 2MB limit. Current size: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
  }

  console.time('Upload File');
  const uploadResult = await fileManager.uploadFile(filePath, {
    mimeType,
    displayName,
  });
  console.timeEnd('Upload File');
  return uploadResult;
}

async function waitForProcessing(fileName: string) {
  console.time('Processing File');
  let file = await fileManager.getFile(fileName);
  
  // Continuously check the file state until processing is complete
  while (file.state === FileState.PROCESSING) {
    process.stdout.write(".");
    await new Promise((resolve) => setTimeout(resolve, 10_000)); // Wait for 10 seconds
    file = await fileManager.getFile(fileName);
  }
  
  console.timeEnd('Processing File');
  
  if (file.state === FileState.FAILED) {
    throw new Error("Media processing failed.");
  }

  return file;
}

async function generateContent(fileUri: string, mimeType: string): Promise<string> {
  console.time('Generate Content');
  
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = mimeType.startsWith("video") 
    ? "Analyze the content of this video." 
    : "Transcribe and summarize this audio. Write transcription and nothing else.";

  const result = await model.generateContent([
    prompt,
    {
      fileData: {
        fileUri: fileUri,
        mimeType: mimeType,
      },
    },
  ]);
  
  console.timeEnd('Generate Content');
  return result.response.text();
}

/**
 * Deletes the uploaded file from the Google AI service.
 * @param {string} fileName - The name of the file to delete.
 */
async function deleteUploadedFile(fileName: string) {
  console.time('Delete File');
  try {
    await fileManager.deleteFile(fileName);
    console.log(`Deleted uploaded file: ${fileName}`);
  } catch (error) {
    console.error(`Failed to delete file: ${fileName}`, error);
  }
  console.timeEnd('Delete File');
}

async function processMedia(filePath: string, mimeType: string, displayName: string) {
    // Upload the media file
    const uploadResult = await uploadMediaFile(filePath, mimeType, displayName);
    
    // Wait for the file to be processed
    const processedFile = await waitForProcessing(uploadResult.file.name);
    
    console.log(`Uploaded file ${uploadResult.file.displayName} as: ${uploadResult.file.uri}`);
    
    // Generate transcription and summary or analysis
    const content = await generateContent(processedFile.uri, processedFile.mimeType);
    console.log('content:', content);
    await writeFile(join(__dirname, 'content.txt'), content);
    // Delete the uploaded file after processing
    await deleteUploadedFile(uploadResult.file.name);
  }

async function generateFinalAnswers(markdown: string) {
    const finalMessage: ChatCompletionMessageParam = {
        content: `Na podstawie dostarczonego artykułu w <markdown> wygeneruj odpowiedzi na pytania.
        <questions>
        01=jakiego owocu użyto podczas pierwszej próby transmisji materii w czasie?
        02=Na rynku którego miasta wykonano testową fotografię użytą podczas testu przesyłania multimediów?
        03=Co Bomba chciał znaleźć w Grudziądzu?
        04=Resztki jakiego dania zostały pozostawione przez Rafała?
        05=Od czego pochodzą litery BNW w nazwie nowego modelu językowego?
        </questions>
        <prompt_result>
        {
        "01": "odpowiedź na pytanie 01",
        "02": "odpowiedź na pytanie 02",
        "03": "odpowiedź na pytanie 03",
        "04": "odpowiedź na pytanie 04",
        "05": "odpowiedź na pytanie 05"
        }
        </prompt_result>
        <prompt_rules>
        - zwróć odpowiedzi w zadanym formacie JSON
        - nie zawieraj żadnego innego tekstu niż odpowiedzi w JSON
        - nie zawieraj żadnych komentarzy ani innych informacji
        - nie zawieraj żadnych dodatkowych znaków ani znaków specjalnych
        - nie zawieraj żadnych dodatkowych sekcji ani nagłówków
        - nie zawieraj żadnych dodatkowych elementów ani struktur
        - nie zawieraj żadnych dodatkowych znaków ani znaków specjalnych
        </prompt_rules>
        <markdown>${markdown}</markdown>`,
        role: 'user'
    };
    const response = await openaiService.completion([finalMessage], 'gpt-4o-mini', false) as ChatCompletion;
    return response.choices[0].message.content || '';
}

async function generateAnswers(title: string, path: string) {
    // const articlePath = join(__dirname, 'article.md');
    // // const article = await getHtml('https://centrala.ag3nts.org/dane/arxiv-draft.html');
    // // const markdown = await convertHtmlToMarkdown(article);
    // const markdown = await readFile(articlePath, 'utf8');
    // // const filledLinksMarkdown = await fillResourcesLinks(markdown);
    // const images = await extractImages(markdown);
    // console.log('Number of images found:', images.length);
    // // const articleFile = await writeFile(articlePath, filledLinksMarkdown);
    // const contexts = await getImageContext(title, markdown, images);
    // console.log('Number of image metadata found:', contexts.images.length);

    // const processedImages = await Promise.all(images.map(async (image) => {
    //     const { context = '', preview = '' } = contexts.images.find(ctx => ctx.name === image.name) || {};
    //     return await refineDescription({ ...image, preview, context });
    // }));

    // const describedImages = processedImages.map(({ base64, ...rest }) => rest);
    // await writeFile(join(__dirname, 'descriptions.json'), JSON.stringify(describedImages, null, 2));

    // const captions = describedImages.map(({ url, description }) => ({ url, description }));
    // await writeFile(join(__dirname, 'captions.json'), JSON.stringify(captions, null, 2));
    // console.log('captions:', captions);
    // const filledLinksMarkdown = await readFile(articlePath, 'utf8');

    // const filledDescriptionsMarkdown = await fillDescriptions(filledLinksMarkdown, captions);
    // await writeFile(join(__dirname, 'filledDescriptions.md'), filledDescriptionsMarkdown);
    // console.log('finito');
      
    //   // Example usage
    //   const mediaFile = {
    //     path: join(__dirname, 'rafal_dyktafon.mp3'), // Change this to 'video.mp4' or 'audio.mp3'
    //     mimeType: 'audio/mp3', // Change this to 'video/mp4' or 'audio/mp3'
    //     displayName: 'Rafał dyktafon', // Change this accordingly
    //   };
      
    //   // Execute the media processing workflow and handle any errors
    //   await processMedia(mediaFile.path, mediaFile.mimeType, mediaFile.displayName).catch(console.error);
    // // console.log('article:', markdown);
    const markdown = await readFile(join(__dirname, 'filledDescriptions.md'), 'utf8');
    const answers = await generateFinalAnswers(markdown);
    console.log('answers:', answers);

}

generateAnswers('Podróże w czasie i przestrzeni w ujęciu praktycznym z elementami stabilizacji stanów pośrednich z wykorzystaniem dużych modeli językowych (LLM)', join(__dirname, 'article.md')).catch(error => console.error('Error in summary generation:', error));