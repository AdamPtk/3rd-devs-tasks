export const prompt = (facts: string, conversation: string[]) => `
    Jesteś pomocnym asystentem, któremu przedstawiono rozmowę między dwiema osobami. W każdej rozmowie uczestniczą tylko dwie osoby, które wypowiadają się naprzemiennie.
    Korzystając z wiedzy zawartej w faktach, wywnioskuj imiona osób w rozmowie:
    <facts>
    ${facts}
    </facts>
    <conversation>
    ${(conversation as string[]).join("\n")}
    </conversation>

    Zwróć wynik w formacie JSON, poprzedzony kluczem "_thinking":
    <response_format>
    {
        "_thinking": "Krótki tok rozumowania na temat rozmowy i dostępnych faktów",
        "answer": "Ta sama rozmowa z dodanymi imionami osób przed każdą wiadomością"
    }
    </response_format>
    <response_example>
    {
        "_thinking": "Samuel i Zygfryd rozmawiają przez telefon o kolejnym zadaniu. Zygfryd instruuje Samuela, by skontaktował się z Tomaszem z Centrali, który pomoże mu włamać się do komputera pewnego mężczyzny. Samuel potwierdza, że posiada już odpowiedni endpoint API i zamierza zadzwonić do Tomasza, by uzyskać hasło do pierwszej warstwy zabezpieczeń. Rozmowa kończy się poleceniem Zygfryda, by nie tracić czasu i działać natychmiast.",
        "answer": ["Zygfryd - Samuelu! helooo?! Słyszysz mnie teraz? Zadzwoniłem ponownie, bo chyba znowu z zasięgiem jest u Ciebie jakiś problem...",
        "Samuel - tak Zygfryd, słyszę Cię teraz dobrze. Przepraszam, gdy poprzednio dzwoniłeś, byłem w fabryce. Wiesz, w sektorze D, gdzie się produkuje broń i tutaj mają jakąś izolację na ścianach dodatkową. Telefon gubi zasięg. Masz jakieś nowe zadanie dla mnie?",
        "Zygfryd - tak. Mam dla Ciebie nowe zadanie. Skontaktuj się z Tomaszem. On pracuje w Centrali. Może pomóc Ci włamać się do komputera tego gościa. Masz już endpoint API?",
        "Samuel - tak, mam ten endpoint. https://rafal.ag3nts.org/510bc - Dzięki. Zadzwonię do Tomasza dopytać o resztę. Coś jeszcze?",
        "Zygfryd - Nie, to wszysto. No to weź teraz ten endpoint i użyj do połączenia. Tomasz powie Ci jakie jest hasło do pierwszej warstwy zabezpieczeń. OK. Nie marnuj czasu. Dzwoń!",
        "Samuel - OK. Dzwonię do Tomasza. [*dźwięk odkładanej słuchawki*]"]
    }
    </response_example>
    <rules>
    - NIE zmieniaj treści rozmowy.
    - Nie możesz wymyślać żadnych imion, możesz tylko wywnioskować je z treści wiadomości i faktów.
    - Jeśli nie możesz wywnioskować imienia osoby konkretnej osoby, zwróć najbardziej prawdopodobne imię.
    - Zwróć uwagę na to do kogo się odnosi osoba w wiadomości. Jeśli osoba zwraca się do drugiej osoby przez imię, to ta osoba nie może być autorem wiadomości. Na przykład: "Witaj Samuelu" - nie jest to wiadomość od Samuela.
    - Zwróć uwagę na płeć autora wiadomości. Szukaj słów wskazujących na płeć autora i adresata wiadomości. Na przykład: "Jak tam agentko?" - nie jest to wiadomość od kobiety.
    </rules>
`;
