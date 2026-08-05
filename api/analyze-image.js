import { GoogleGenerativeAI } from '@google/generative-ai';

// Maximum payload size on Vercel free tier is 4.5MB
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, prompt } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration error: Gemini API key missing' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    // Assuming the base64 string comes with data URI prefix like data:image/jpeg;base64,...
    let base64Data = imageBase64;
    let mimeType = 'image/jpeg';

    if (imageBase64.includes('data:')) {
      const parts = imageBase64.split(',');
      mimeType = parts[0].split(':')[1].split(';')[0];
      base64Data = parts[1];
    }

    const imageParts = [
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        },
      },
    ];

    const result = await model.generateContent([prompt || 'Describe this image.', ...imageParts]);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ text });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: 'Failed to analyze image with Gemini API' });
  }
}
