import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Modality } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/generate-music', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    const response = await ai.models.generateContentStream({
      model: "lyria-3-clip-preview",
      contents: prompt,
    });

    let audioBase64 = "";
    let mimeType = "audio/wav";

    for await (const chunk of response) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;

      for (const part of parts) {
        if (part.inlineData?.data) {
          if (!audioBase64 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioBase64 += part.inlineData.data;
        }
      }
    }
    
    res.json({ audioBase64, mimeType });
  } catch (error) {
    console.error('Music generation error:', error);
    res.status(500).json({ error: 'Failed to generate music' });
  }
});

// Serve static files in production
app.use(express.static(path.join(__dirname, 'dist')));

app.listen(3000, () => console.log('Server running on port 3000'));
