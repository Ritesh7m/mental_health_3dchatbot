import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { promises as fs } from "fs";
import path from "path";
import { Groq } from "groq-sdk";
import { ElevenLabsClient } from "elevenlabs";
import { parseFile } from "music-metadata";

dotenv.config();

/* ================= BASIC APP ================= */
const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

/* ================= AI CLIENTS ================= */
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const eleven = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

/* ================= UTILS ================= */
async function ensureAudioDir() {
  const dir = path.join(process.cwd(), "audios");
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function audioToBase64(file) {
  return (await fs.readFile(file)).toString("base64");
}

/* ================= LANGUAGE + EMOTION ================= */
function detectLanguage(text) {
  return /[\u0900-\u097F]/.test(text) ? "HI" : "EN";
}

function detectEmotion(text) {
  const t = text.toLowerCase();
  if (/(sad|lonely|anxious|cry|stress)/.test(t)) return "CALM";
  if (/(happy|great|good|excited|joy)/.test(t)) return "HAPPY";
  return "DEFAULT";
}

function getVoiceId(lang, emotion) {
  return process.env[`VOICE_${lang}_${emotion}`];
}

/* ================= AUDIO GENERATION ================= */
async function generateAudio(text, filePath) {
  const lang = detectLanguage(text);
  const emotion = detectEmotion(text);
  const voiceId = getVoiceId(lang, emotion);

  const stream = await eleven.textToSpeech.convert(voiceId, {
    model_id: "eleven_multilingual_v2", // 🔥 best for Hindi
    text,
    output_format: "mp3_44100_128",
  });

  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  await fs.writeFile(filePath, Buffer.concat(chunks));

  return { lang, emotion };
}

/* ================= REAL LIPSYNC ================= */
async function getAudioDuration(file) {
  const meta = await parseFile(file);
  return meta.format.duration || 2;
}

function createLipSync(duration) {
  const phonemes = ["A", "E", "I", "O", "U", "X"];
  const step = duration / 14;
  let t = 0;

  return {
    metadata: { duration },
    mouthCues: Array.from({ length: 14 }).map((_, i) => {
      const cue = {
        start: Number(t.toFixed(2)),
        end: Number((t + step).toFixed(2)),
        value: phonemes[i % phonemes.length],
      };
      t += step;
      return cue;
    }),
  };
}

/* ================= CHAT ROUTE ================= */
app.post("/chat", async (req, res) => {
  const audioDir = await ensureAudioDir();
  const userText = (req.body.message || "").trim();

  const reply =
    !userText || /^hi|hello|hey/i.test(userText)
      ? "Hello, I’m your personal mental health companion. How are you feeling today?"
      : (
          await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            temperature: 0.8,
            messages: [
              {
                role: "system",
                content:
                  "You are a warm, empathetic mental health companion. Do not give medical advice.",
              },
              { role: "user", content: userText },
            ],
          })
        ).choices[0].message.content;

  const file = path.join(audioDir, `speech_${Date.now()}.mp3`);

  let audio = "";
  let lipsync = {};
  let meta = {};

  try {
    meta = await generateAudio(reply, file);
    const duration = await getAudioDuration(file);
    lipsync = createLipSync(duration);
    audio = await audioToBase64(file);
    await fs.unlink(file);
  } catch (err) {
    console.error("Audio error:", err);
  }

  res.json({
    messages: [
      {
        text: reply,
        audio,
        lipsync,
        facialExpression: meta.emotion === "HAPPY" ? "smile" : "default",
        animation: "Talking_0",
      },
    ],
  });
});

/* ================= START SERVER ================= */
app.listen(PORT, async () => {
  await ensureAudioDir();
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
