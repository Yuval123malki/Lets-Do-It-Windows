
export enum Phase {
  DASHBOARD = 'DASHBOARD',
  SCOPE_SELECTION = 'SCOPE_SELECTION',
  ANALYST_PAGE = 'ANALYST_PAGE', // New Phase
  OS_ARTIFACTS_MERGED = 'OS_ARTIFACTS_MERGED', // Merged Phase 1
  MEMORY = 'MEMORY',
  MALWARE_STATIC = 'MALWARE_STATIC',     // Phase 3.1
  MALWARE_DYNAMIC = 'MALWARE_DYNAMIC',   // Phase 3.2
  MALWARE_REVERSING = 'MALWARE_REVERSING', // Phase 3.3
  AI_REPORT = 'AI_REPORT',
  EXPORT = 'EXPORT'
}

export interface ForensicStep {
  id: string;
  title: string;
  description: string; // From the PDF descriptions
  forensicValue: string[]; // Bullet points from "Forensic Value"
  location?: string; // "Location"
  tool?: string; // "Tool"
  phase: Phase;
  isReadOnly?: boolean; // For informational steps like checklists
}

// Relaxed to string to allow "OS & Artifacts + Malware Analysis" combinations
export type ScopeProfile = string; 

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TimelineEvent {
  id: string;
  date: string;
  time: string;
  description: string;
  color: string; // hex or tailwind class descriptor
}

export interface IOCItem {
  id: string;
  text: string;
  color: string;
}

export interface AnalystData {
  notes: string;
  tasks: TaskItem[];
  iocs: IOCItem[];
  timeline: TimelineEvent[];
}

export interface FileHashEntry {
  id: string;
  fileName: string;
  hash: string;
}

export interface CaseData {
  id: string; // Internal UUID
  caseId: string; // User provided ID (e.g. INC-123)
  analystName: string;
  findings: Record<string, string>; // stepId -> content
  stepData: Record<string, any>; // Structured data per step (e.g., ma_general file list)
  analystData: AnalystData; // New Analyst Page Data
  aiReport: any | null; // Persistent AI Report
  createdAt: number;
  scope: ScopeProfile;
  customKeywords?: string; // For Custom scope
  status: 'Open' | 'Closed'; // Updated Status
  includedPhases: Phase[]; // Derived from scope
}
