
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
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

export const analyzeCase = async (caseData: CaseData): Promise<any> => {

  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("API Key is missing. Please set VITE_GEMINI_API_KEY in .env");
  }

  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

  
  try {
    const prompt = buildPrompt(caseData);
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) return null;

    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const generateFinalReport = async (caseData: CaseData): Promise<string> => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
  throw new Error("API Key is missing. Please set VITE_GEMINI_API_KEY in .env");
}

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });


  const findingsList = Object.entries(caseData.findings).map(([stepId, finding]) => {
    const step = FORENSIC_STEPS.find(s => s.id === stepId);
    return `Step: ${step ? step.title : stepId}\nRaw Findings: ${finding}`;
  }).join('\n\n');

  const { tasks, timeline, iocs } = formatAnalystData(caseData.analystData);

  const prompt = `
  Act as a Forensic Report Editor. You are generating the final report for Case ${caseData.caseId}.
  
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
  1. "Clean" the analysis: Rewrite the findings to be professional, concise, and grammatically correct forensic statements.
  2. Auto-generate a Chronological Timeline: Extract ALL timestamps mentioned in the Technical Findings or Analyst Notes AND include the Manual Timeline Events provided above. Merge them into a single chronological sequence.
  3. Output a standard Markdown report structure.

  FORMAT:
  # Forensic Investigation Report: ${caseData.caseId}
  ## Executive Summary
  (Synthesize findings and notes)
  
  ## Investigation Details
  ### Analyst Notes
  (Cleaned version)
  ### Indicators of Compromise
  (Cleaned list)
  ### Task Completion Status
  (Summary of completed vs pending tasks)

  ## Comprehensive Timeline
  | Timestamp | Event | Source |
  | --- | --- | --- |
  (Extracted events merged with manual events)

  ## Technical Analysis
  (Iterate through findings, cleaned and formatted)
  
  ## Conclusion & Recommendations
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Failed to generate report.";
  } catch (error) {
    console.error("Gemini Export Error:", error);
    return "Error generating AI report.";
  }
};
