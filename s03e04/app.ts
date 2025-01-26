import { OpenAIService } from "./OpenAIService";
import * as fs from 'fs/promises';

async function main() {
  try {
    const openAIService = new OpenAIService();
    
    // Wczytaj i przeanalizuj notatkę
    const noteContent = await fs.readFile('s03e04/barbara.txt', 'utf-8');
    
    // Użyj AI do wyodrębnienia osób i miejsc z notatki
    const extractionResponse = await openAIService.completion({
      messages: [{
        role: "system",
        content: "Wyodrębnij wszystkie imiona osób i nazwy miast z tekstu. TYLKO IMIONA, bez nazwisk. Zwróć je w formacie JSON: {\"people\": [\"imiona w mianowniku\"], \"cities\": [\"miasta bez polskich znaków\"]}"
      }, {
        role: "user",
        content: noteContent
      }],
      jsonMode: true
    });

    const extractedData = JSON.parse((extractionResponse as any).choices[0].message.content);
    console.log('extractedData', extractedData);
    
    // Zbiory do śledzenia już sprawdzonych elementów
    const checkedPeople = new Set<string>();
    const checkedCities = new Set<string>();
    
    // Kolejki do sprawdzenia
    const peopleToCheck = [...extractedData.people];
    const citiesToCheck = [...extractedData.cities];

    console.log('peopleToCheck', peopleToCheck);
    console.log('citiesToCheck', citiesToCheck);

    const API_KEY = process.env.AIDEVS_API_KEY || '';

    while (peopleToCheck.length > 0 || citiesToCheck.length > 0) {
      // Sprawdź osobę
      if (peopleToCheck.length > 0) {
        const person = peopleToCheck.shift()!;
        console.log('person', person);
        if (!checkedPeople.has(person) && person !== 'Barbara') {
          checkedPeople.add(person);
          
          const response = await fetch('https://centrala.ag3nts.org/people', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              apikey: API_KEY,
              query: person
            })
          });

          const data = await response.json();
          console.log('data', data.message);
          // Dodaj nowe miasta do sprawdzenia
          const cities = data.message.split(' ');
          cities.forEach((city: string) => {
            if (!checkedCities.has(city)) {
              citiesToCheck.push(city);
            }
          });
        }
      }

      // Sprawdź miasto
      if (citiesToCheck.length > 0) {
        const city = citiesToCheck.shift()!;
        console.log('city', city);
        if (!checkedCities.has(city)) {
          checkedCities.add(city);
          
          const response = await fetch('https://centrala.ag3nts.org/places', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              apikey: API_KEY,
              query: city
            })
          });

          const data = await response.json();
          console.log('data', data.message);
          
          // Sprawdź czy Barbara jest w tym mieście
          if (data.message.toUpperCase().includes('BARBARA') && city.toUpperCase() !== "KRAKOW") {
            console.log(`Znaleziono Barbarę w mieście: ${city}`);
            return;
          }

          // Dodaj nowe osoby do sprawdzenia
          const people = data.message.split(' ');
          people.forEach((person: string) => {
            if (!checkedPeople.has(person)) {
              peopleToCheck.push(person);
            }
          });
        }
      }
    }

    console.log('Nie udało się znaleźć Barbary');

  } catch (error) {
    console.error("Wystąpił błąd:", error);
  }
}

main().catch(console.error);