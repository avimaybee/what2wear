'use server'

// Define the expected JSON structure from the AI
export type CategorizationResponse = {
  category: string;
  color: string;
  season_tags: string[];
  style_tags: string[];
}

export async function categorizeImage(imageUrl: string): Promise<CategorizationResponse | { error: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Gemini API key is not configured.');
    return { error: 'Gemini API key is not configured.' };
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`;

  const prompt = `
    Analyze the clothing item in the provided image.
    Respond with only a single, valid JSON object in a markdown code block.
    The JSON object should have the following structure:
    {
      "category": "one of: 'shirt', 't-shirt', 'jacket', 'pants', 'shoes', 'accessory'",
      "color": "a simple, one or two-word color description (e.g., 'dark blue', 'light grey')",
      "season_tags": "an array of strings, choose one or more from: 'spring', 'summer', 'autumn', 'winter'",
      "style_tags": "an array of strings, choose one or more from: 'casual', 'formal', 'streetwear', 'sporty', 'business'"
    }
    Do not include any other text or explanation outside of the JSON object.
  `;

  try {
    // Fetch the image and convert it to a base64 string
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
        return { error: 'Failed to fetch image from URL.' };
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');

    const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg', // Assuming jpeg, can be made more dynamic
                  data: imageBase64,
                },
              },
            ],
          },
        ],
      };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('Gemini API Error:', errorBody);
      return { error: `Gemini API request failed: ${response.statusText}` };
    }

    const responseBody = await response.json();
    
    // Extract the JSON string from the markdown code block
    const jsonString = responseBody.candidates[0].content.parts[0].text.replace(/```json\n?|```/g, '');
    
    const parsedJson = JSON.parse(jsonString) as CategorizationResponse;
    
    return parsedJson;

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return { error: 'Failed to analyze image.' };
  }
}
