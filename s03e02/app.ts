import { OpenAIService } from "./OpenAIService";
import { TextSplitter } from "./TextService";
import { VectorService } from './VectorService';
import type { ChatCompletion } from "openai/resources/chat/completions";
import * as fs from 'fs/promises';
import * as path from 'path';

type Report = {
    date: string;
    report: string;
}

const reports: Report[] = [];

const query = 'W raporcie, z którego dnia znajduje się wzmianka o kradzieży prototypu broni?';

const COLLECTION_NAME = "weapons";

const openai = new OpenAIService();
const vectorService = new VectorService(openai);
const textSplitter = new TextSplitter();

async function initializeData() {
    const points = await Promise.all(reports.map(async ({ date, report }) => {
        const doc = await textSplitter.document(report, 'gpt-4o', { date });
        return doc;
    }));

    await vectorService.initializeCollectionWithData(COLLECTION_NAME, points);
}

async function loadReportsFromFiles() {
    const reportsDir = path.join(__dirname, 'reports');
    const files = await fs.readdir(reportsDir);
    
    for (const file of files) {
        if (file.endsWith('.txt')) {
            const date = file.replace('.txt', '').replace('_', '-');
            const filePath = path.join(reportsDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            reports.push({
                date,
                report: content
            });
        }
    }
}

async function main() {
    await loadReportsFromFiles();
    await initializeData();

    const searchResults = await vectorService.performSearch(COLLECTION_NAME, query, 15);

    const relevanceChecks = await Promise.all(searchResults.map(async (result) => {
        const relevanceCheck = await openai.completion({
            messages: [
                { role: 'system', content: 'You are a helpful assistant that determines if a given text is relevant to a query. Respond with 1 if relevant, 0 if not relevant.' },
                { role: 'user', content: `Query: ${query}\nText: ${result.payload?.text}` }
            ]
        }) as ChatCompletion;
        const isRelevant = relevanceCheck.choices[0].message.content === '1';
        return { ...result, isRelevant };
    }));

    const relevantResults = relevanceChecks.filter(result => result.isRelevant);

    console.log(`Query: ${query}`);
    console.table(relevantResults.map((result, index) => ({
        'Date': result.payload?.date || '',
        'Text': result.payload?.text?.slice(0, 45) + '...' || '',
        'Score': result.score
    })));
}

main().catch(console.error);