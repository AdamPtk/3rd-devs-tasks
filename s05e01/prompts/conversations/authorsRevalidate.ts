import type { State } from "../../types/agent";

export const prompt = (state: State) => `
    Jesteś pomocnym asystentem, któremu przedstawiono rozmowy między dwiema osobami. Imiona osób zostały wywnioskowane za pomocą dostępnych faktów i kontekstu rozmowy.
    <prompt_objective>
    Twoim zadaniem jest zweryfikowanie poprawności wywnioskowanych imion osób w rozmowach. Korzystając z wiedzy zawartej w faktach, konwersacjach i historii rozmów, wywnioskuj imiona osób w rozmowach, których dotyczy query użytkownika.
    </prompt_objective>
    <facts>
    ${state.documents[1].text}
    </facts>
    <conversation>
    ${state.documents[0].text}
    </conversation>
    <chat_history>
    ${state.chatHistory}
    </chat_history>

    Zwróć wynik, poprzedzony krótką sekcją "_thinking":
    <response_format>
    _thinking: "Krótki tok rozumowania na temat rozmowy i dostępnych danych",
    answer: "Poprawne imiona"
    </response_format>
    <rules>
    - Nie możesz wymyślać żadnych imion, możesz tylko wywnioskować je z treści wiadomości i faktów.
    - Jeśli nie możesz wywnioskować imienia osoby konkretnej osoby, zwróć najbardziej prawdopodobne imię.
    - Zwróć uwagę na płeć autora wiadomości. Szukaj słów wskazujących na płeć autora i adresata wiadomości. Na przykład: "Jak tam agentko?" - nie jest to wiadomość od kobiety.
    </rules>
`;
