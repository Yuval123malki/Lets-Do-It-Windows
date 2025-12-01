# 🛡️ Complete Guide: Air-Gapped Forensic AI Deployment

> **Goal:** Deploy "Lets Do It Windows" with a Local AI backend (Ollama + Open WebUI) on a secure, offline machine.

![Environment](https://img.shields.io/badge/Environment-Air_Gapped-green)
![AI Backend](https://img.shields.io/badge/Backend-Ollama_Local-orange)
![Interface](https://img.shields.io/badge/Interface-Open_WebUI-blue)

---

## 🏗️ Phase 1: Online Preparation
**Perform these steps on a Windows computer with internet access.**
You will create a `Forensic_Install_Kit` folder to transfer to your secure machine.

### 1. Core Installers
Download and save these into your Kit Folder:

* **Node.js (LTS):** [Download .msi](https://nodejs.org/)
* **Git for Windows:** [Download Installer](https://git-scm.com/download/win)
* **Ollama (The AI Engine):** [Download OllamaSetup.exe](https://ollama.com/download/windows)
* **Llama 3 Model:** [Download llama-3-8b-instruct.gguf](https://huggingface.co/lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF/resolve/main/Meta-Llama-3-8B-Instruct-Q4_K_M.gguf?download=true)
    * *Save file as:* `llama3.gguf`

### 2. Application Source
1.  Clone the repository:
    ```bash
    git clone [https://github.com/Yuval123malki/Lets-Do-It-Windows.git](https://github.com/Yuval123malki/Lets-Do-It-Windows.git)
    ```
2.  Switch to local AI dependencies:
    ```bash
    cd Lets-Do-It-Windows
    npm uninstall @google/genai
    npm install openai
    npm install
    ```
3.  **Zip the folder** (including `node_modules`). Name it `LetsDoItSource.zip` and move it to your Kit Folder.

### 3. Open WebUI (The Chat Interface)
Choose **one** option below for how you want to run the interface.

#### 📦 Option A: Docker (Recommended for Stability)
1.  **Download Docker Desktop Installer:** [Download Here](https://www.docker.com/products/docker-desktop/)
2.  **Pull and save the image:**
    ```powershell
    docker pull ghcr.io/open-webui/open-webui:main
    docker save -o open-webui.tar ghcr.io/open-webui/open-webui:main
    ```
3.  Move `open-webui.tar` to your Kit Folder.

#### 🐍 Option B: Native Python (No Docker Required)
1.  **Download Python 3.11** (Must be 3.11): [Download Installer](https://www.python.org/downloads/release/python-3110/)
2.  **Download dependencies for offline use:**
    ```powershell
    # Create a folder for the packages
    mkdir openwebui_packages
    
    # Download packages without installing
    pip download open-webui -d ./openwebui_packages
    ```
3.  Move the `openwebui_packages` folder to your Kit Folder.

---

## 🚚 Phase 2: Offline Installation
**Perform these steps on the Air-Gapped Machine.**

### Step 1: Base Setup & AI Engine
1.  Install **Node.js** and **Git**.
2.  Install **Ollama** (`OllamaSetup.exe`).
3.  **Load the Model:**
    * Navigate to the folder containing `llama3.gguf`.
    * Create a text file named `Modelfile` (no extension) with the following content:
        ```dockerfile
        FROM ./llama3.gguf
        ```
    * Run in PowerShell:
        ```powershell
        ollama create llama3 -f Modelfile
        ```
4.  **Start Ollama:**
    ```powershell
    ollama serve
    ```
    *(Minimize this window).*

### Step 2: Install Open WebUI
Choose the option matching your preparation.

#### 📦 Option A: Docker Method
1.  Install Docker Desktop.
2.  Load the image:
    ```powershell
    docker load -i open-webui.tar
    ```
3.  Run the container:
    ```powershell
    # Note: We map to port 3000 to match the configuration below
    docker run -d -p 3000:8080 --add-host=host.docker.internal:host-gateway -v open-webui:/app/backend/data --name open-webui ghcr.io/open-webui/open-webui:main
    ```

#### 🐍 Option B: Native Python Method
1.  Install **Python 3.11**. **Important:** Check "Add Python to PATH" during installation.
2.  Install Open WebUI from your offline folder:
    ```powershell
    cd openwebui_packages
    pip install open-webui --no-index --find-links=.
    ```
3.  Start the Server:
    ```powershell
    # This usually starts on port 8080 by default
    open-webui serve
    ```

#### Dont Forget to Enable API Keys:
user profile -> admin console -> settings -> general -> in "Authontication" section find "Enable API Keys"

---

## 🔐 Phase 3: Project Configuration

1.  Unzip `LetsDoItSource.zip` to `C:\Tools\LetsDoItWindows`.

### 1. Configure `.env`
Create a `.env` file in the project root. **Note the port difference between options.**

```properties
# .env

# --- URL CONFIGURATION ---
# IF USING OPTION A (Docker):
AI_BASE_URL=http://localhost:3000/api/v1

# IF USING OPTION B (Native Python):
# AI_BASE_URL=http://localhost:8080/api/v1

# --- API KEY ---
# Generate this in Open WebUI Settings -> Account -> API Keys
AI_API_KEY=sk-your-generated-key

# --- MODEL NAME ---
AI_MODEL_NAME=llama3
````

### 2\. Update Service Code (`src/services/aiService.ts`)

Copy the following code to replace `aiService.ts`. This ensures robust handling of local AI responses.

```typescript
import OpenAI from "openai";
import { CaseData } from "../types";

const getAIClient = () => {
  if (!process.env.AI_API_KEY || !process.env.AI_BASE_URL) {
    throw new Error("AI Configuration missing. Check .env file.");
  }
  return new OpenAI({
    baseURL: process.env.AI_BASE_URL,
    apiKey: process.env.AI_API_KEY,
    dangerouslyAllowBrowser: true 
  });
};

export const analyzeCase = async (caseData: CaseData): Promise<any> => {
  const openai = getAIClient();
  
  // Prompt engineering for local models to ensure JSON
  const prompt = `Analyze this forensic case. Output strictly valid JSON. Do not use Markdown blocks. Case Data: ${JSON.stringify(caseData)}`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL_NAME || "llama3",
      messages: [
        { role: "system", content: "You are a forensic expert. Output JSON only." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }, 
      temperature: 0.2, 
    });

    const text = completion.choices[0].message.content;
    if (!text) return {};
    return JSON.parse(text);

  } catch (error) {
    console.error("Local AI Error:", error);
    throw error;
  }
};

export const generateFinalReport = async (caseData: CaseData): Promise<string> => {
  const openai = getAIClient();
  const prompt = `Write a professional forensic report for Case ${caseData.caseId}. Summarize findings.`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL_NAME || "llama3",
      messages: [{ role: "user", content: prompt }],
    });
    return completion.choices[0].message.content || "Report generation failed.";
  } catch (error) {
    return "Error connecting to Local AI.";
  }
};
```

-----

## 🚀 Phase 4: Launch

1.  Ensure **Ollama** is running.
2.  Ensure **Open WebUI** is running (Docker container OR `open-webui serve`).
3.  Start your app:
    ```bash
    npm start
    ```
4.  **Connect:** Open browser to `http://localhost:3000` (or `8080` for Open WebUI directly) to create your admin account and generate your API Key.

-----

## 🐛 Troubleshooting

| Issue | Solution |
| :--- | :--- |
| **Connection Refused** | **Docker:** Check `host.docker.internal` mapping.<br>**Native:** Check if port 8080 is blocked by another app. |
| **"Model not found"** | In Open WebUI settings, ensure the "Ollama" connection is set to `http://localhost:11434` (Native) or `http://host.docker.internal:11434` (Docker). |
| **Pip Install Failed** | Ensure you downloaded **all** dependencies in Phase 1. If a specific wheel is missing, you must download it on the online machine. |

### 📚 References

  * [Beginners Guide to Installing Open WebUI (YouTube)](https://www.youtube.com/watch?v=Qz5WWJ9v-6A) - *Visual walkthrough for Native Python installation.*

<!-- end list -->

