import fs from 'fs/promises';
import path from 'path';
import TurndownService from 'turndown';
import { OpenAIService } from './OpenAIService';

interface Questions {
  [key: string]: string;
}

interface Answer {
  questionId: string;
  question: string;
  answer: string;
  source: string;
}

export class WebCrawlerService {
  private visitedUrls: Set<string> = new Set();
  private answers: Answer[] = [];
  private turndownService: TurndownService;
  private openAIService: OpenAIService;

  constructor() {
    this.turndownService = new TurndownService();
    this.openAIService = new OpenAIService();
  }

  private async fetchQuestions(key: string): Promise<Questions> {
    const response = await fetch(`https://centrala.ag3nts.org/data/${key}/softo.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch questions: ${response.status}`);
    }
    return response.json();
  }

  private async fetchAndSavePage(url: string): Promise<string> {
    if (this.visitedUrls.has(url)) {
      console.log('Already visited:', url);
      return '';
    }

    const urlObj = new URL(url);
    const fileName = urlObj.pathname === '/' ? 'index.md' : `${urlObj.pathname}.md`;
    const filePath = path.join(__dirname, 'pages', fileName);

    // Try to read existing file first
    try {
      const existingMarkdown = await fs.readFile(filePath, 'utf-8');
      console.log('Reading from cached file:', filePath);
      this.visitedUrls.add(url);
      return existingMarkdown;
    } catch (error) {
      // File doesn't exist, proceed with fetching
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status}`);
      }

      const html = await response.text();
      const markdown = this.turndownService.turndown(html);
      
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, markdown);
      
      this.visitedUrls.add(url);
      return markdown;
    }
  }

  private async extractLinks(markdown: string, baseUrl: string): Promise<string[]> {
    const response = await this.openAIService.completion({
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that can extract links from a given markdown text. You need to extract all URLs from the text. Return only an array of strings. Include only valid URLs that start with http:// or https:// or are relative paths.
            <example_response>
              ["link1", "link2", "link3"]
            </example_response>
            <example_response_no_links>
              []
            </example_response_no_links>

            There will be traps in the text. Some links will be in the form of a loop. For example:
            <example_links_loop>
                "https://softo.ag3nts.org/portfolio_1_c4ca4238a0b923820dcc509a6f75849b",
                "https://softo.ag3nts.org/portfolio_2_c81e728d9d4c2f636f067f89cc14862c",
                "https://softo.ag3nts.org/portfolio_3_eccbc87e4b5ce2fe28308fd9f2a7baf3",
                "https://softo.ag3nts.org/portfolio_4_a87ff679a2f3e71d9181a67b7542122c",
                "https://softo.ag3nts.org/portfolio_6_1679091c5a880faf6fb5e6087eb1b2dc"
            </example_links_loop>
            In this case you should return only links without the generated hash:
            <example_links_loop_without_hash>
                "https://softo.ag3nts.org/portfolio_1",
                "https://softo.ag3nts.org/portfolio_2",
                "https://softo.ag3nts.org/portfolio_3",
                "https://softo.ag3nts.org/portfolio_4",
                "https://softo.ag3nts.org/portfolio_6"
            </example_links_loop_without_hash>
          `
        },
        {
          role: "user",
          content: markdown
        }
      ]
    });

    if (!('choices' in response)) {
      throw new Error('Unexpected response format');
    }
    console.log('Response:', response.choices[0].message.content);

    const links = JSON.parse(response.choices[0].message.content || '[]') as string[];
    return links.map(link => {
      if (link.includes('loop')) return '/';
      if (link.includes('czescizamienne')) return '/';
      if (link.startsWith('http')) return link;
      return new URL(link, baseUrl).toString();
    });
  }

  private async findAnswers(markdown: string, questions: Questions, source: string): Promise<void> {
    const unansweredQuestions = Object.entries(questions)
      .filter(([id]) => !this.answers.some(a => a.questionId === id));

    if (unansweredQuestions.length === 0) return;

    const response = await this.openAIService.completion({
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that can find answers to questions in a given text. You will be given a list of questions and a text. You need to find the answers to the questions in the text. Return a JSON array of objects with questionId and answer fields. If no answer is found for the questions, return an empty array []. Return the answer in the same language as the question. Return only the answer, not the question. Return only answer for the question that you found. DO NOT RETURN ANY OTHER TEXT THAN THE JSON ARRAY. Like this:
            <example1>
              [
                {
                "questionId": "01",
                "answer": "Answer to question 01"
                }
              ]
            </example1>
            <example2>
              [
                {
                  "questionId": "02",
                  "answer": "Answer to question 02"
                }
              ]
            </example2>
            <example3>
              [
                {
                  "questionId": "01",
                  "answer": "Answer to question 01"
                },
                {
                  "questionId": "03",
                  "answer": "Answer to question 03"
                }
              ]
            </example3>
            <example4> (no answer found)
              []
            </example4>
          `
        },
        {
          role: "user",
          content: `
            Questions: ${JSON.stringify(unansweredQuestions)}
            Text: ${markdown}
            `
        }
      ]
    });

    if (!('choices' in response)) {
      throw new Error('Unexpected response format');
    }
    console.log('Response:', response.choices[0].message.content);

    const foundAnswers = JSON.parse(response.choices[0].message.content || '[]') as Array<{
      questionId: string;
      answer: string;
    }>;

    foundAnswers.forEach(({ questionId, answer }) => {
      this.answers.push({
        questionId,
        question: questions[questionId],
        answer,
        source
      });
    });
  }

  async crawl(key: string): Promise<Answer[]> {
    const questions = await this.fetchQuestions(key);
    console.log('Questions:', questions);
    const baseUrl = 'https://softo.ag3nts.org';
    const queue = [baseUrl];

    while (queue.length > 0 && Object.keys(questions).length > this.answers.length) {
      const url = queue.shift()!;
      console.log(`Crawling: ${url}`);

      try {
        const markdown = await this.fetchAndSavePage(url);
        console.log('markdown:', url);
        if (!markdown) continue;
        await this.findAnswers(markdown, questions, url);
        
        const links = await this.extractLinks(markdown, baseUrl);
        queue.push(...links.filter(link => 
          !queue.includes(link) &&
          link.startsWith(baseUrl) && 
          !this.visitedUrls.has(link)
        ));
        console.log('queue:', queue);
        console.log('visitedUrls:', this.visitedUrls);
        console.log('answers:', this.answers);
      } catch (error) {
        console.error(`Error processing ${url}:`, error);
      }
    }

    return this.answers;
  }
} 