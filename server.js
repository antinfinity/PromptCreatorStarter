const express = require('express');
const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
app.use(express.static('public'));
app.use(bodyParser.json());

// OpenAI API setup
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

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
    const gptResponse = await openai.createCompletion({
      model: 'gpt-3.5-turbo',
      prompt,
      max_tokens: 100,
    });

    const generatedResponse = gptResponse.data.choices[0].text.trim();

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

  