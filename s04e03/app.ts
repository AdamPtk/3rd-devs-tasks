import { WebCrawlerService } from './WebCrawlerService';

async function main() {
  try {
    const crawler = new WebCrawlerService();
    const key = process.env.AIDEVS_API_KEY;
    
    if (!key) {
      throw new Error('API_KEY environment variable is required');
    }

    const answers = await crawler.crawl(key);
    console.log('Found answers:', answers);
  } catch (error) {
    console.error("Wystąpił błąd:", error);
  }
}

main().catch(console.error);