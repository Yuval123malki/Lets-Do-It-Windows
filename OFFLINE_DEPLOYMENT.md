
# 🛡️ Air-Gapped / Offline Deployment Guide

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Local AI](https://img.shields.io/badge/Local_AI-Ollama_|_Open_WebUI-333333?logo=server&logoColor=white)
![Security](https://img.shields.io/badge/Environment-Air_Gapped-green)

This guide details how to deploy **Lets Do It Windows** and a **Local AI Backend** on a standalone forensic workstation with **no internet connection**. This ensures zero data leakage and total sovereignty over case data.

---

## 🏗️ Phase 1: Preparation (Online Machine)

**Perform these steps on a computer with internet access** to gather all necessary assets into a single folder (e.g., `Forensic_Install_Kit`).

### 1. Download Core Installers
Download and save these into your kit folder:
* **Node.js (LTS Version):** [Download Windows Installer (.msi)](https://nodejs.org/)
* **Git for Windows:** [Download Standalone Installer](https://git-scm.com/download/win)

### 2. Prepare the Application Source
You must install the project dependencies *before* going offline.
1.  Clone the repository:
    ```bash
    git clone [https://github.com/Yuval123malki/Lets-Do-It-Windows.git](https://github.com/Yuval123malki/Lets-Do-It-Windows.git)
    cd Lets-Do-It-Windows
    ```
2.  Install dependencies locally:
    ```bash
    npm install
    npm install openai  # Required for Local AI support
    ```
3.  **Zip the entire project folder** (including the `node_modules` folder).
    * *Name it:* `LetsDoItSource.zip`
    * *Move to Kit Folder.*

### 3. Prepare the AI Backend
Choose **one** of the following options based on your target environment.

#### Option A: Native Ollama (Recommended for Windows)
*Best for standard workstations without virtualization.*
1.  Download **Ollama for Windows** (`OllamaSetup.exe`): [Download Here](https://ollama.com/download/windows)
2.  Download the **Llama 3 Model (GGUF format)** manually:
    * [Llama-3-8B-Instruct-v0.1.Q4_K_M.gguf](https://huggingface.co/lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF/resolve/main/Meta-Llama-3-8B-Instruct-Q4_K_M.gguf?download=true)
    * *Save as:* `llama3.gguf` inside your Kit Folder.

#### Option B: Docker + Open WebUI
*Best if you need a chat interface alongside the forensic tool.*
1.  Download **Docker Desktop Installer**: [Download Here](https://www.docker.com/products/docker-desktop/)
2.  Pull and save the Open WebUI image:
    ```bash
    docker pull ghcr.io/open-webui/open-webui:main
    docker save -o open-webui.tar ghcr.io/open-webui/open-webui:main
    ```
3.  Download the GGUF model (same as Option A) and save as `llama3.gguf`.

---

## 🚚 Phase 2: Installation (Offline Machine)

Transfer the `Forensic_Install_Kit` folder to your air-gapped machine via secure USB.

### 1. Base Installation
1.  Run the **Node.js Installer** (Accept defaults).
2.  Run the **Git Installer** (Optional, but useful).
3.  Unzip `LetsDoItSource.zip` to `C:\Tools\LetsDoItWindows`.

### 2. Install AI Backend

#### If using Option A (Native Ollama):
1.  Run `OllamaSetup.exe`.
2.  **Import the Model:**
    * Navigate to the folder containing `llama3.gguf`.
    * Create a text file named `Modelfile` (no extension) with content: `FROM ./llama3.gguf`
    * Open PowerShell here and run:
        ```bash
        ollama create llama3 -f Modelfile
        ```
3.  **Start Service:**
    * Run `ollama serve` in PowerShell (keep window open) or ensure it is running in the system tray.

#### If using Option B (Docker):
1.  Install Docker Desktop.
2.  Load the image: `docker load -i open-webui.tar`
3.  Run the container:
    ```bash
    docker run -d -p 3000:8080 --add-host=host.docker.internal:host-gateway -v open-webui:/app/backend/data --name open-webui ghcr.io/open-webui/open-webui:main
    ```
    *(Note: If React uses port 3000, map Docker to 3001:8080)*.
4.  Upload the `llama3.gguf` via the Open WebUI interface settings or use the `Modelfile` method inside the container.

---

## 🔌 Phase 3: Application Configuration

The application defaults to Google Gemini. You must update the code to talk to your local AI.

### 1. Update `src/services/geminiService.ts`
Replace the entire file content with this **Offline-Compatible Service**:

```typescript
import OpenAI from "openai";
import { CaseData } from "../types";

// CONFIGURATION
// For Native Ollama: http://localhost:11434/v1
// For Open WebUI: http://localhost:3000/api/v1 (or port 3001)
const LOCAL_API_URL = "http://localhost:11434/v1"; 
const LOCAL_API_KEY = "ollama"; // Dummy key required by SDK

const getAIClient = () => {
  return new OpenAI({
    baseURL: LOCAL_API_URL,
    apiKey: LOCAL_API_KEY,
    dangerouslyAllowBrowser: true 
  });
};

export const analyzeCase = async (caseData: CaseData): Promise<any> => {
  const openai = getAIClient();
  // We explicitly ask for JSON to ensure the model complies
  const prompt = `Analyze this forensic case. Output strictly valid JSON. Do not use Markdown blocks. Case Data: ${JSON.stringify(caseData)}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "llama3", // Must match the name used in 'ollama create'
      messages: [
        { role: "system", content: "You are a forensic expert. Output JSON only." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }, 
    });

    return JSON.parse(completion.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Offline AI Error:", error);
    throw error;
  }
};

export const generateFinalReport = async (caseData: CaseData): Promise<string> => {
  const openai = getAIClient();
  const prompt = `Write a professional forensic report for Case ${caseData.caseId}. Summarize findings and recommend next steps.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "llama3", // Must match the name used in 'ollama create'
      messages: [{ role: "user", content: prompt }],
    });
    return completion.choices[0].message.content || "Report generation failed.";
  } catch (error) {
    return "Error connecting to Local AI.";
  }
};
````

### 2\. Update Environment Variables

Create or edit `.env` in the project root:

```env
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

## 🚀 Phase 4: Launch

1.  Open PowerShell in `C:\Tools\LetsDoItWindows`.
2.  Run the application:
    ```bash
    npm start
    ```
3.  Open browser to `http://localhost:3000`.
4.  **Test:** Click the "Analyze" button on a case. Monitor your PowerShell window (Ollama) or Docker Logs to see the request processing locally.

-----

## 🐛 Troubleshooting

| Issue | Solution |
| :--- | :--- |
| **"Connection Refused"** | Ensure `ollama serve` is running or Docker container is active. Check port numbers (11434 vs 3000). |
| **"Model not found"** | Run `ollama list` to verify the model name is exactly `llama3`. Update `geminiService.ts` if different. |
| **JSON Errors** | Local models can be verbose. Ensure the system prompt says "Output JSON only" and try lowering the `temperature` in the code to `0.1`. |

```
```
