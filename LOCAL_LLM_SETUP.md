# 🧠 Local LLM Integration Guide (Open WebUI)

This guide details how to switch the application's AI backend from Google Gemini (Cloud) to a **Local LLM** running via **Open WebUI**. This ensures total data privacy for forensic analysis by keeping all data within your local network.

-----

## 📋 Prerequisites

1.  **Open WebUI Running:** Ensure your local instance is up (usually `http://localhost:3000`).
2.  **Model Loaded:** Have a model capable of instruction following (e.g., `llama3`, `mistral`, or `gemma2`) downloaded in your backend.
3.  **API Key:** Generate an API Key in Open WebUI settings (User Settings -\> Settings -\> API Keys).

-----

## ⚙️ Step 1: Install Dependencies

We will move away from the proprietary `@google/genai` SDK and use the standard `openai` library. Open WebUI provides an OpenAI-compatible endpoint, making this the most robust standard.

```bash
# Remove the Gemini SDK
npm uninstall @google/genai

# Install the OpenAI SDK (Standard for Local LLMs)
npm install openai
```

-----

## 🔐 Step 2: Environment Configuration

Update your `.env` (or `.env.local`) file. We need to point the application to your local machine instead of Google's servers.

```properties
# .env

# Base URL for Open WebUI API (Add /api/v1 suffix)
# If using Ollama directly, this might be http://localhost:11434/v1
AI_BASE_URL=http://localhost:3000/api/v1

# The API Key generated in Open WebUI settings
# If using Ollama directly, use 'ollama' as the key
AI_API_KEY=sk-your-generated-open-webui-key

# The specific model you want to use (must match the tag in your local setup)
# Example: 'llama3:latest', 'mistral', 'deepseek-r1'
AI_MODEL_NAME=llama3:latest
```

-----

## 🛠️ Step 3: Service Layer Refactoring

We will rewrite `services/geminiService.ts` (recommend renaming to `services/aiService.ts`) to use the OpenAI compatible client.

**Key Changes:**

  * Replaced `GoogleGenAI` client with `OpenAI` client.
  * Swapped `generateContent` for `chat.completions.create`.
  * Mapped system instructions to the `system` role for better adherence.

### `services/aiService.ts`

```typescript
import OpenAI from "openai";
import { CaseData } from "../types";
// import { buildPrompt } from "./promptUtils"; // Assuming prompt builders exist

// Initialize the OpenAI Client pointing to Local Host
const getAIClient = () => {
  if (!process.env.AI_API_KEY || !process.env.AI_BASE_URL) {
    throw new Error("AI Configuration missing. Check AI_BASE_URL and AI_API_KEY.");
  }

  return new OpenAI({
    baseURL: process.env.AI_BASE_URL,
    apiKey: process.env.AI_API_KEY,
    dangerouslyAllowBrowser: true // Enable only if calling from client-side (React), otherwise keep strictly server-side
  });
};

/**
 * Analyzes case data and returns a structured JSON object.
 */
export const analyzeCase = async (caseData: CaseData): Promise<any> => {
  const openai = getAIClient();

  try {
    const prompt = buildPrompt(caseData); // Your existing prompt logic
    
    // Construct the payload
    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL_NAME || "llama3",
      messages: [
        { 
          role: "system", 
          content: "You are a digital forensic expert. You output strictly JSON." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      // IMPORTANT: Not all local models support 'json_object' strictly. 
      // If errors occur, remove response_format and rely on prompt engineering.
      response_format: { type: "json_object" }, 
      temperature: 0.2, // Low temperature for deterministic analysis
    });

    const text = completion.choices[0].message.content;

    if (!text) return null;
    return JSON.parse(text);

  } catch (error) {
    console.error("Local LLM Analysis Error:", error);
    throw error;
  }
};

/**
 * Generates the final text-based report.
 */
export const generateFinalReport = async (caseData: CaseData): Promise<string> => {
  const openai = getAIClient();

  const prompt = `
    Act as a Forensic Report Editor. You are generating the final report for Case ${caseData.caseId}.
    Please provide a professional summary and conclusion based on the findings.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL_NAME || "llama3",
      messages: [
         { role: "system", content: "You are a professional report writer." },
         { role: "user", content: prompt }
      ],
      temperature: 0.7, // Higher temp for more natural writing flow
    });

    return completion.choices[0].message.content || "Failed to generate report.";
  } catch (error) {
    console.error("Local LLM Export Error:", error);
    return "Error generating AI report.";
  }
};
```

-----

## 🎨 Step 4: UI Updates (Optional)

You likely do not need to change `AIReport.tsx` or `App.tsx` significantly, as the function signatures (`analyzeCase` and `generateFinalReport`) remain the same.

However, since local models can be slower than Cloud APIs depending on your GPU, consider adding a "thinking" indicator or streaming response logic if you want to get fancy later.

**Update `components/AIReport.tsx` to handle potential timeouts:**

```typescript
// No logic change needed, but ensure your timeout handling is robust 
// as local inference on CPU/Low-end GPU can take 30s+
```

-----

## 🐛 Troubleshooting

| Issue | Solution |
| :--- | :--- |
| **JSON Parse Error** | Local models are "chattier" than Gemini. Ensure your system prompt explicitly says: *"Do not output markdown backticks. Output raw JSON only."* |
| **Connection Refused** | Check that Open WebUI is running and there are no CORS issues. If running via Docker, ensure ports are mapped correctly. |
| **404 Not Found** | Verify your `AI_BASE_URL`. It usually ends in `/v1`. |

-----

> **Note on Privacy:** By switching to this local configuration, **zero** case data leaves your machine. This is critical for forensic compliance.
