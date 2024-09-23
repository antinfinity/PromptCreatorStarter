import express from 'express';
import fs from 'fs';
import { createObjectCsvWriter } from 'csv-writer';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
app.use(express.static('public'));
app.use(bodyParser.json());


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Make sure to set your API key in an environment variable
});

// Setup CSV Writer
const csvWriter = createObjectCsvWriter({
  path: 'prompts_responses.csv',
  header: [
    { id: 'topic', title: 'TOPIC' },
    { id: 'sentiment', title: 'SENTIMENT' },
    { id: 'style', title: 'STYLE' },
    { id: 'tone', title: 'TONE' },
    { id: 'language', title: 'LANGUAGE' },
    { id: 'response', title: 'RESPONSE' },
  ],
  append: true,
});

// POST endpoint to handle prompt input and LLM response
app.post('/generate', async (req, res) => {
  const { topic, sentiment, style, tone, language } = req.body;

  // Construct the prompt for GPT-3.5
  const prompt = `Topic: ${topic}, Sentiment: ${sentiment}, Style: ${style}, Tone: ${tone}, Language: ${language}.`;

  try {
    // Call GPT-3.5
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt }
      ]
    });

    const generatedResponse = response.choices[0].message.content

    // Write the prompt and response to the CSV
    await csvWriter.writeRecords([
      { topic, sentiment, style, tone, language, response: generatedResponse },
    ]);

    // Send the response back to the client
    res.json({ response: generatedResponse });
  } catch (error) {
    console.error('Error generating response:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});
// Test API key
app.get('/test-key', async (req, res) => {
  console.log("test-key")
  try {
    console.log("in test-key:" + openai.apiKey)
    let prompt = "Say hello world in French";
    await openai.completions.create({
      model: "gpt-3.5-turbo-instruct",
      prompt: prompt,
      max_tokens: 100,
      temperature: 0.5,
    }).then((response) => {
        console.log(response.choices[0].text);
        console.log("test-key response sent")
        res.send(response.choices[0].text);
    });
  } catch (error) {
      return console.error('Error:', error);
  }
});
// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

  