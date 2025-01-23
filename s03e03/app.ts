import { OpenAIService } from "./OpenAIService";
import type { ChatCompletion, ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { DatabaseResponse, TableStructure } from "./types";

const openai = new OpenAIService();
const API_URL = 'https://centrala.ag3nts.org/apidb';
const API_KEY = process.env.AIDEVS_API_KEY || '';

async function fetchFromDatabase(query: string): Promise<DatabaseResponse> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      task: 'database',
      apikey: API_KEY,
      query
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}



async function getTableStructure(tableName: string): Promise<string> {
  const response = await fetchFromDatabase(`show create table ${tableName}`);
  console.log(response);
  return response.reply[0] || '';
}

async function main() {
  try {
    // 1. Pobierz strukturę potrzebnych tabel
    const tables = ['users', 'datacenters', 'connections'];
    const tableStructures: TableStructure[] = [];
    
    for (const table of tables) {
      const structure = await getTableStructure(table);
      tableStructures.push({ table, structure });
    }
    console.log(tableStructures);

    // 2. Przygotuj prompt dla LLM
    const messages = [
      {
        role: "system",
        content: "Jesteś ekspertem SQL. Na podstawie struktury tabel, przygotuj zapytanie SQL, które zwróci ID aktywnych datacenter zarządzanych przez nieaktywnych managerów. Nie używaj aliasów."
      },
      {
        role: "user",
        content: `Struktury tabel:
          ${tableStructures.map(t => `${t.table}:\n${t.structure}`).join('\n\n')}
          
          Zadanie: Napisz zapytanie SQL, które zwróci dc_id aktywnych datacenter (is_active=1), 
          które są zarządzane przez pracowników oznaczonych jako nieaktywni (is_active=0).`
      }
    ];

    // 3. Otrzymaj zapytanie SQL od LLM
    const completion = await openai.completion({
      messages: messages as ChatCompletionMessageParam[],
      model: "gpt-4o",
    }) as ChatCompletion;

    const sqlQuery = completion.choices[0].message.content || '';
    console.log("Wygenerowane zapytanie SQL:", sqlQuery);

    // 4. Wykonaj zapytanie
    const result = await fetchFromDatabase(sqlQuery);
    console.log("Wynik zapytania:", result.reply);

  } catch (error) {
    console.error("Wystąpił błąd:", error);
  }
}

main().catch(console.error);