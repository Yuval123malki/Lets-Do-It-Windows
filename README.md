<img src="https://github.com/user-attachments/assets/ac915fff-a40b-45fa-9803-38d605935cab" width="300" alt="letsdoitwindows">
# 🕵️‍♂️ Lets Do It Windows

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)
![AI](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-8E75B2?logo=google&logoColor=white)
![Local AI](https://img.shields.io/badge/Local_AI-Open_WebUI-333333?logo=server&logoColor=white)
![DFIR](https://img.shields.io/badge/DFIR-FF0000)
![Malware Analysis](https://img.shields.io/badge/Malware%20Analysis-8B0000)
![Computer Forensics](https://img.shields.io/badge/Computer%20Forensics-005A9C)

**Lets Do It Windows** is a professional, browser-based Digital Forensics and Incident Response (DFIR) documentation and assistant tool. 

It guides analysts through the entire investigation lifecycle, from initial OS artifact analysis and memory forensics to advanced malware analysis while leveraging Google Gemini AI to generate threat assessments, gap analyses, and professional reports.

---

## 🚀 Key Features

### 📂 Comprehensive Case Management
* **Session Management:** Create, track, and switch between multiple investigation cases seamlessly.
* **Local Persistence:** Built on **Dexie.js (IndexedDB)**. All data is stored securely in your browser, ensuring total privacy and offline capability.
* **Dashboard:** Filter and sort cases by ID, Analyst Name, Status, or Scope.

### 🎯 Flexible Scoping
Tailor your workflow to the specific incident type:
* **Full Forensics Suite:** The complete end-to-end workflow.
* **OS & Artifacts Only:** Focused strictly on disk forensics.
* **Memory Forensics:** Volatility and RAM analysis.
* **Malware Analysis:** Static, Dynamic, and Reverse Engineering phases.

### 🔍 Guided Forensic Workflow
Over **40+ standard forensic artifact cards**, each containing:
* **Context:** Description and forensic value of the artifact.
* **Tooling:** Recommendations (Zimmerman tools, Volatility, Sysinternals).
* **Command Helpers:** One-click copy for CLI commands (`certutil`, `strings`, `Get-Content`).
* **Specialized Inputs:** Custom UI for hash lists, packer detection, and Zone IDs.

### 📝 Interactive Analyst Workbench
* **General Notes:** Free-text area for hypotheses.
* **Task Manager:** Track investigation to-dos.
* **IOC Management:** Add, edit, and color-code Indicators of Compromise.
* **Visual Timeline:** Drag-and-drop chronological event builder.

### 🤖 AI-Powered Assistant (Gemini 2.5 Flash)
* **Threat Assessment:** Estimates Threat Level (Low to Critical) based on current findings.
* **Gap Analysis:** Identifies missing forensic steps or incomplete data.
* **Executive Summaries:** Auto-generates summaries from technical notes.
* **Smart Timeline Merging:** Merges manual timeline events with technical findings into a single narrative.

### 📤 Reporting
* **Formats:** Export to PDF, DOCX, TXT, CSV, or JSON.
* **Modular:** Export specific sections (IOCs only, Timeline only) or the full case.
* **AI Polish:** "Clean" raw notes into professional forensic statements before export.

---

## 🛠️ Technology Stack

* **Frontend:** React 19, TypeScript, Tailwind CSS
* **State/Storage:** Dexie.js (IndexedDB wrapper)
* **AI:** Google GenAI SDK (Gemini 2.5 Flash)
* **Icons:** Lucide React
* **PDF Generation:** jsPDF

---

## 🔒 Privacy & Offline Capability

**1. Local-First Design:**
No case data is sent to any server during standard operation. All case details, notes, and IOCs reside strictly on your local machine using browser storage.

**2. AI usage:**
Data is only transmitted when you explicitly click **"AI Analysis"** or **"Export with AI"**. In these instances, relevant case text is sent to the Google Gemini API for processing and returned immediately.

**3. Offline Mode:**
The application works fully offline for documentation, manual analysis, and reporting (excluding AI features).

-----

## 📦 Installation & Setup

### 1. Clone the repository
```bash
git clone [https://github.com/yourusername/lets-do-it-windows.git](https://github.com/yourusername/lets-do-it-windows.git)
cd lets-do-it-windows
````

### 2\. Install dependencies

```bash
npm install
```

### 3\. Choose your AI Backend

#### Option A: Standard Setup (Google Gemini Cloud)

*Best for easy setup and high-quality responses.*

1.  Get an API Key from [Google AI Studio](https://aistudio.google.com/).
2.  Create a `.env` file in the root directory:
    ```env
    REACT_APP_GEMINI_API_KEY=your_api_key_here
    ```

#### Option B: Offline / Local LLM Setup (Privacy Focused)

*Best for air-gapped environments, strict data sovereignty, or zero-trust networks.*

You can replace the Google Gemini backend with a local LLM (e.g., **Llama 3**, **Mistral**, or **DeepSeek**) running via **Open WebUI** or **Ollama**. This ensures no data ever leaves your machine.

This requires a slight code refactor to switch from the Google SDK to an OpenAI-compatible endpoint.

**Quick Summary of Changes:**

1.  Replace `@google/genai` with the `openai` npm package.
2.  Point your environment variables to your local server (e.g., `http://localhost:3000/api/v1`).
3.  Update `geminiService.ts` to generic chat completions.

👉 **[Read the full Step-by-Step Migration Guide here](https://github.com/Yuval123malki/Lets-Do-It-Windows/blob/main/OFFLINE_DEPLOYMENT.md)**

### 4\. Run the application

```bash
npm start
```

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) to view it in the browser.

-----

## 🤝 Contributing

Contributions are welcome\! Please feel free to submit a Pull Request.
