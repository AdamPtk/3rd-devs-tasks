![](https://cloud.overment.com/S04E03-1732688063.png)

Mamy już kilka gotowych elementów, które umożliwiają łączenie LLM z zewnętrznymi danymi w postaci plików przekazanych jako adresy URL lub ścieżki do plików zapisanych na dysku. Poza tym, omawialiśmy także przykład `websearch`, który pozwolił nam na proste połączenie modelu z Internetem.

Rzecz w tym, że źródła danych mogą mieć także inny charakter. Przykładem są informacje z otoczenia (lokalizacja, uruchomione aplikacje na telefonie, aktualna pogoda czy obecnie odtwarzana muzyka). Część z nich może być pobierana w czasie rzeczywistym, a inne będą aktualizowane cyklicznie i wczytywane tylko w razie potrzeby. Mówimy więc tutaj o sytuacji w których dane nie pochodzą od użytkownika, lecz są pobierane programistycznie, a nasz system ma prawo je wczytać w razie potrzeby.

Ostatnim przykładem danych są także te dostarczane przez użytkownika bądź innych agentów AI **w trakcie interakcji**. Chociażby podczas dłuższej rozmowy, wskazane jest budowanie kontekstu konwersacji, który nie jest w całości dostarczany do systemowego promptu.

W tym wszystkim brakuje jeszcze możliwości **tworzenia treści** oraz **zapisywania plików**. Tutaj także kilka przykładów widzieliśmy już w poprzednich tygodniach AI_devs, ale teraz połączymy je ze sobą w formę narzędzi, którymi będzie posługiwać się model.
## Przegląd logiki

W tej lekcji będziemy omawiać przykład `web`, który łączy ze sobą logikę przykładów takich jak `loader`, `summary`, `translate`, `websearch`, `hybrid` i innych. Tym razem jednak, odpowiedzialność za sposób posługiwania się narzędziami, w dużym stopniu przejdzie w ręce modelu, aczkolwiek dostępna logika nadal będzie miała dość liniowy charakter i nie daje zbyt wiele przestrzeni na 'kreatywność modelu'.

Poniżej widzimy wymianę wiadomości, w której poprosiłem o pobranie treści z trzech plików PDF zawierających faktury, wczytanie wskazanych informacji oraz przekazanie mi rezultatu w formie linku do pliku .csv. 

![](https://cloud.overment.com/2024-10-19/aidevs3_write-5b937898-4.png)

Nietrudno się domyślić, że takie polecenia można przesyłać automatycznie, np. z odnośnikami do załączników maili oznaczonych wybraną etykietą. Źródłem danych mogłyby być także zdjęcia z naszego telefonu czy pliki wgrane na Dropbox. 

Na tym jednak nie koniec, ponieważ różne kombinacje doboru narzędzi pozwalają na przesłanie **długiego pliku** z prośbą o przetłumaczenie z zachowaniem pełnego formatowania. Jak widać, tłumaczenie zostało przeprowadzone poprawnie, pomimo przekroczenia limitu "output tokens". 

![](https://cloud.overment.com/2024-10-19/aidevs3_translate-11e5ed9d-1.png)

No i ostatecznie mamy także możliwość pobierania wybranych treści stron www, co również może być wykonywane przez skrypty i automatyzacje działające dla nas w tle.

![](https://cloud.overment.com/2024-10-19/aidevs3_extract-5cb567e1-b.png)

Logika przykładu polega więc na tym, aby:

- Zrozumieć zapytanie użytkownika i ułożyć na jego podstawie plan
- Wykonać poszczególne kroki, z możliwością przekazywania kontekstu pomiędzy nimi. Zatem jeśli pierwszym krokiem jest 'przeglądanie Internetu', to jego rezultat będzie dostępny w dalszych etapach
- Wśród dostępnych akcji znajduje się także opcja wgrania pliku na serwer i wygenerowania dla niego bezpośredniego linku
- Po wykonaniu wszystkich kroków, model generuje ostateczną odpowiedź.

Całość nie jest jednak gotowa na każdy z możliwych scenariuszy i w założeniu ma działać dla powtarzalnych zadań takich jak wspomniane przetwarzanie dokumentów czy cykliczne pobieranie informacji z Internetu. 

**WAŻNE:** Logika przykładu `web` potrafi obsługiwać następujące sytuacje: 

- Wczytaj `link_do_pliku` i przetłumacz z polskiego na angielski i podrzuć mi link do gotowego dokumentu
- Pobierz wpisy na temat AI z `https://news.ycombinator.com/newest`
- Podsumuj ten dokument: `link`
- Wejdź na `blog` i pobierz artykuły z dziś (o ile jakieś są)
- Wejdź na `blog`, pobierz artykuły z dziś (o ile jakieś są) i je dla mnie podsumuj

Mówimy więc tutaj o prostych wiadomościach, które mogą uwzględniać przetwarzanie kilku źródeł oraz przekazywanie informacji pomiędzy etapami.
## Upload i tworzenie plików

Modele językowe nie mają większych problemów z generowaniem treści dla dokumentów tekstowych. Markdown, JSON czy CSV mogą być także programistycznie przekonwertowane na formaty binarne, takie jak PDF, docx czy xlsx. Natomiast samo umieszczenie pliku na dysku, a także wygenerowanie linku do niego, musi mieć formę narzędzia. 

W praktyce będziemy potrzebowali dwóch sposobów tworzenia plików. Jeden będzie dostępny dla użytkownika, a drugi dla LLM. Z tego powodu, w przykładzie `web` utworzyłem endpoint `/api/upload`. Co prawda nie będziemy z niego teraz korzystać, ale warto zwrócić w nim uwagę na kilka rzeczy: 

- Plik jest **wczytywany jako dokument** i zapisywany w bazie danych
- Do metadanych pliku dołączany jest identyfikator konwersacji
- W odpowiedzi zwracane są informacje na temat pliku, łącznie z adresem URL, którym może posługiwać się LLM. 

![](https://cloud.overment.com/2024-10-19/aidevs3_uploader-b91aac07-b.png)

**Ważne:** w przypadku produkcyjnych implementacji takich rozwiązań, należy upewnić się, że: 

- Sprawdzamy `mimeType` wgrywanego pliku i odrzucamy te, które nie są zgodne z wspieranymi formatami
- Poza typem pliku, powinniśmy sprawdzić także jego rozmiar
- Link kierujący do pliku powinien wymagać uwierzytelnienia, np. klucza API bądź aktywnej sesji użytkownika

Taki endpoint pozwala nam na przesyłanie plików do aplikacji i wykorzystywanie ich później w trakcie konwersacji na podstawie `conversation_uuid`. 

Tworzenie pliku z pomocą LLM jest bardziej złożone, ponieważ musimy uwzględnić także **napisanie treści**. W przypadku przykładu `web`, model może zapisywać pliki, których zawartość jest wpisana przez niego "ręcznie". Może się jednak zdarzyć, że zapisanym plikiem będzie musiało być **wcześniej wygenerowane tłumaczenie**. W takim przypadku chcemy **uniknąć ponownego przepisywania dokumentu**, zwłaszcza że ze względu na limit okna tokenów wyjściowych (output tokens) możemy nie mieć takiej możliwości. Stosuję więc w nim znany już 'trick' z `[[uuid]]`, wskazujący na dokumenty znajdujące się w kontekście, które podmieniane są na właściwą treść.

![](https://cloud.overment.com/2024-10-19/aidevs3_llm_write-86f0a271-c.png)

Dokładnie ta sama możliwość funkcjonuje w odpowiedziach przesyłanych użytkownikowi. Na obrazku poniżej widzimy fragment promptu systemowego, który zawiera sekcję `documents`, a w niej wpis z treścią wcześniejszej wypowiedzi w postaci listy narzędzi. 

![](https://cloud.overment.com/2024-10-19/aidevs3_prompt_context-86562534-a.png)

Po stronie front-endu widzimy **dokładnie tę samą treść**, która w oryginale brzmiała: "Here is the extracted list of hardware\n\n`[[ff7a079b-6299-4833-bf75-5e2c6fe57fba]]`", natomiast placeholder został programistycznie podmieniony na wczytany wcześniej dokument.

![](https://cloud.overment.com/2024-10-19/aidevs3_response-e4ab440b-c.png)

Zatem tworzenie plików w przypadku LLM polega tutaj wyłącznie na wygenerowaniu nazwy oraz wskazania identyfikatorów, które mają zostać wczytane jako treść. Opcjonalnie model ma prawo uwzględnić dodatkowe formatowanie tej treści i własne komentarze. 
## Planowanie

Posługiwanie się narzędziami przez LLM stanowi połączenie dwóch elementów: programistycznego interfejsu oraz promptów. Sama logika może mieć charakter bardziej liniowy, który do tej pory już wiele razy widzieliśmy, albo charakter agencyjny, zdolny do wychodzenia poza ustalony schemat i rozwiązywania problemów z kategorii "open-ended". 

Tym razem interesuje nas ten "środkowy" scenariusz, w którym model wyposażony w serię narzędzi ma możliwość korzystania z nich w dowolnej kolejności oraz ilości kroków. Nie może jednak zmienić raz ustalonego planu oraz wracać do wcześniejszych etapów. Poza tym sam system nie jest odporny na 'nieprzewidziane' scenariusze, więc polecenia użytkownika powinny być precyzyjne. Z tego powodu nie sprawdzi się on nam w takiej formie produkcyjnie, ale może pracować 'w tle' i zapisywać efekty swojej pracy w bazie danych lub przesyłać je na maila.

![](https://cloud.overment.com/2024-10-19/aidevs3_plan-d93f5cb9-2.png)

Takie ograniczenie rodzi naturalny problem **ograniczonej wiedzy początkowej**. Nie możemy zatem od razu wygenerować wszystkich parametrów potrzebnych do uruchomienia niezbędnych narzędzi. W zamian możemy ustalić listę kroków oraz zapisać przy nich notatki lub zapytania, które mają charakter poleceń, jakie model generuje 'samemu sobie'. Jedynym warunkiem jest tutaj zachowanie kolejności działań.

Z lekcji S04E01 — Interfejs wiemy, że narzędzia muszą mieć unikatowe nazwy oraz instrukcję obsługi. Teraz przekonujemy się, że nie zawsze będzie to oczywiste, ponieważ mogą mieć różną złożoność i podkategorie. Na przykład `file_process`, odpowiedzialne za przetwarzanie dokumentów, ma obecnie 5 różnych typów. Ich opisy nie są potrzebne na początkowym etapie planowania, lecz dopiero w chwili, gdy dany typ zostanie wybrany.

![](https://cloud.overment.com/2024-10-19/aidevs3_process-3991492e-8.png)

Do czasu gdy LLM nie będą dysponowały większą zdolnością do zachowania uwagi (być może dzięki [Differential Transformer](https://www.microsoft.com/en-us/research/publication/differential-transformer/)), proces planowania i podejmowania działań musi być podzielony na małe, wyspecjalizowane prompty. Trudność polega tylko na tym, aby na danym etapie dostarczyć wszystkie dane potrzebne do podjęcia dalszych działań, bez dodawania zbędnego 'szumu'. 
## Podstawy kontekstu konwersacji

Przykład `web` zapisuje wszystkie treści w bazie danych, w formie dokumentów, które omawialiśmy w lekcji S03E01. Każdy z wpisów łączony jest z bieżącą konwersacją oraz opcjonalnie może być dodany do silników wyszukiwania. Pozwala nam to nie tylko na późniejsze wykorzystanie tych dokumentów jako kontekst, ale także umożliwia elastyczne posługiwanie się nimi w ramach bieżącej interakcji. 

Poniżej widzimy jeden z takich rekordów, którego główna treść to jedynie cena produktu wczytana z faktury. Natomiast w metadanych znajduje się informacja nadająca **kontekst** mówiący o tym, czym dokładnie są te liczby i skąd pochodzą.

![](https://cloud.overment.com/2024-10-20/aidevs3_entry-b129fc9d-4.png)

Informacje zapisane w ten sposób mogą zostać w każdej chwili przywołane do kontekstu promptu systemowego wraz z informacją o tym skąd pochodzą oraz gdzie możemy się dowiedzieć więcej na ich temat. 

Dokładnie w ten sposób będziemy zapisywać dane pochodzące z zewnętrznych źródeł, a następnie wczytywać je do konwersacji w formie "stanu", czyli obiektu stanowiącego "pamięć krótkoterminową" modelu. W przypadku jednego z moich projektów, stan uwzględnia:

- **kontekst** (dostępne umiejętności, informacje z otoczenia, listę podjętych akcji, wczytanych dokumentów, podsumowania rozmowy, omawiane słowa kluczowe czy wczytane wspomnienia), 
- **informacje związane z rozumowaniem** (aktualny status, dostępne kroki, aktualny plan działań, refleksja na jego temat oraz aktywne narzędzie)
- **informacje na temat konwersacji**: identyfikator interakcji (na potrzeby LangFuse), identyfikator rozmowy, listę wiadomości oraz związane z nią ustawienia

![](https://cloud.overment.com/2024-10-20/aidevs3_state-77f3cc55-2.png)

Inaczej mówiąc, myśląc o kontekście konwersacji, będziemy mieć na myśli połączenie trzech rzeczy: **wiedzy z bieżącej interakcji**, **wiedzy z pamięci długoterminowej** oraz **zmienne kontrolujące logikę po stronie programistycznej**. 

Kontekst konwersacji stanowi kluczowy element systemów agencyjnych, ponieważ pozwala na wykonywanie bardziej złożonych zadań. Nawet nasz przykład `web` pomimo ograniczeń wynikających z jego założeń, jest w stanie posługiwać się prostym kontekstem pozwalającym na przekazywanie informacji pomiędzy poszczególnymi etapami.

Poniżej widzimy, że użytkownik nie dostarczył treści artykułu w postaci adresu URL, lecz jedynie wskazał miejsce z którego ma zostać ona pobrana.

![](https://cloud.overment.com/2024-10-20/aidevs3_conversation_context-1f3effde-8.png)

Asystent poprawnie rozłożył to zadanie na mniejsze kroki i poprawnie posługiwał się dostępnym kontekstem, przekazując go między etapami. 

![](https://cloud.overment.com/2024-10-20/aidevs3_list_of_actions-1c008d6a-2.png)

## Podsumowanie

Logika przeglądania stron www w przykładzie `web` opiera się o **wygenerowanie listy zapytań do wyszukiwarki** oraz **decyzji o tym, których stron zawartość należy pobrać**. Ewentualnie proces ten może być skrócony do jedynie pobrania treści wskazanego adresu URL. 

Istnieją jednak narzędzia takie jak Code Interpreter (np. e2b), [BrowserBase](https://www.browserbase.com/) czy zapewne znany Ci [Playwright](https://playwright.dev/) lub [Puppeteer](https://pptr.dev/). Konkretnie mówimy tutaj o automatyzacji polegającej na uruchamianiu generowanego kodu, a także połączeniu możliwości rozumienia tekstu i obrazu na potrzeby podejmowania dynamicznych działań.

Choć w sieci pojawiają się przykłady pokazujące możliwości autonomicznego research'u i przeglądania Internetu w celu gromadzenia informacji, **trudno obecnie mówić o wysokiej skuteczności bez narzucenia ograniczeń.** Nawet sam web scraping nie pozwala na swobodne przeglądanie dowolnych stron i powinien być skonfigurowany pod dostęp do wybranych adresów lub opierać się o zewnętrzne rozwiązania takie jak [apify](https://apify.com/). 

Przykład `web` pokazuje nam, że LLM wyposażony w narzędzia oraz mechanikę budowania i posługiwania się kontekstem, może wykonywać samodzielnie złożone zadania bez udziału człowieka. Jednak warunkiem koniecznym (przynajmniej na ten moment) jest precyzyjne określenie tego, co jest dla modelu dostępne, a co nie. W przeciwnym razie szybko pojawiają się problemy albo dotyczące możliwości samego modelu, albo barier wynikających z samej technologii (np. konieczności logowania na stronie www).