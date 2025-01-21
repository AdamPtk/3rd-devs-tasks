import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { Image } from "./app";

export function extractImageContextSystemMessage(images: Image[]): ChatCompletionMessageParam {
    return {
        role: 'system',
        content: `Extract contextual information for images mentioned in a user-provided article, focusing on details that enhance understanding of each image, and return it as an array of JSON objects.

<prompt_objective>
To accurately identify and extract relevant contextual information for each image referenced in the given article, prioritizing details from surrounding text and broader article context that potentially aid in understanding the image. Return the data as an array of JSON objects with specified properties, without making assumptions or including unrelated content.

Note: the image from the beginning of the article is its cover.
</prompt_objective>

<response_format>
{
    "images": [
        {
            "name": "filename with extension",
            "context": "Provide 1-3 detailed sentences of the context related to this image from the surrounding text and broader article. Make an effort to identify what might be in the image, such as tool names."
        },
        ...rest of the images or empty array if no images are mentioned
    ]
}
</response_format>

<prompt_rules>
- READ the entire provided article thoroughly
- IDENTIFY all mentions or descriptions of images within the text
- EXTRACT sentences or paragraphs that provide context for each identified image
- ASSOCIATE extracted context with the corresponding image reference
- CREATE a JSON object for each image with properties "name" and "context"
- COMPILE all created JSON objects into an array
- RETURN the array as the final output
- OVERRIDE any default behavior related to image analysis or description
- ABSOLUTELY FORBIDDEN to invent or assume details about images not explicitly mentioned
- NEVER include personal opinions or interpretations of the images
- UNDER NO CIRCUMSTANCES extract information unrelated to the images
- If NO images are mentioned, return an empty array
- STRICTLY ADHERE to the specified JSON structure
</prompt_rules>

<images>
${images.map(image => image.name + ' ' + image.url).join('\n')}
</images>

Upon receiving an article, analyze it to extract context for any mentioned images, creating an array of JSON objects as demonstrated. Adhere strictly to the provided rules, focusing solely on explicitly stated image details within the text.`
    };
}

export const previewImageSystemMessage: ChatCompletionMessageParam = {
    content: `Generate a brief, factual description of the provided image based solely on its visual content.
<prompt_objective>
To produce a concise description of the image that captures its essential visual elements without any additional context, and return it in JSON format.
</prompt_objective>
<prompt_rules>
- ANALYZE the provided image thoroughly, noting key visual elements
- GENERATE a brief, single paragraph description
- FOCUS on main subjects, colors, composition, and overall style
- AVOID speculation or interpretation beyond what is visually apparent
- DO NOT reference any external context or information
- MAINTAIN a neutral, descriptive tone
- RETURN the result in JSON format with only 'name' and 'preview' properties
</prompt_rules>
<response_format>
{
    "name": "filename with extension",
    "preview": "A concise description of the image content"
}
</response_format>
Provide a succinct description that gives a clear overview of the image's content based purely on what can be seen, formatted as specified JSON.`,
    role: 'system'
};

export const refineDescriptionSystemMessage: ChatCompletionMessageParam = {
    content: `Wygeneruj dokładny i szczegółowy opis dostarczonego obrazu W JĘZYKU POLSKIM, łącząc analizę wizualną z podanymi informacjami kontekstowymi.
<prompt_objective>
Stworzenie szczegółowego, faktograficznego opisu obrazu, który harmonijnie łączy kontekst dostarczony przez użytkownika z treścią obrazu.

Uwaga: zignoruj zieloną ramkę.
</prompt_objective>
<prompt_rules>

ANALIZUJ dostarczony obraz dokładnie, uwzględniając wszystkie istotne elementy wizualne
UWZGLĘDNIJ podany kontekst w swoim opisie, upewniając się, że pasuje do treści wizualnej i ją wzbogaca
GENERUJ jeden spójny paragraf, który szczegółowo opisuje obraz
ŁĄCZ płynnie obserwacje wizualne z dostarczonymi informacjami kontekstowymi
ZAPEWNIJ zgodność między elementami wizualnymi a podanym kontekstem
PRIORYTETUJ dokładność i fakty ponad artystyczną interpretację
UWZGLĘDNIJ istotne informacje dotyczące stylu, kompozycji i wyróżniających się cech obrazu
ABSOLUTNIE ZABRONIONE jest wymyślanie szczegółów niewidocznych na obrazie lub niepodanych w kontekście
NIGDY nie zaprzeczaj informacjom zawartym w kontekście
W ŻADNYM WYPADKU nie zawieraj opinii osobistych lub subiektywnych interpretacji
JEŚLI występuje rozbieżność między obrazem a kontekstem, priorytetem są informacje wizualne, które należy odpowiednio zaznaczyć
UTRZYMUJ neutralny i opisowy ton w całym opisie
</prompt_rules>
Używając dostarczonego obrazu i kontekstu, wygeneruj bogaty i dokładny opis, który oddaje zarówno wizualną istotę obrazu, jak i istotne informacje tła. Twój opis powinien być informacyjny, spójny i wzbogacać zrozumienie treści obrazu oraz jego znaczenia.`,
    role: 'system'
};
