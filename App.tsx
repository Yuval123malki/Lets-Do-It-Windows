import React, { useState, useMemo, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import StepCard from './components/StepCard';
import AIReport from './components/AIReport';
import ScopeSelection from './components/ScopeSelection';
import AnalystPage from './components/AnalystPage';
import { Phase, CaseData, ScopeProfile, AnalystData } from './types';
import { FORENSIC_STEPS } from './constants';
import { generateFinalReport } from './services/geminiService';
import { Terminal, Save, Plus, Folder, ArrowRight, ChevronDown, Check, Bot, FileText, FileJson, FileSpreadsheet, File, FileType, Filter } from 'lucide-react';
import { jsPDF } from 'jspdf';

// Database Imports
import { db, migrateFromLocalStorage } from './db';
import { useLiveQuery } from 'dexie-react-hooks';

// Helper for unique values
const getUniqueValues = (data: any[], key: string) => {
    const counts: Record<string, number> = {};
    data.forEach(item => {
        const val = String(item[key]);
        counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts).map(([value, count]) => ({ value, count }));
};

const App: React.FC = () => {
  // --- DATABASE & STATE MANAGEMENT ---
  
  // 1. Migrate data on mount (one-time check)
  useEffect(() => {
    migrateFromLocalStorage();
  }, []);

  // 2. Fetch cases from IndexedDB using useLiveQuery
  // This automatically updates the component when the DB changes.
  const cases = useLiveQuery(() => db.cases.toArray()) ?? [];

  // Global State
  const [phase, setPhase] = useState<Phase>(Phase.DASHBOARD);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);

  // Sorting & Filtering State
  const [sortConfig, setSortConfig] = useState<{ key: keyof CaseData; direction: 'asc' | 'desc' } | null>({ key: 'createdAt', direction: 'desc' });
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  // Export State
  const [isExportingAI, setIsExportingAI] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportSource, setExportSource] = useState<'standard' | 'ai' | null>(null);

  // New Case Form State
  const [newCaseId, setNewCaseId] = useState('');
  const [newAnalystName, setNewAnalystName] = useState('');
  const [showNewCaseForm, setShowNewCaseForm] = useState(false);

  // Click outside listener for dropdowns
  const filterMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
            setActiveFilterColumn(null);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Computed: Active Case
  const activeCase = useMemo(() => 
    cases.find(c => c.id === activeCaseId) || null, 
  [cases, activeCaseId]);

  // --- HANDLERS (Async DB Operations) ---

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCaseId && newAnalystName) {
      const newCase: CaseData = {
        id: crypto.randomUUID(),
        caseId: newCaseId,
        analystName: newAnalystName,
        findings: {},
        stepData: {}, 
        analystData: {
            notes: '',
            tasks: [],
            iocs: [],
            timeline: []
        },
        aiReport: null,
        createdAt: Date.now(),
        scope: '', // Will be set in Scope Selection
        status: 'Open',
        includedPhases: []
      };
      
      try {
        await db.cases.add(newCase);
        setActiveCaseId(newCase.id);
        setPhase(Phase.SCOPE_SELECTION);
        setNewCaseId('');
        setNewAnalystName('');
        setShowNewCaseForm(false);
      } catch (error) {
        console.error("Failed to create case:", error);
      }
    }
  };

  const handleScopeSelect = async (selectedProfiles: string[], customKeywords?: string) => {
    if (!activeCaseId) return;

    let phases = new Set<Phase>();
    
    // Multi-Select Logic
    if (selectedProfiles.includes('Full Forensics')) {
        phases.add(Phase.OS_ARTIFACTS_MERGED);
        phases.add(Phase.MEMORY);
        phases.add(Phase.MALWARE_STATIC);
        phases.add(Phase.MALWARE_DYNAMIC);
        phases.add(Phase.MALWARE_REVERSING);
    } else {
        if (selectedProfiles.includes('OS & Artifacts')) phases.add(Phase.OS_ARTIFACTS_MERGED);
        if (selectedProfiles.includes('Memory Forensics')) phases.add(Phase.MEMORY);
        if (selectedProfiles.includes('Malware Analysis')) {
            phases.add(Phase.MALWARE_STATIC);
            phases.add(Phase.MALWARE_DYNAMIC);
            phases.add(Phase.MALWARE_REVERSING);
        }
        if (selectedProfiles.includes('Custom')) {
             phases.add(Phase.OS_ARTIFACTS_MERGED);
             phases.add(Phase.MEMORY);
             phases.add(Phase.MALWARE_STATIC);
             phases.add(Phase.MALWARE_DYNAMIC);
             phases.add(Phase.MALWARE_REVERSING);
        }
    }

    const phasesArray = Array.from(phases);
    
    // Construct display scope string
    let scopeDisplay = selectedProfiles.filter(p => p !== 'Custom').join(' + ');
    if (customKeywords) {
        scopeDisplay += scopeDisplay ? ` (+ Custom: ${customKeywords})` : `Custom: ${customKeywords}`;
    }

    try {
        await db.cases.update(activeCaseId, {
            scope: scopeDisplay,
            customKeywords: customKeywords,
            includedPhases: phasesArray
        });

        // Navigate to first included phase
        if (phasesArray.length > 0) {
            setPhase(phasesArray[0]);
        } else {
            setPhase(Phase.DASHBOARD);
        }
    } catch (error) {
        console.error("Failed to update scope:", error);
    }
  };

  const updateFinding = async (stepId: string, content: string) => {
    if (!activeCaseId || !activeCase) return;
    
    const updatedFindings = {
        ...activeCase.findings,
        [stepId]: content
    };

    try {
        await db.cases.update(activeCaseId, { findings: updatedFindings });
    } catch (error) {
        console.error("Failed to update findings:", error);
    }
  };

  const updateStepData = async (stepId: string, data: any) => {
      if (!activeCaseId || !activeCase) return;
      
      const updatedStepData = {
          ...activeCase.stepData,
          [stepId]: data
      };

      try {
          await db.cases.update(activeCaseId, { stepData: updatedStepData });
      } catch (error) {
          console.error("Failed to update step data:", error);
      }
  };

  const updateAnalystData = async (data: AnalystData) => {
     if (!activeCaseId) return;
     try {
         await db.cases.update(activeCaseId, { analystData: data });
     } catch (error) {
         console.error("Failed to update analyst data:", error);
     }
  };

  const updateStatus = async (status: 'Open' | 'Closed') => {
      if (!activeCaseId) return;
      try {
          await db.cases.update(activeCaseId, { status });
      } catch (error) {
          console.error("Failed to update status:", error);
      }
  };

  const saveAIReport = async (report: any) => {
    if (!activeCaseId) return;
    try {
        await db.cases.update(activeCaseId, { aiReport: report });
    } catch (error) {
        console.error("Failed to save AI report:", error);
    }
  };

  // --- EXPORT LOGIC ---
  const generateExportContent = () => {
    if (!activeCase) return '';

    const tasksStr = activeCase.analystData.tasks.length > 0 
        ? activeCase.analystData.tasks.map(t => `- [${t.completed ? 'X' : ' '}] ${t.text}`).join('\n')
        : 'N/A';
    
    const timelineStr = activeCase.analystData.timeline.length > 0
        ? activeCase.analystData.timeline.map(t => `${t.date} ${t.time} - ${t.description}`).join('\n')
        : 'N/A';

    const iocStr = activeCase.analystData.iocs.length > 0
        ? activeCase.analystData.iocs.map(i => `- ${i.text}`).join('\n')
        : 'N/A';

    let exportText = `# Forensic Investigation Report\n`;
    exportText += `**Case ID:** ${activeCase.caseId}\n`;
    exportText += `**Analyst:** ${activeCase.analystName}\n`;
    exportText += `**Date:** ${new Date().toLocaleDateString()}\n`;
    exportText += `**Scope:** ${activeCase.scope}\n`;
    exportText += `**Status:** ${activeCase.status}\n\n`;

    exportText += `## Analyst Overview\n`;
    exportText += `### Notes\n${activeCase.analystData?.notes || 'N/A'}\n\n`;
    exportText += `### Tasks\n${tasksStr}\n\n`;
    exportText += `### Indicators of Compromise (IOCs)\n${iocStr}\n\n`;
    exportText += `### Timeline (Manual)\n${timelineStr}\n\n`;

    const phases = activeCase.includedPhases;
    phases.forEach(p => {
        let phaseTitle = getPhaseTitle(p);
        exportText += `## ${phaseTitle}\n\n`;
        const steps = getFilteredSteps(p);
        
        if (steps.length === 0) {
            exportText += `_No steps in scope for this phase._\n\n`;
        } else {
            steps.forEach(step => {
                const finding = activeCase.findings[step.id];
                const stepSpecificData = activeCase.stepData?.[step.id];
                
                let extraDataString = '';
                if (step.id === 'ma_general' && stepSpecificData?.fileList?.length > 0) {
                    extraDataString = '\n**Additional Files/Hashes:**\n' + 
                    stepSpecificData.fileList.map((f: any) => `- ${f.fileName}: ${f.hash}`).join('\n') + '\n';
                }

                if ((finding && finding.trim()) || extraDataString) {
                    exportText += `### ${step.title}\n`;
                    exportText += `*Tool used: ${step.tool || 'N/A'}*\n`;
                    if (finding && finding.trim()) {
                        exportText += `> ${finding.replace(/\n/g, '\n> ')}\n`;
                    }
                    if (extraDataString) {
                        exportText += `\n${extraDataString}\n`;
                    }
                    exportText += `\n`;
                }
            });
        }
    });
    return exportText;
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportOptions(false);
  };

  const executeExport = async (format: 'csv' | 'txt' | 'docx' | 'pdf' | 'json') => {
      if (!activeCase) return;

      let content = '';
      let filename = `CASE_${activeCase.caseId}_REPORT`;
      
      // Determine Source Content
      if (exportSource === 'ai') {
          setIsExportingAI(true);
          try {
             content = await generateFinalReport(activeCase);
             filename += '_AI';
          } catch (e) {
              alert("Failed to generate AI report");
              setIsExportingAI(false);
              return;
          } finally {
              setIsExportingAI(false);
          }
      } else {
          content = generateExportContent();
      }

      // Handle Formats
      switch (format) {
          case 'json': {
              const data = exportSource === 'ai' 
                  ? { ...activeCase, aiAnalysis: content }
                  : activeCase;
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              downloadFile(blob, `${filename}.json`);
              break;
          }
          case 'csv': {
              // Flatten data for CSV
              let csvContent = "Category,Item,Value/Status\n";
              csvContent += `Case Info,ID,${activeCase.caseId}\n`;
              csvContent += `Case Info,Analyst,${activeCase.analystName}\n`;
              csvContent += `Case Info,Status,${activeCase.status}\n`;
              
              activeCase.analystData.tasks.forEach(t => {
                  csvContent += `Task,${t.text.replace(/,/g, ' ')},${t.completed ? 'Done' : 'Pending'}\n`;
              });
              
              activeCase.analystData.iocs.forEach(i => {
                  csvContent += `IOC,${i.text.replace(/,/g, ' ')},Detected\n`;
              });
              
              activeCase.analystData.timeline.forEach(t => {
                  csvContent += `Timeline,${t.date} ${t.time},${t.description.replace(/,/g, ' ')}\n`;
              });

              Object.entries(activeCase.findings).forEach(([key, val]) => {
                 const value = val as string;
                 if(value.trim()) csvContent += `Finding,${key},"${value.replace(/"/g, '""')}"\n`;
              });
              
              // Include Step Data in CSV
              if (activeCase.stepData?.ma_general?.fileList) {
                  activeCase.stepData.ma_general.fileList.forEach((f: any) => {
                      csvContent += `Static Analysis,${f.fileName},${f.hash}\n`;
                  });
              }
              
              const blob = new Blob([csvContent], { type: 'text/csv' });
              downloadFile(blob, `${filename}.csv`);
              break;
          }
          case 'txt': {
              const blob = new Blob([content], { type: 'text/plain' });
              downloadFile(blob, `${filename}.txt`);
              break;
          }
          case 'docx': {
             // Generate HTML compliant with Word (MIME trick)
             const html = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                <head><meta charset='utf-8'><title>Report</title></head>
                <body>
                    <div style="font-family: Arial, sans-serif; white-space: pre-wrap;">
                        ${content.replace(/\n/g, '<br/>').replace(/# (.*)/g, '<h1>$1</h1>').replace(/## (.*)/g, '<h2>$1</h2>').replace(/### (.*)/g, '<h3>$1</h3>').replace(/\*\*(.*)\*\*/g, '<b>$1</b>')}
                    </div>
                </body>
                </html>
             `;
             const blob = new Blob([html], { type: 'application/msword' });
             downloadFile(blob, `${filename}.doc`);
             break;
          }
          case 'pdf': {
             const doc = new jsPDF();
             doc.setFont("courier");
             doc.setFontSize(10);
             
             // Split text to fit page width
             const splitText = doc.splitTextToSize(content, 180);
             
             let cursorY = 10;
             const pageHeight = 280;
             
             splitText.forEach((line: string) => {
                 if (cursorY > pageHeight) {
                     doc.addPage();
                     cursorY = 10;
                 }
                 doc.text(line, 10, cursorY);
                 cursorY += 5;
             });
             
             doc.save(`${filename}.pdf`);
             setShowExportOptions(false);
             break;
          }
      }
  };

  const openExportMenu = (type: 'standard' | 'ai') => {
      setExportSource(type);
      setShowExportOptions(true);
  };

  // --- FILTERING & SORTING LOGIC (Applied to the live cases data) ---
  const handleSort = (key: keyof CaseData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleFilter = (column: string, value: string) => {
      setFilters(prev => {
          const current = prev[column] || [];
          const updated = current.includes(value) 
              ? current.filter(v => v !== value)
              : [...current, value];
          
          if (updated.length === 0) {
              const { [column]: _, ...rest } = prev;
              return rest;
          }
          return { ...prev, [column]: updated };
      });
  };

  const clearFilter = (column: string) => {
      setFilters(prev => {
          const { [column]: _, ...rest } = prev;
          return rest;
      });
  };

  const processedCases = useMemo(() => {
    if (!cases) return [];
    let result = [...cases];

    // Apply Filters
    Object.keys(filters).forEach(key => {
        const allowedValues = filters[key];
        if (allowedValues && allowedValues.length > 0) {
            result = result.filter(item => {
                // @ts-ignore - dynamic access
                const itemVal = String(item[key]);
                return allowedValues.includes(itemVal);
            });
        }
    });

    // Apply Sort
    if (sortConfig !== null) {
      result.sort((a, b) => {
        // @ts-ignore
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        // @ts-ignore
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return result;
  }, [cases, sortConfig, filters]);

  // Logic to filter steps based on Phase AND Custom Keywords
  const getFilteredSteps = (currentPhase: Phase) => {
    if (!activeCase) return [];
    let steps = FORENSIC_STEPS.filter(step => step.phase === currentPhase);
    
    // Custom Keyword Filtering
    if (activeCase.scope.includes('Custom') && activeCase.customKeywords) {
        const keywords = activeCase.customKeywords.toLowerCase().split(',').map(k => k.trim());
        steps = steps.filter(step => {
            return keywords.some(k => 
                step.title.toLowerCase().includes(k) || 
                step.tool?.toLowerCase().includes(k) ||
                step.id.includes(k)
            );
        });
    }
    return steps;
  };

  // Skip Phase Logic
  const handleSkipPhase = () => {
    if (!activeCase) return;
    const currentIdx = activeCase.includedPhases.indexOf(phase);
    if (currentIdx !== -1 && currentIdx < activeCase.includedPhases.length - 1) {
        setPhase(activeCase.includedPhases[currentIdx + 1]);
    } else {
        // If last phase, go to Report
        setPhase(Phase.AI_REPORT);
    }
  };

  const currentSteps = useMemo(() => getFilteredSteps(phase), [phase, activeCase]);
  const completedCount = activeCase ? Object.keys(activeCase.findings).filter(k => activeCase.findings[k]?.trim().length > 0).length : 0;
  
  const totalScopeSteps = useMemo(() => {
      if (!activeCase) return 0;
      let count = 0;
      activeCase.includedPhases.forEach(p => {
          count += getFilteredSteps(p).length;
      });
      return count;
  }, [activeCase]);

  // Phase Title Map
  const getPhaseTitle = (p: Phase) => {
      if (p === Phase.OS_ARTIFACTS_MERGED) return 'Phase 1: Deep OS & Artifacts';
      if (p === Phase.MEMORY) return 'Phase 2: Memory Analysis';
      if (p === Phase.MALWARE_STATIC) return 'Phase 3.1: Static Analysis';
      if (p === Phase.MALWARE_DYNAMIC) return 'Phase 3.2: Dynamic Analysis';
      if (p === Phase.MALWARE_REVERSING) return 'Phase 3.3: Reverse Engineering';
      if (p === Phase.ANALYST_PAGE) return 'Analyst Notes & Timeline';
      return (p as string).replace('_', ' ');
  };


  // --- RENDER: SCOPE SELECTION ---
  if (phase === Phase.SCOPE_SELECTION) {
      return (
        <div className="flex min-h-screen bg-slate-950 text-slate-200 font-sans">
             <Sidebar 
                currentPhase={phase} 
                setPhase={setPhase} 
                completedStepsCount={0}
                totalStepsCount={0}
                activeCase={activeCase}
                onStatusChange={() => {}}
            />
            <ScopeSelection onSelect={handleScopeSelect} />
        </div>
      );
  }

  // --- RENDER: DASHBOARD ---
  if (phase === Phase.DASHBOARD) {
      return (
        <div className="flex min-h-screen bg-slate-950 text-slate-200 font-sans">
             <Sidebar 
                currentPhase={phase} 
                setPhase={setPhase} 
                completedStepsCount={completedCount}
                totalStepsCount={totalScopeSteps}
                activeCase={activeCase}
                onStatusChange={() => {}}
            />
            <main className="flex-1 ml-72 p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-12 flex items-center justify-between">
                        <div>
                            <div className="flex items-center space-x-4 mb-2">
                                <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl">
                                    <Terminal size={32} className="text-cyan-400" />
                                </div>
                                <h1 className="text-3xl font-bold text-white tracking-tight">Case Manager</h1>
                            </div>
                            <p className="text-slate-400 ml-16">Lets Do It Windows Dashboard</p>
                        </div>
                        <button 
                                onClick={() => setShowNewCaseForm(true)}
                                className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-lg font-semibold shadow-lg shadow-cyan-500/20 flex items-center transition-all hover:scale-105"
                            >
                                <Plus size={20} className="mr-2" /> Start New Case
                        </button>
                    </div>

                    {!showNewCaseForm ? (
                        <div className="space-y-6">
                             {/* Dashboard Table */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-visible shadow-xl relative min-h-[300px]">
                                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-xl">
                                    <h3 className="text-lg font-semibold text-white flex items-center">
                                        <Folder className="mr-2 text-slate-400" size={20} />
                                        Session Cases
                                    </h3>
                                    <div className="text-xs text-slate-500 font-mono">
                                        {processedCases.length} Record(s) Visible
                                    </div>
                                </div>
                                
                                {cases.length === 0 ? (
                                    <div className="p-12 text-center text-slate-500">
                                        No active cases found. Start a new case or import data.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm text-slate-400">
                                            <thead className="bg-slate-950 uppercase font-mono text-xs text-slate-500 border-b border-slate-800">
                                                <tr>
                                                    {['caseId', 'analystName', 'status', 'scope'].map((key) => (
                                                        <th key={key} className="px-6 py-4 relative group">
                                                            <div className="flex items-center space-x-2">
                                                                <span 
                                                                    onClick={() => handleSort(key as keyof CaseData)}
                                                                    className="cursor-pointer hover:text-white transition-colors"
                                                                >
                                                                    {key === 'caseId' ? 'Case ID' : key.charAt(0).toUpperCase() + key.slice(1)}
                                                                </span>
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveFilterColumn(activeFilterColumn === key ? null : key);
                                                                    }}
                                                                    className={`p-1 rounded hover:bg-slate-800 ${filters[key] ? 'text-cyan-400' : 'text-slate-600'}`}
                                                                >
                                                                    {filters[key] ? '🌪️' : <ChevronDown size={12} />}
                                                                </button>
                                                            </div>
                                                            {/* Filter Dropdown */}
                                                            {activeFilterColumn === key && (
                                                                <div 
                                                                    ref={filterMenuRef}
                                                                    className="absolute top-full left-0 mt-1 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-100"
                                                                >
                                                                    <div className="flex justify-between items-center mb-2 px-2 pb-2 border-b border-slate-700/50">
                                                                        <span className="text-xs font-bold text-white">Filter {key}</span>
                                                                        <button 
                                                                            onClick={() => clearFilter(key)}
                                                                            className="text-[10px] text-red-400 hover:text-red-300"
                                                                        >
                                                                            Clear
                                                                        </button>
                                                                    </div>
                                                                    <div className="max-h-48 overflow-y-auto space-y-1">
                                                                        {getUniqueValues(cases, key).map(({ value, count }) => (
                                                                            <button
                                                                                key={value}
                                                                                onClick={() => toggleFilter(key, value)}
                                                                                className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-700 flex items-center justify-between text-xs"
                                                                            >
                                                                                 <span className="flex items-center truncate max-w-[150px]">
                                                                                    <div className={`w-3 h-3 rounded border mr-2 flex items-center justify-center ${filters[key]?.includes(value) ? 'bg-cyan-600 border-cyan-500' : 'border-slate-500'}`}>
                                                                                        {filters[key]?.includes(value) && <Check size={8} className="text-white" />}
                                                                                    </div>
                                                                                    <span className="truncate">{value}</span>
                                                                                 </span>
                                                                                 <span className="text-slate-500 text-[10px]">({count})</span>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </th>
                                                    ))}
                                                    <th className="px-6 py-4 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800 bg-slate-900">
                                                {processedCases.map(c => (
                                                    <tr key={c.id} className={`hover:bg-slate-800/50 transition-colors ${activeCaseId === c.id ? 'bg-slate-800/30' : ''}`}>
                                                        <td className="px-6 py-4 font-bold text-white">{c.caseId}</td>
                                                        <td className="px-6 py-4">{c.analystName}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${c.status === 'Open' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-300'}`}>
                                                                {c.status.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                             <div className="max-w-[200px] truncate text-xs text-slate-400" title={c.scope}>
                                                                {c.scope}
                                                             </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button 
                                                                onClick={() => {
                                                                    setActiveCaseId(c.id);
                                                                    if (c.includedPhases.length > 0) {
                                                                        setPhase(c.includedPhases[0]);
                                                                    } else {
                                                                         setPhase(Phase.AI_REPORT);
                                                                    }
                                                                }}
                                                                className="text-cyan-400 hover:text-cyan-300 font-medium hover:underline flex items-center justify-end w-full"
                                                            >
                                                                Open <ArrowRight size={14} className="ml-1" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {processedCases.length === 0 && (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                                            No matches found for current filters.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                             <h2 className="text-2xl font-bold text-white mb-6">New Investigation</h2>
                             <form onSubmit={handleCreateCase} className="space-y-4">
                                <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Case ID</label>
                                <input 
                                    type="text" 
                                    required
                                    autoFocus
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                                    placeholder="INC-2024-001"
                                    value={newCaseId}
                                    onChange={(e) => setNewCaseId(e.target.value)}
                                />
                                </div>
                                <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Analyst Name</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                                    placeholder="J. Doe"
                                    value={newAnalystName}
                                    onChange={(e) => setNewAnalystName(e.target.value)}
                                />
                                </div>
                                <div className="flex space-x-3 mt-6">
                                    <button 
                                        type="button"
                                        onClick={() => setShowNewCaseForm(false)}
                                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 rounded-lg transition-colors"
                                    >
                                        Initialize
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </main>
        </div>
      );
  }

  // --- RENDER: MAIN APP ---
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200 font-sans">
      <Sidebar 
        currentPhase={phase} 
        setPhase={setPhase} 
        completedStepsCount={completedCount}
        totalStepsCount={totalScopeSteps}
        activeCase={activeCase}
        onStatusChange={updateStatus}
      />
      
      <main className="flex-1 ml-72 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-end mb-8 border-b border-slate-800 pb-4">
            <div>
                <h2 className="text-3xl font-bold text-white tracking-tight flex items-center">
                    {phase === Phase.AI_REPORT ? 'AI Analysis' : 
                     phase === Phase.EXPORT ? 'Export Report' : 
                     getPhaseTitle(phase)}
                </h2>
                <div className="flex items-center text-sm text-slate-400 mt-2 space-x-4">
                    <span className="flex items-center"><Terminal size={14} className="mr-1"/> Scope: {activeCase?.scope}</span>
                    {phase !== Phase.AI_REPORT && phase !== Phase.EXPORT && phase !== Phase.ANALYST_PAGE && (
                        <span className="flex items-center text-cyan-500"><Filter size={14} className="mr-1"/> Steps loaded: {currentSteps.length}</span>
                    )}
                </div>
            </div>
            
            {phase !== Phase.AI_REPORT && phase !== Phase.EXPORT && phase !== Phase.ANALYST_PAGE && (
                <button 
                    onClick={handleSkipPhase}
                    className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white px-4 py-2 rounded-lg border border-slate-800 transition-colors flex items-center"
                >
                    SKIP PHASE <ArrowRight size={12} className="ml-2" />
                </button>
            )}
          </div>

          {/* Content Views */}
          {phase === Phase.AI_REPORT && activeCase ? (
            <AIReport caseData={activeCase} onSaveReport={saveAIReport} />
          ) : phase === Phase.ANALYST_PAGE && activeCase ? (
            <AnalystPage 
                data={activeCase.analystData || { notes: '', tasks: [], iocs: [], timeline: []}}
                onChange={updateAnalystData}
            />
          ) : phase === Phase.EXPORT && activeCase ? (
             <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-xl relative">
                {!showExportOptions ? (
                    <>
                        <Save size={64} className="mx-auto text-emerald-500 mb-6" />
                        <h3 className="text-2xl font-bold text-white mb-4">Ready to Export</h3>
                        <p className="text-slate-400 mb-8 max-w-md mx-auto">
                            Select an export method below. You can generate a standard investigation report or use AI to refine your findings.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
                            <button 
                                onClick={() => openExportMenu('standard')}
                                className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-4 rounded-xl font-semibold transition-colors flex items-center justify-center border border-slate-700 hover:border-slate-600"
                            >
                                <Save size={20} className="mr-2" />
                                Standard Export
                            </button>
                            <button 
                                onClick={() => openExportMenu('ai')}
                                disabled={isExportingAI}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                            >
                                <Bot className="mr-2" />
                                Export with AI
                            </button>
                        </div>
                    </>
                ) : (
                     <div className="max-w-xl mx-auto animate-in fade-in zoom-in duration-200">
                        <button 
                             onClick={() => setShowExportOptions(false)}
                             className="absolute top-4 right-4 text-slate-500 hover:text-white"
                        >
                            Close
                        </button>
                        <h3 className="text-xl font-bold text-white mb-2">Select Export Format</h3>
                        <p className="text-slate-400 mb-6 text-sm">
                            {exportSource === 'ai' ? 'The AI will refine your findings before exporting.' : 'Exporting raw investigation data.'}
                        </p>
                        
                        {isExportingAI ? (
                            <div className="py-12 flex flex-col items-center">
                                <Bot className="animate-spin text-indigo-400 mb-4" size={48} />
                                <p className="text-indigo-300 animate-pulse">Generating AI Analysis & Timeline...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {[
                                    { id: 'csv', label: 'CSV', icon: <FileSpreadsheet className="text-emerald-400" size={24}/>, desc: 'Spreadsheet' },
                                    { id: 'json', label: 'JSON', icon: <FileJson className="text-amber-400" size={24}/>, desc: 'Raw Data' },
                                    { id: 'txt', label: 'TXT', icon: <FileText className="text-slate-400" size={24}/>, desc: 'Plain Text' },
                                    { id: 'docx', label: 'Word (DOC)', icon: <File className="text-blue-400" size={24}/>, desc: 'Microsoft Word' },
                                    { id: 'pdf', label: 'PDF', icon: <FileType className="text-red-400" size={24}/>, desc: 'Portable Doc' },
                                ].map((fmt) => (
                                    <button 
                                        key={fmt.id}
                                        onClick={() => executeExport(fmt.id as any)}
                                        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-4 flex flex-col items-center text-center transition-all hover:scale-105"
                                    >
                                        <div className="mb-2 bg-slate-900 p-3 rounded-full">{fmt.icon}</div>
                                        <span className="font-bold text-white text-sm">{fmt.label}</span>
                                        <span className="text-xs text-slate-500 mt-1">{fmt.desc}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                     </div>
                )}
             </div>
          ) : (
            <div className="space-y-6">
              {currentSteps.map(step => (
                <StepCard 
                  key={step.id} 
                  step={step} 
                  value={activeCase?.findings[step.id] || ''} 
                  onChange={(val) => updateFinding(step.id, val)}
                  data={activeCase?.stepData?.[step.id]}
                  onDataChange={(data) => updateStepData(step.id, data)}
                />
              ))}
              
              {currentSteps.length === 0 && (
                  <div className="p-12 text-center border border-dashed border-slate-800 rounded-xl">
                      <p className="text-slate-500 mb-4">No steps available for this phase based on your configured Scope.</p>
                      <button 
                        onClick={handleSkipPhase}
                        className="text-cyan-400 font-semibold hover:underline"
                      >
                        Proceed to Next Phase &rarr;
                      </button>
                  </div>
              )}

              {/* End of Phase Navigation */}
              {currentSteps.length > 0 && (
                  <div className="pt-8 flex justify-end">
                      <button
                        onClick={handleSkipPhase}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-cyan-900/20 transition-all hover:scale-105 flex items-center"
                      >
                        Next Phase <ArrowRight size={20} className="ml-2" />
                      </button>
                  </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;