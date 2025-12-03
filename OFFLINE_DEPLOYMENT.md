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

### 2\. Update Service Code (`Lets-Do-It-Windows-main\services\geminiService.ts`)

Copy the following code to replace `geminiService.ts`. This ensures robust handling of local AI responses.

```typescript
import { CaseData, ForensicStep } from "../types";
import { FORENSIC_STEPS } from "../constants";

// Helper to format structured data for the prompt
const formatAnalystData = (data: CaseData['analystData']) => {
    if (!data) return { tasks: "N/A", timeline: "N/A", iocs: "N/A" };

    const tasks = Array.isArray(data.tasks) 
        ? data.tasks.map(t => `- [${t.completed ? 'X' : ' '}] ${t.text}`).join('\n')
        : "N/A";

    const timeline = Array.isArray(data.timeline)
        ? data.timeline
            .sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime())
            .map(t => `[${t.date} ${t.time}] ${t.description}`).join('\n')
        : "N/A";

    const iocs = Array.isArray(data.iocs)
        ? data.iocs.map(i => `- ${i.text}`).join('\n')
        : "N/A";

    return { tasks, timeline, iocs };
};

// Helper to construct the context prompt
const buildPrompt = (caseData: CaseData): string => {
    const findingsList = Object.entries(caseData.findings).map(([stepId, finding]) => {
        const step = FORENSIC_STEPS.find(s => s.id === stepId);
        return `
---
STEP: ${step ? step.title : stepId}
FINDING: ${finding}
---`;
    }).join('\n');

    const { tasks, timeline, iocs } = formatAnalystData(caseData.analystData);

    return `
Act as a Senior Digital Forensics and Incident Response (DFIR) Expert.
Review the following investigation notes for Case ID: ${caseData.caseId}, Analyst: ${caseData.analystName}.

ANALYST NOTES:
${caseData.analystData?.notes || "N/A"}

TASKS:
${tasks}

MANUAL TIMELINE EVENTS:
${timeline}

INDICATORS OF COMPROMISE (IOCs):
${iocs}

INVESTIGATION DATA:
${findingsList.length > 0 ? findingsList : "No findings recorded yet."}

Based strictly on the provided findings, generate a JSON response with the following structure:
{
  "summary": "A professional executive summary of the incident based on findings.",
  "threatLevel": "Low | Medium | High | Critical",
  "keyIndicators": ["List of potential IOCs found"],
  "gapAnalysis": ["List of forensic steps that appear missing or incomplete based on the standard process"],
  "recommendations": ["Specific next steps to take"]
}

Do not output Markdown formatting for the JSON. Just the raw JSON string.
`;
};

// Internal helper to get API URL and key from environment
const getAIClient = () => {
    if (!process.env.AI_API_KEY || !process.env.AI_BASE_URL) {
        throw new Error("AI configuration missing. Check your .env file.");
    }
    return {
        url: process.env.AI_BASE_URL.replace(/\/v1$/, ""), // remove /v1 if present
        key: process.env.AI_API_KEY
    };
};

export const analyzeCase = async (caseData: CaseData): Promise<any> => {
    const client = getAIClient();
    const prompt = buildPrompt(caseData);

    try {
        const res = await fetch(`${client.url}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${client.key}`
            },
            body: JSON.stringify({
                model: process.env.AI_MODEL_NAME || "llama3:latest",
                messages: [
                    { role: "system", content: "You are a forensic expert. Output JSON only." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.2
            })
        });

        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (!text) return {};

        try {
            return JSON.parse(text);
        } catch {
            return { error: "Invalid JSON output", raw: text };
        }

    } catch (error) {
        console.error("Local AI Error:", error);
        throw error;
    }
};

export const generateFinalReport = async (caseData: CaseData): Promise<string> => {
    const client = getAIClient();

    const findingsList = Object.entries(caseData.findings).map(([stepId, finding]) => {
        const step = FORENSIC_STEPS.find(s => s.id === stepId);
        return `Step: ${step ? step.title : stepId}\nRaw Findings: ${finding}`;
    }).join('\n\n');

    const { tasks, timeline, iocs } = formatAnalystData(caseData.analystData);

    const prompt = `
Act as a Forensic Report Editor. Generate the final report for Case ${caseData.caseId}.

INPUT DATA:
1. Analyst Notes: ${caseData.analystData?.notes}
2. Tasks Status: 
${tasks}
3. IOCs (Indicators of Compromise): 
${iocs}
4. Manual Timeline Events: 
${timeline}
5. Technical Findings:
${findingsList}

INSTRUCTIONS:
- Clean the analysis: Rewrite the findings professionally and concisely.
- Auto-generate a Chronological Timeline: Merge timestamps from Technical Findings and Manual Timeline.
- Output a standard Markdown report structure.
`;

    try {
        const res = await fetch(`${client.url}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${client.key}`
            },
            body: JSON.stringify({
                model: process.env.AI_MODEL_NAME || "llama3:latest",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.2
            })
        });

        const data = await res.json();
        return data?.choices?.[0]?.message?.content || "Failed to generate report.";
    } catch (error) {
        console.error("Local AI Report Error:", error);
        return "Error generating AI report.";
    }
};

```

-----

## 🚀 Phase 4: Launch

1.  Ensure **Ollama** is running.
2.  Ensure **Open WebUI** is running (Docker container OR `open-webui serve`).
3.  Start your app: **run.bat**
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

