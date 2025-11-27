
import React, { useState } from 'react';
import { Target, Layers, Cpu, Bug, CheckCircle, Play } from 'lucide-react';
import { ScopeProfile } from '../types';

interface ScopeSelectionProps {
  onSelect: (scopes: ScopeProfile[]) => void;
}

const ScopeSelection: React.FC<ScopeSelectionProps> = ({ onSelect }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const profiles: { id: string; label: string; icon: React.ReactNode; desc: string }[] = [
    { 
      id: 'Full Forensics', 
      label: 'Full Forensics Suite', 
      icon: <Target className="text-cyan-400" size={24} />,
      desc: 'All Phases: OS, Artifacts, Memory, and Malware.'
    },
    { 
      id: 'OS & Artifacts', 
      label: 'OS & Artifacts Only', 
      icon: <Layers className="text-blue-400" size={24} />,
      desc: 'Phase 1: File system, registry, and system logs.'
    },
    { 
      id: 'Memory Forensics', 
      label: 'Memory Forensics', 
      icon: <Cpu className="text-purple-400" size={24} />,
      desc: 'Phase 2: Volatility analysis and process injection.'
    },
    { 
      id: 'Malware Analysis', 
      label: 'Malware Analysis', 
      icon: <Bug className="text-red-400" size={24} />,
      desc: 'Phase 3: Static and dynamic analysis of binaries.'
    }
  ];

  const toggleSelection = (id: string) => {
    if (id === 'Full Forensics') {
      // If Full is selected, it clears specific ones or sets just Full
      setSelectedIds(['Full Forensics']);
    } else {
      let newSelection = [...selectedIds];
      // If Full was selected, remove it first
      if (newSelection.includes('Full Forensics')) {
        newSelection = [];
      }
      
      if (newSelection.includes(id)) {
        newSelection = newSelection.filter(item => item !== id);
      } else {
        newSelection.push(id);
      }
      setSelectedIds(newSelection);
    }
  };

  const handleStart = () => {
    if (selectedIds.length > 0) {
      onSelect(selectedIds);
    }
  };

  return (
    <div className="flex-1 ml-72 p-8 h-screen overflow-y-auto bg-slate-950 flex items-center justify-center">
      <div className="max-w-3xl w-full animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-slate-900 rounded-full border border-slate-800 mb-4 shadow-xl">
            <Target size={32} className="text-cyan-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Investigation Scope Configuration</h2>
          <p className="text-slate-400">Select one or multiple profiles to load for this investigation.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {profiles.map((profile) => {
            const isSelected = selectedIds.includes(profile.id);
            return (
                <button
                key={profile.id}
                onClick={() => toggleSelection(profile.id)}
                className={`group relative p-6 rounded-xl text-left transition-all hover:shadow-lg ${
                    isSelected 
                    ? 'bg-cyan-900/20 border-2 border-cyan-500 shadow-cyan-900/20' 
                    : 'bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-600'
                }`}
                >
                <div className="flex items-start justify-between mb-2">
                    {profile.icon}
                    {isSelected ? (
                        <CheckCircle className="text-cyan-400 fill-cyan-400/20" size={24} />
                    ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-slate-700 group-hover:border-slate-500" />
                    )}
                </div>
                <h3 className={`text-lg font-bold mb-1 ${isSelected ? 'text-white' : 'text-slate-300'}`}>{profile.label}</h3>
                <p className="text-sm text-slate-500 group-hover:text-slate-400">{profile.desc}</p>
                </button>
            );
          })}
        </div>

        <button
            onClick={handleStart}
            disabled={selectedIds.length === 0}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-bold py-4 rounded-xl shadow-lg shadow-cyan-900/20 transition-all transform hover:scale-[1.02] flex items-center justify-center"
        >
            <Play size={24} className="mr-2 fill-white" />
            Start Investigation
        </button>

      </div>
    </div>
  );
};

export default ScopeSelection;
