import { exec } from "child_process";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { promises as fs } from "fs";
import { Groq } from "groq-sdk";
import path from "path";
import { ElevenLabsClient } from "elevenlabs";
import knowledgeBase from "./mental_health_knowledge_base.js"; // ✅ Import directly

// Load environment variables
dotenv.config();
const groqApiKey = process.env.GROQ_API_KEY;

// Initialize Groq client
const groq = new Groq({
  apiKey: groqApiKey,
});

// ElevenLabs config
const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
const voiceID = process.env.VOICE_ID; // set this to a female voice in your .env

const eleven = new ElevenLabsClient({
  apiKey: elevenLabsApiKey,
});

const app = express();
app.use(express.json());
app.use(cors());
const port = process.env.PORT || 3000;

// Audio generation timeout (10 seconds)
const AUDIO_TIMEOUT = 10000;

// Ensure audio directory exists
async function ensureAudioDir() {
  const audioDir = path.join(process.cwd(), "audios");
  try {
    await fs.mkdir(audioDir, { recursive: true });
    console.log("Audio directory confirmed");
  } catch (error) {
    console.error("Error creating audio directory:", error);
  }
  return audioDir;
}

// Test ElevenLabs API connection
async function testElevenLabsConnection() {
  try {
    if (!elevenLabsApiKey) {
      console.error("ElevenLabs API key not found");
      return false;
    }

    await Promise.race([
      eleven.voices.getAll(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 5000)
      ),
    ]);

    console.log("ElevenLabs API connection successful");
    return true;
  } catch (error) {
    console.error("ElevenLabs API connection failed:", error.message);
    return false;
  }
}

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/voices", async (req, res) => {
  try {
    const voices = await eleven.voices.getAll();
    res.send(voices);
  } catch (error) {
    console.error("Error fetching voices:", error);
    res.status(500).send({ error: "Failed to fetch voices" });
  }
});

app.get("/health", async (req, res) => {
  const health = {
    server: "running",
    groqApi: !!groqApiKey,
    elevenLabsApi: !!elevenLabsApiKey,
    knowledgeBase: !!knowledgeBase,
    timestamp: new Date().toISOString(),
  };

  try {
    const elevenLabsConnected = await testElevenLabsConnection();
    health.elevenLabsConnected = elevenLabsConnected;
  } catch (error) {
    health.elevenLabsConnected = false;
  }

  res.json(health);
});

// Default lipsync data
const DEFAULT_LIPSYNC = {
  metadata: {
    soundFile: "default.wav",
    duration: 2.0,
  },
  mouthCues: [
    { start: 0.0, end: 0.2, value: "X" },
    { start: 0.2, end: 0.4, value: "A" },
    { start: 0.4, end: 0.6, value: "E" },
    { start: 0.6, end: 0.8, value: "O" },
    { start: 0.8, end: 1.0, value: "U" },
    { start: 1.0, end: 1.2, value: "A" },
    { start: 1.2, end: 1.4, value: "E" },
    { start: 1.4, end: 1.6, value: "O" },
    { start: 1.6, end: 1.8, value: "X" },
    { start: 1.8, end: 2.0, value: "X" },
  ],
};

// Generate audio with timeout
async function generateAudioWithTimeout(voiceId, fileName, text) {
  console.log(
    `Attempting to generate audio for: "${text.substring(0, 50)}..."`
  );
  return new Promise(async (resolve, reject) => {
    const timeoutId = setTimeout(() => {
      console.error("Audio generation timeout");
      reject(new Error("Audio generation timeout"));
    }, AUDIO_TIMEOUT);

    try {
      const audioResult = await eleven.generate({
        voice: voiceId,
        model_id: "eleven_multilingual_v2",
        text,
      });

      if (audioResult && typeof audioResult.arrayBuffer === "function") {
        const ab = await audioResult.arrayBuffer();
        const buffer = Buffer.from(ab);
        await fs.writeFile(fileName, buffer);
        clearTimeout(timeoutId);
        console.log("Audio generation successful (via arrayBuffer)");
        resolve();
        return;
      }

      const reader =
        (audioResult &&
          typeof audioResult.getReader === "function" &&
          audioResult.getReader()) ||
        (audioResult &&
          audioResult.body &&
          typeof audioResult.body.getReader === "function" &&
          audioResult.body.getReader());

      if (reader) {
        const chunks = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(Buffer.from(value));
        }
        const buffer = Buffer.concat(chunks);
        await fs.writeFile(fileName, buffer);
        clearTimeout(timeoutId);
        console.log("Audio generation successful (via getReader)");
        resolve();
        return;
      }

      clearTimeout(timeoutId);
      reject(new Error("Unsupported audio result shape from ElevenLabs SDK"));
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Audio generation failed:", error.message);
      reject(error);
    }
  });
}

const audioFileToBase64 = async (file) => {
  try {
    console.log(`Reading audio file: ${file}`);
    const data = await fs.readFile(file);
    return data.toString("base64");
  } catch (error) {
    console.error(`Error reading audio file ${file}:`, error);
    return "";
  }
};

// ---------------- CHAT ROUTE -----------------
app.post("/chat", async (req, res) => {
  console.log("=== Chat request received ===");
  const audioDir = await ensureAudioDir();
  const userMessage = (req.body.message || "").trim();

  // Check for greetings
  const greetings = [
    "hi",
    "hello",
    "hey",
    "hii",
    "good morning",
    "good evening",
  ];
  const isGreeting = greetings.some((g) =>
    userMessage.toLowerCase().startsWith(g)
  );

  if (!userMessage || isGreeting) {
    const introMessage =
      "Hello — I’m your personal mental health companion (not a licensed therapist). It’s nice to meet you. I’m here to listen without judgement — how have you been feeling lately?";
    let audioData = "";
    try {
      const fileName = path.join(audioDir, `intro_${Date.now()}.mp3`);
      await generateAudioWithTimeout(voiceID, fileName, introMessage);
      audioData = await audioFileToBase64(fileName);
    } catch {
      audioData = "";
    }

    return res.send({
      messages: [
        {
          text: introMessage,
          audio: audioData,
          lipsync: DEFAULT_LIPSYNC,
          facialExpression: "smile",
          animation: "Talking_1",
        },
      ],
    });
  }

  // ----- Normal AI responses for other messages -----
  try {
    const systemPrompt = `
You are a supportive mental health companion acting in the style of a therapist.
- Be warm, empathetic, and validating.
- Use reflective listening: repeat back feelings in a compassionate way.
- Ask gentle, open-ended questions to help the user explore their emotions.
- Offer general coping strategies (breathing, mindfulness, journaling, grounding).
- Do NOT give medical advice or diagnoses.
- Always encourage the user to reach out to a licensed therapist or helpline if needed.

Respond as JSON:
{
  "messages": [
    { "text": "...", "facialExpression": "...", "animation": "..." },
    { "text": "...", "facialExpression": "...", "animation": "..." },
    { "text": "...", "facialExpression": "...", "animation": "..." }
  ]
}

- Always generate **2 to 3 supportive responses** per user message.  
- Allowed facialExpressions: smile, sad, angry, surprised, funnyFace, default  
- Allowed animations: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, Angry  

Knowledge base:
${knowledgeBase}
    `;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 1500,
      temperature: 0.8,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    let responseContent = completion.choices[0].message.content;
    let parsed;
    try {
      parsed = JSON.parse(responseContent);
    } catch {
      parsed = {
        messages: [
          {
            text: responseContent,
            facialExpression: "smile",
            animation: "Idle",
          },
        ],
      };
    }

    let messages = parsed.messages || parsed;

    // Guarantee 2–3 supportive responses
    if (!messages || messages.length < 2) {
      const base = messages[0] || {
        text: "I hear you, and I want you to know this is a safe space.",
        facialExpression: "smile",
        animation: "Talking_0",
      };

      messages = [
        base,
        {
          text: "Can you share more about how you’re feeling right now?",
          facialExpression: "default",
          animation: "Talking_1",
        },
        {
          text: "Remember, your feelings are valid and it’s okay to express them.",
          facialExpression: "smile",
          animation: "Talking_2",
        },
      ];
    }

    // Generate audio for each response
    for (let i = 0; i < messages.length; i++) {
      try {
        const fileName = path.join(audioDir, `msg_${i}_${Date.now()}.mp3`);
        await generateAudioWithTimeout(voiceID, fileName, messages[i].text);
        messages[i].audio = await audioFileToBase64(fileName);
        messages[i].lipsync = DEFAULT_LIPSYNC;
        await fs.unlink(fileName);
      } catch {
        messages[i].audio = "";
        messages[i].lipsync = DEFAULT_LIPSYNC;
      }
    }

    res.send({ messages });
  } catch (error) {
    console.error("Error with Groq API:", error);
    res.status(500).send({
      messages: [
        {
          text: "Sorry, there was an error processing your message.",
          facialExpression: "sad",
          animation: "Idle",
          audio: "",
          lipsync: DEFAULT_LIPSYNC,
        },
      ],
    });
  }
});

// ---------------- START SERVER -----------------
async function startServer() {
  console.log("=== Starting Mental Health Support Chatbot ===");
  await ensureAudioDir();
  const elevenLabsOk = await testElevenLabsConnection();
  console.log("ElevenLabs API Status:", elevenLabsOk ? "Connected" : "Failed");
  app.listen(port, () => {
    console.log(`🚀 Mental Health Chatbot listening on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
  });
}

startServer();
