import React, { useState, useEffect } from 'react';
import { Phase, CaseData } from '../types';
import { ShieldAlert, Cpu, Bug, Download, Home, Layers, Calendar, Target, User, Search, Play, Code, ChevronDown, ChevronRight, FileText, CheckCircle, XCircle } from 'lucide-react';

interface SidebarProps {
  currentPhase: Phase;
  setPhase: (phase: Phase) => void;
  completedStepsCount: number;
  totalStepsCount: number;
  activeCase: CaseData | null;
  onStatusChange: (status: 'Open' | 'Closed') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPhase, setPhase, completedStepsCount, totalStepsCount, activeCase, onStatusChange }) => {
  
  const malwarePhases = [Phase.MALWARE_STATIC, Phase.MALWARE_DYNAMIC, Phase.MALWARE_REVERSING];
  const isMalwareActive = malwarePhases.includes(currentPhase);
  
  const [isMalwareExpanded, setIsMalwareExpanded] = useState(isMalwareActive);

  useEffect(() => {
    if (isMalwareActive) {
      setIsMalwareExpanded(true);
    }
  }, [currentPhase, isMalwareActive]);

  const isPhaseVisible = (phase: Phase) => {
    if (!activeCase) return false;
    if (phase === Phase.AI_REPORT || phase === Phase.EXPORT || phase === Phase.ANALYST_PAGE) return true;
    return activeCase.includedPhases.includes(phase);
  };

  const isMalwareGroupVisible = activeCase?.includedPhases.some(p => malwarePhases.includes(p));
  const progress = totalStepsCount > 0 ? Math.round((completedStepsCount / totalStepsCount) * 100) : 0;

  const handleMalwareGroupClick = () => {
    setIsMalwareExpanded(!isMalwareExpanded);
    if (!isMalwareExpanded && !isMalwareActive) {
       setPhase(Phase.MALWARE_STATIC);
    }
  };

  return (
    <div className="w-72 bg-slate-900 border-r border-slate-800 h-screen flex flex-col fixed left-0 top-0 overflow-hidden shadow-2xl z-20">
      {/* App Header - Clickable */}
      <div 
        onClick={() => setPhase(Phase.DASHBOARD)}
        className="p-5 border-b border-slate-800 flex items-center space-x-3 bg-slate-950 cursor-pointer group transition-colors hover:bg-slate-900"
      >
        <ShieldAlert className="text-cyan-400 group-hover:text-cyan-300 transition-colors" size={28} />
        <div>
          <h1 className="font-bold text-white text-base tracking-tight group-hover:text-cyan-100 transition-colors">Lets Do It Windows</h1>
          <p className="text-[10px] text-slate-500 font-mono tracking-wider group-hover:text-slate-400">FORENSICS ASSISTANT</p>
        </div>
      </div>

      {/* Persistent Status Bar */}
      {activeCase && (
          <div className="bg-slate-800/50 p-4 border-b border-slate-700/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-slate-300">
                    <span className="font-bold text-white bg-cyan-900/50 px-2 py-0.5 rounded border border-cyan-800/50 font-mono">
                        {activeCase.caseId}
                    </span>
                </div>
                
                {/* Status Toggle */}
                <select 
                    value={activeCase.status} 
                    onChange={(e) => onStatusChange(e.target.value as 'Open' | 'Closed')}
                    className={`text-xs font-bold rounded px-2 py-0.5 border outline-none cursor-pointer ${
                        activeCase.status === 'Open' 
                        ? 'bg-emerald-900/50 text-emerald-400 border-emerald-700' 
                        : 'bg-slate-700 text-slate-400 border-slate-600'
                    }`}
                >
                    <option value="Open">OPEN</option>
                    <option value="Closed">CLOSED</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 gap-2 text-[11px] text-slate-400">
                 <div className="flex items-center">
                    <User size={12} className="mr-2 text-cyan-500/70" />
                    <span className="truncate">{activeCase.analystName}</span>
                 </div>
                 <div className="flex items-center">
                    <Calendar size={12} className="mr-2 text-cyan-500/70" />
                    <span>{new Date(activeCase.createdAt).toLocaleDateString()}</span>
                 </div>
                 <div className="flex items-center">
                    <Target size={12} className="mr-2 text-cyan-500/70" />
                    <span className="truncate text-cyan-300">{activeCase.scope}</span>
                 </div>
              </div>

              <div className="pt-2">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-mono uppercase">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-cyan-500 h-1.5 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(6,182,212,0.5)]" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
          </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
         <button
            onClick={() => setPhase(Phase.DASHBOARD)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              currentPhase === Phase.DASHBOARD
                ? 'bg-slate-800 text-white shadow-lg shadow-black/20'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <Home size={18} />
            <span>Dashboard</span>
          </button>

        {activeCase && (
            <div className="pt-4 space-y-1">
                <p className="px-4 pb-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Modules</p>
                
                {/* Analyst Page */}
                <button
                    onClick={() => setPhase(Phase.ANALYST_PAGE)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPhase === Phase.ANALYST_PAGE
                        ? 'bg-gradient-to-r from-purple-900/30 to-transparent text-purple-400 border-l-2 border-purple-500'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-2 border-transparent'
                    }`}
                >
                    <FileText size={20} />
                    <span>Analyst Page</span>
                </button>

                {/* 1. Deep OS & Artifacts */}
                {isPhaseVisible(Phase.OS_ARTIFACTS_MERGED) && (
                  <button
                      onClick={() => setPhase(Phase.OS_ARTIFACTS_MERGED)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      currentPhase === Phase.OS_ARTIFACTS_MERGED
                          ? 'bg-gradient-to-r from-cyan-900/30 to-transparent text-cyan-400 border-l-2 border-cyan-500'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-2 border-transparent'
                      }`}
                  >
                      <Layers size={20} />
                      <span>Deep OS & Artifacts</span>
                  </button>
                )}

                {/* 2. Memory Analysis */}
                {isPhaseVisible(Phase.MEMORY) && (
                  <button
                      onClick={() => setPhase(Phase.MEMORY)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      currentPhase === Phase.MEMORY
                          ? 'bg-gradient-to-r from-cyan-900/30 to-transparent text-cyan-400 border-l-2 border-cyan-500'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-2 border-transparent'
                      }`}
                  >
                      <Cpu size={20} />
                      <span>Memory Analysis</span>
                  </button>
                )}

                {/* 3. Malware Analysis Group */}
                {isMalwareGroupVisible && (
                  <div className="space-y-1">
                     <button
                        onClick={handleMalwareGroupClick}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isMalwareActive
                            ? 'text-cyan-400 bg-slate-800/30' 
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                        }`}
                     >
                        <div className="flex items-center space-x-3">
                            <Bug size={20} />
                            <span>Malware Analysis</span>
                        </div>
                        {isMalwareExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                     </button>

                     {isMalwareExpanded && (
                       <div className="ml-4 pl-4 border-l border-slate-800 space-y-1 animate-in slide-in-from-top-2 duration-200">
                          {isPhaseVisible(Phase.MALWARE_STATIC) && (
                            <button
                                onClick={() => setPhase(Phase.MALWARE_STATIC)}
                                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                                currentPhase === Phase.MALWARE_STATIC
                                    ? 'bg-cyan-900/20 text-cyan-400'
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                <Search size={16} />
                                <span>3.1 Static</span>
                            </button>
                          )}
                          {isPhaseVisible(Phase.MALWARE_DYNAMIC) && (
                            <button
                                onClick={() => setPhase(Phase.MALWARE_DYNAMIC)}
                                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                                currentPhase === Phase.MALWARE_DYNAMIC
                                    ? 'bg-cyan-900/20 text-cyan-400'
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                <Play size={16} />
                                <span>3.2 Dynamic</span>
                            </button>
                          )}
                          {isPhaseVisible(Phase.MALWARE_REVERSING) && (
                            <button
                                onClick={() => setPhase(Phase.MALWARE_REVERSING)}
                                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                                currentPhase === Phase.MALWARE_REVERSING
                                    ? 'bg-cyan-900/20 text-cyan-400'
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                <Code size={16} />
                                <span>3.3 Reversing</span>
                            </button>
                          )}
                       </div>
                     )}
                  </div>
                )}
            </div>
        )}
      </div>

      {/* Footer Actions */}
      {activeCase && (
          <div className="p-4 border-t border-slate-800 bg-slate-900 space-y-2">
             <button
                onClick={() => setPhase(Phase.AI_REPORT)}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg ${
                   currentPhase === Phase.AI_REPORT 
                   ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-500/30'
                   : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-indigo-500/25 hover:scale-[1.02]'
                }`}
              >
                <span>AI Assistant</span>
              </button>
              
              <button
                onClick={() => setPhase(Phase.EXPORT)}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                   currentPhase === Phase.EXPORT
                   ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/20'
                   : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Download size={16} />
                <span>Export Report</span>
              </button>
          </div>
      )}
    </div>
  );
};

export default Sidebar;