import { join } from "path";
import { FileService } from "./FileService";
import { OpenAIService } from "./OpenAIService";
import type OpenAI from "openai";
const main = async () => {
  const fileService = new FileService();
  const openaiService = new OpenAIService();
  
//   const files = await fileService.takeScreenshot(
//     join(__dirname, "assets", "notatnik-rafala.pdf"),
//     "notatnik-rafala.pdf"
//   );
//   console.log(files);

// const files = [
//     "/home/adamptk/projects/3rd-devs-tasks/s04e05/storage/image/2025-02-21/56b770e7-5932-432f-9f90-0d7b9c219707/notatnik-rafala_1.jpg",
//     "/home/adamptk/projects/3rd-devs-tasks/s04e05/storage/image/2025-02-21/56b770e7-5932-432f-9f90-0d7b9c219707/notatnik-rafala_2.jpg",
//     "/home/adamptk/projects/3rd-devs-tasks/s04e05/storage/image/2025-02-21/56b770e7-5932-432f-9f90-0d7b9c219707/notatnik-rafala_3.jpg",
//     "/home/adamptk/projects/3rd-devs-tasks/s04e05/storage/image/2025-02-21/56b770e7-5932-432f-9f90-0d7b9c219707/notatnik-rafala_4.jpg",
//     "/home/adamptk/projects/3rd-devs-tasks/s04e05/storage/image/2025-02-21/56b770e7-5932-432f-9f90-0d7b9c219707/notatnik-rafala_5.jpg",
//     "/home/adamptk/projects/3rd-devs-tasks/s04e05/storage/image/2025-02-21/56b770e7-5932-432f-9f90-0d7b9c219707/notatnik-rafala_6.jpg",
//     "/home/adamptk/projects/3rd-devs-tasks/s04e05/storage/image/2025-02-21/56b770e7-5932-432f-9f90-0d7b9c219707/notatnik-rafala_7.jpg",
//     "/home/adamptk/projects/3rd-devs-tasks/s04e05/storage/image/2025-02-21/56b770e7-5932-432f-9f90-0d7b9c219707/notatnik-rafala_8.jpg",
//     "/home/adamptk/projects/3rd-devs-tasks/s04e05/storage/image/2025-02-21/56b770e7-5932-432f-9f90-0d7b9c219707/notatnik-rafala_9.jpg",
//     "/home/adamptk/projects/3rd-devs-tasks/s04e05/storage/image/2025-02-21/56b770e7-5932-432f-9f90-0d7b9c219707/notatnik-rafala_10.jpg",
//     "/home/adamptk/projects/3rd-devs-tasks/s04e05/storage/image/2025-02-21/56b770e7-5932-432f-9f90-0d7b9c219707/notatnik-rafala_11.jpg",
//     "/home/adamptk/projects/3rd-devs-tasks/s04e05/storage/image/2025-02-21/56b770e7-5932-432f-9f90-0d7b9c219707/notatnik-rafala_12.jpg",
//     "/home/adamptk/projects/3rd-devs-tasks/s04e05/storage/image/2025-02-21/56b770e7-5932-432f-9f90-0d7b9c219707/notatnik-rafala_13.jpg",
//     "/home/adamptk/projects/3rd-devs-tasks/s04e05/storage/image/2025-02-21/56b770e7-5932-432f-9f90-0d7b9c219707/notatnik-rafala_14.jpg",
//     "/home/adamptk/projects/3rd-devs-tasks/s04e05/storage/image/2025-02-21/56b770e7-5932-432f-9f90-0d7b9c219707/notatnik-rafala_15.jpg",
//     "/home/adamptk/projects/3rd-devs-tasks/s04e05/storage/image/2025-02-21/56b770e7-5932-432f-9f90-0d7b9c219707/notatnik-rafala_16.jpg",
//     "/home/adamptk/projects/3rd-devs-tasks/s04e05/storage/image/2025-02-21/56b770e7-5932-432f-9f90-0d7b9c219707/notatnik-rafala_17.jpg",
//     "/home/adamptk/projects/3rd-devs-tasks/s04e05/storage/image/2025-02-21/56b770e7-5932-432f-9f90-0d7b9c219707/notatnik-rafala_18.jpg",
//     "/home/adamptk/projects/3rd-devs-tasks/s04e05/storage/image/2025-02-21/56b770e7-5932-432f-9f90-0d7b9c219707/notatnik-rafala_19.jpg"
//   ]
  
//   const descriptions = await openaiService.processImages(files);

//   const template = descriptions
//     .map((desc, index) => `Page${index + 1}:\n${desc.description}`)
//     .join('\n\n');

//   console.log(template);

  const template = `Page1:
To jest notatka napisana na kartce papieru w linię, z widoczną plamą na dole. Tekst jest w języku polskim i brzmi:

"Nie powinienem był tego robić. Obsługa skomplikowanego sprzętu, niekoniecznie będąc trzeźwym, to nie był dobry pomysł. I ta pizza w ręce. Źle się czuję. Nie wiem, jak bardzo będę tego żałował. Może po prostu prześpię się i wszystko wróci do normy.

Z jednej strony wiedziałem, czego się spodziewać i wiedziałem, że ta maszyna może przenosić w czasie, a z drugiej strony do dziś dnia nie mogę uwierzyć, że jestem w roku. To niewiarygodne!"

Page2:
Na screenie widnieje tekst napisany odręcznym pismem na kartce z liniami. Treść tekstu jest następująca:

"Jestem normalny. To wszystko dzieje się naprawdę. Jestem normalny. To jest rzeczywistość. Jestem normalny. Wiem, gdzie jestem i kim jestem. Jestem normalny. To wszystko w koło. To jest normalne. Jestem normalny. Mam na imię Rafał. Jestem normalny. Świat jest nienormalny."

Pod tekstem znajduje się niewielka czerwona plama.

Page3:
Na zrzucie ekranu znajdują się odręczne, czarne litery na tle kartki papieru w linie. Tekst brzmi:

"Spotkałem Azazela, a przynajmniej tak się przedstawił ten człowiek. Twierdzi, że jest z przyszłości. Opowiadał mi o dziwnych rzeczach. Nie wierzę mu. Nikt przede mną nie cofnął się w czasie!

Ale on wiedział o wszystkim, nad czym pracowałem z profesorem Majem. Dałem mu badania, które zabrałem z laboratorium."

Tekst sugeruje spotkanie z tajemniczą osobą podającą się za podróżnika w czasie.

Page4:
Na przedstawionym zrzucie ekranu widnieje tekst napisany odręcznie na kartce w linię:

"Dlaczego Adam wybrał akurat ten rok? Według jego wyliczeń, wtedy powinniśmy rozpoczac pracę nad technologią LLM, aby wszystko wydarzyło się zgodnie z planem. Mówił, że najpierw musi powstać GPT-2, a potem GPT-3, które zachwycą ludzkość. Później będzie z górki. On wie, co robi.

Co z badaniami zrobił Azazel?"

Tekst ma charakter refleksyjny i tajemniczy. Na dole znajduje się czerwony, zakrzywiony element, przypominający odręczny rysunek lub podkreślenie.

Page5:
Na zrzucie ekranu znajduje się tekst na tle kartki w linie. Tekst brzmi:

"No i powstało GPT-2. Słyszałem w wiadomościach, a to wszystko dzięki badaniom, które dostarczyłem. Wszystko dzieje się tak szybko!

Czy ja właśnie piszę nową historię? TAK! Zmieniam świat i widzę efekty tych zmian.

JESTEM Z TEGO DUMNY!" 

Fragmenty "GPT-2", "TAK!" i "JESTEM Z TEGO DUMNY!" są wyróżnione.

Page6:
Na screenie znajduje się tekst napisany odręcznym stylem na kartce z liniami. Tekst brzmi:

"W idealnym momencie zjawiłem się w Grudziądzu. Wszystko zadziało się jak w szwajcarskim zegarku. Perfekcyjnie!

Tylko dlaczego akurat Grudziądz? To nie ma większego sensu. Może ONI wybrali to miejsce losowo? Nie ma tutaj drugiego dna?

Tylko kto jest mózgiem tej misji? Adam, czy Azazel?"

Page7:
Na obrazku znajduje się rysunek postaci o potarganych włosach i wyrazistej twarzy. Tekst po prawej stronie obrazu brzmi: "WRÓCĘ?" z pytajnikiem w kolorze czerwonym. Na dole, po prawej, widnieje podpis "RAV" również w kolorze czerwonym. Tło przypomina kartkę z zeszytu z niebieskimi liniami i czerwoną marginesem.

Page8:
Czekają mnie dwa lata bardzo intensywnej nauki. Adam mówi, że tyle potrzebuje na wchłonięcie szkolenia, które przygotował. Ponoć w przyszłości, dzięki modelom językowym, ludzie będą w stanie to zrozumieć w nieco ponad pięć tygodni. Nie chce mi się w to wierzyć.

Ja póki co uczę się obsługi modeli językowych, aby móc pomóc profesorowi.

Page9:
Na zrzucie ekranu widnieje tekst napisany na tle przypominającym kartkę z zeszytu z liniami. Są na niej brązowe i czerwone plamy, przypominające rozchlapane napoje lub farby.

Tekst na obrazie:

"Co ja zrobiłem?

bo jeden był dobry. ale nie ten co go wybrałem? może ja nie ratuję wcale świata?

po której stronie jestem?"

Page10:
Na przedstawionym screenie widać tekst oraz ilustrację. Grafika przedstawia rysunek zaskoczonego mężczyzny z rozwichrzonymi włosami. W tle jest rysowana linia w kratkę oraz kilka śladów po plamach. W tekście znajdują się następujące słowa:

"Zmienilem się. 
Wszystko się zmieniło. 
Wszystko się miesza. 
Świat się zmienił. 
Nikt mnie już nie pozna. 
Sam się nie poznaje. 

Tyle lat odosobnienia. 
W co ja się wpakowałem? 
Który mamy rok? 

When am I?"

Page11:
Na zrzucie ekranu widoczny jest tekst na tle kartki w linię. W lewym dolnym rogu są czerwone plamy przypominające farbę lub atrament. Tekst brzmi:

"Nie da się żyć z tą wiedzą.
Wspierając demony sam stajesz się demonem.

A gdyby to wszystko zakończyć?
Przecież znam przyszłość.

Pomogłem Andrzejowi, ale oni mnie wykorzystali."

Page12:
Na zrzucie ekranu znajdują się ręcznie napisane słowa na kartce papieru w kratkę, częściowo zasłonięte plamami po kawie. Tekst brzmi:

"Śniły mi się drony nad miastem. Te, które znałem z opowieści Adama. On mówił, że po 2024 roku tak będzie wyglądać codzienność. Ja w to wierzę, ale skrycie nie chcę, aby to co mówi, było prawdą. Może przyszłość nigdy nie nadejdzie?"

W lewym dolnym rogu znajduje się szkic drona.

Page13:
Na zrzucie ekranu widać fragment tekstu napisanego po polsku, który znajduje się na tle kartki w linię z brązową plamą przypominającą ślad po kawie. Tekst brzmi:

"Byłem na przesłuchaniu i pytali o Andrzeja. No to powiedziałem, co wiedziałem. I nie wiem, jak to się dalej potoczy. Siedzę tu już dostatecznie długo, żeby wszystko przemyśleć. Wiem teraz więcej niż wcześniej. I nie chodzi o wiedzę techniczną. Wszystko sobie poukładałem. Te demony czekały na odkrycie."

Page14:
Na zrzucie ekranu widnieje fragment tekstu zapisanego odręcznym pismem na kartce w linie. W górnym rogu widoczne są plamy, które wyglądają na rozlaniu kawy lub herbaty. Tekst brzmi:

"Powinni Barbarę przesłuchać. Ona wie wszystko. Rozmawiałem z nią.

Moje przypuszczenia były słuszne. Miesza mi się wszystko, ale wiem kto jest demonem, kto człowiekiem, a kto robotem. Widzę demony. Otaczają nas. Z jednym niegdyś pracowałem.

Może czas na egzorcyzmy?"

Page15:
Na zrzucie ekranu znajduje się kartka z notatnika z tekstem w języku polskim oraz graficznym elementem. Tło przedstawia linie papieru w notatniku z plamami tuszu po lewej stronie. Na środku znajduje się czerwona prostokątna grafika z białymi śladami stóp oraz napisem "{{FLG: }}".

Tekst na kartce brzmi:

"Poszedłem na spacer. Ochra ziemia pod stopami, a wkoło las, skały i śnieg.

Szedłem prosto. Obróciłem się w lewo i znów prosto. Kolejny zwrot w lewo i później znów prosto. Zatrzymałem się i obróciłem w prawo tym razem. To wszystko wykonałem cztery razy i początek stał się końcem.

Spojrzałem na swoje białe ślady na śniegu. To było miejsce, w którym chciałbym teraz być." 

Słowa „cztery razy” są podkreślone czerwonym kolorem, a słowo „miejsce” jest podświetlone na żółto.

Page16:
Ten screenshot przedstawia kartkę z zeszytu w linię, na której znajduje się odręczny tekst w języku polskim oraz rysunki. Tekst brzmi:

"Znalazłem miejsce schronienia. Tutaj nikt mnie nie znajdzie. To miejsce nie jest szczególnie oddalone od miasta, w którym spędziłem ostatnie lata. Zatrzymam się tu na jakiś czas.

Trochę tu zimno i ciemno, ale bezpiecznie."

Na rysunku widać jaskinię oraz czerwoną postać narysowaną prostą kreską. Na dole po prawej stronie znajduje się napis "Iz 2:19".

Page17:
Na zrzucie ekranu znajduje się tekst o następującej treści:

"Na spotkanie z demonem trzeba się przygotować. Spojrzeć prosto w oczy i wyrecytować mu jego grzechy.

Czy on wie, że jest zły? czy on stanie się złym?

Co za różnica, gdy za chwilę wszystko będzie bez znaczenia?"

Tekst zapisany jest na kartce w linię, z efektem rozmazanej farby w kolorze czerwonym i niebieskim, przypominającym plamy krwi i wody.

Page18:
Na screenshocie znajduje się notatka zapisana odręcznym pismem na papierze w linię. Treść wiadomości to:

"Andrzejek... Andrzejek...
słyszę w głowie Twoje
kroki i czekam na Ciebie.
To już jutro.

Kiedyś ja pomogłem Tobie,
a dziś Ty pomożesz
światu.

Trzeba wszystko
odwrócić."

W tekście znajdują się również czerwone podkreślenia oraz rysunki, w tym trójkąt z wykrzyknikiem obok napisu "światu." U dołu, data "11 listopada 2024" jest napisana szarym odcieniem.

Page19:
Na zrzucie ekranu znajdują się zdjęcia fragmentów strony z odręcznym tekstem. 

Górny fragment brzmi:
"wszystko zostało zaplanowane. Jestem gotowy, a Andrzej przyjdzie tutaj niebawem. Barbara mówi, że dobrze robię i mam się nie poddawać. Kolacja już jest gotowa, teraz tylko..."

Środkowy fragment brzmi:
"władza robi to w 2235 nie będzie tylko marzeń z ziemi, ale w obrot. To jest wrażenie. Wszystko się nie miesza, ale Barbara obiecała, że po wykonaniu zamówienia schorzenie jest w skod, dziękowanie i ze moje życie wewnętrzne jest w pełni leczalne. Wróci moja dawną osobowość. Wróci normalność wróci i normalność w mojej ręk. To wszystko jest w uniemyśli. Muszę tylko poczekać, aby Andrzejek..."

Dolny fragment brzmi:
"się dostać do Lapanry krótę Grandmażeń. Nie jest to daleko. Mam tylko nadzieję, że Andrzejek będzie miał dostatecznie dużo paliwa. Tankowanie nie wchodzi w grę, bo nie..."

Całość dokumentu jest zatytułowana "Zdjęcia odnalezionych fragmentów strony z notatnika Rafała"`

const questions = `
"01": "Do którego roku przeniósł się Rafał",
"02": "Kto wpadł na pomysł, aby Rafał przeniósł się w czasie?",
"03": "Gdzie znalazł schronienie Rafał? Nazwij krótko to miejsce",
"04": "Którego dnia Rafał ma spotkanie z Andrzejem? (format: YYYY-MM-DD)",
"05": "Gdzie się chce dostać Rafał po spotkaniu z Andrzejem?"`
  
const answer = await openaiService.completion({
    messages: [
        { role: "user", content: `Odpowiedz na pytania na podstawie tekstu:\n\n${template}\n\n${questions}` },
    ]
}) as OpenAI.Chat.Completions.ChatCompletion;

console.log(answer.choices[0].message.content);
};

main();