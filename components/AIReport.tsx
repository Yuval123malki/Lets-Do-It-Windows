
import React, { useState, useEffect } from 'react';
import { CaseData } from '../types';
import { analyzeCase } from '../services/geminiService';
import { Bot, AlertTriangle, CheckCircle, Activity, ArrowRight, RefreshCw } from 'lucide-react';

interface AIReportProps {
  caseData: CaseData;
  onSaveReport: (report: any) => void;
}

const AIReport: React.FC<AIReportProps> = ({ caseData, onSaveReport }) => {
  const [report, setReport] = useState<any>(caseData.aiReport);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync internal state if caseData changes (e.g. loaded from storage)
  useEffect(() => {
    setReport(caseData.aiReport);
  }, [caseData.aiReport]);

  const handleAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeCase(caseData);
      setReport(result);
      onSaveReport(result); // Persist to parent/storage
    } catch (err) {
      setError("Failed to generate analysis. Check API Key configuration.");
    } finally {
      setLoading(false);
    }
  };

  const getThreatColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'critical': return 'text-red-500 border-red-500/50 bg-red-500/10';
      case 'high': return 'text-orange-500 border-orange-500/50 bg-orange-500/10';
      case 'medium': return 'text-yellow-500 border-yellow-500/50 bg-yellow-500/10';
      case 'low': return 'text-emerald-500 border-emerald-500/50 bg-emerald-500/10';
      default: return 'text-slate-400 border-slate-700 bg-slate-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-2xl p-8 text-center relative overflow-hidden">
        <Bot size={48} className="mx-auto text-indigo-400 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Gemini AI Assistant</h2>
        <p className="text-slate-300 mb-6 max-w-xl mx-auto">
            The AI analyzes your findings, analyst notes, and timeline to provide a threat assessment and gap analysis.
        </p>
        
        <button
            onClick={handleAnalysis}
            disabled={loading}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 flex items-center mx-auto hover:scale-105"
        >
            {loading ? (
                <>
                <RefreshCw className="animate-spin mr-2" size={18} />
                Analyzing Evidence...
                </>
            ) : (
                <>
                {report ? <RefreshCw className="mr-2" size={18}/> : null}
                {report ? 'Re-Analyze Case Data' : 'Generate Investigation Report'}
                </>
            )}
        </button>
        
        {error && <div className="mt-4 text-red-400 bg-red-950/30 p-3 rounded border border-red-900/50">{error}</div>}
      </div>

      {report && (
        <div className="space-y-6">
          {/* Executive Summary & Threat Level */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <Activity className="mr-2 text-cyan-400" size={20}/> Executive Summary
                </h3>
                <p className="text-slate-300 leading-relaxed text-sm">{report.summary}</p>
            </div>
            <div className={`border rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-xl ${getThreatColor(report.threatLevel)}`}>
                <span className="text-sm uppercase tracking-widest font-bold opacity-80 mb-2">Threat Level</span>
                <span className="text-3xl font-black">{report.threatLevel}</span>
            </div>
          </div>

          {/* Indicators */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
             <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <AlertTriangle className="mr-2 text-amber-400" size={20}/> Key Indicators of Compromise (IOCs)
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.keyIndicators?.map((ioc: string, idx: number) => (
                    <li key={idx} className="bg-slate-950 p-3 rounded border border-slate-800 text-sm font-mono text-amber-100/80 break-all border-l-4 border-l-amber-500/50">
                        {ioc}
                    </li>
                ))}
                {(!report.keyIndicators || report.keyIndicators.length === 0) && <li className="text-slate-500 italic">No specific IOCs identified yet.</li>}
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Gap Analysis */}
             <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <AlertTriangle className="mr-2 text-red-400" size={20}/> Gap Analysis
                </h3>
                <ul className="space-y-2">
                    {report.gapAnalysis?.map((gap: string, idx: number) => (
                        <li key={idx} className="text-slate-300 text-sm flex items-start">
                             <span className="mr-2 text-red-500">•</span> {gap}
                        </li>
                    ))}
                     {(!report.gapAnalysis || report.gapAnalysis.length === 0) && <li className="text-slate-500 italic">No significant forensic gaps found.</li>}
                </ul>
             </div>

             {/* Recommendations */}
             <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <CheckCircle className="mr-2 text-emerald-400" size={20}/> Recommended Next Steps
                </h3>
                <ul className="space-y-3">
                    {report.recommendations?.map((rec: string, idx: number) => (
                        <li key={idx} className="text-slate-300 text-sm flex items-start bg-slate-800/50 p-2 rounded">
                            <ArrowRight size={14} className="mr-2 mt-1 text-emerald-500 flex-shrink-0"/> {rec}
                        </li>
                    ))}
                </ul>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIReport;
