
import React, { useState, useEffect } from 'react';
import { ForensicStep, FileHashEntry } from '../types';
import { FolderOpen, Wrench, ChevronRight, Clipboard, CheckCircle2, Info, Plus, Trash2, Edit2, Copy, Save, X } from 'lucide-react';

interface StepCardProps {
  step: ForensicStep;
  value: string;
  onChange: (value: string) => void;
  data?: any; // For structured data like file lists
  onDataChange?: (data: any) => void;
}

const StepCard: React.FC<StepCardProps> = ({ step, value, onChange, data, onDataChange }) => {
  const isClean = value.trim().toLowerCase() === 'clean';
  const isSkipped = value.trim().toLowerCase() === 'skip';
  const [copied, setCopied] = useState(false);

  // State for Dynamic Hash List
  const [fileList, setFileList] = useState<FileHashEntry[]>(data?.fileList || []);
  const [newFile, setNewFile] = useState({ fileName: '', hash: '' });
  const [editingFileId, setEditingFileId] = useState<string | null>(null);

  // State for Packer Check
  const [isPacked, setIsPacked] = useState(false);
  const [packerName, setPackerName] = useState('');

  useEffect(() => {
      if(data?.fileList) setFileList(data.fileList);
  }, [data]);

  // Initialize Packer State
  useEffect(() => {
      if (step.id === 'ma_packers') {
          if (data) {
              setIsPacked(!!data.isPacked);
              setPackerName(data.packerName || '');
          } else {
              // Try to parse from legacy string value if data is missing
              const packed = value.includes('Packed: Yes');
              setIsPacked(packed);
              if (packed) {
                  const match = value.match(/Packer Name: (.*)/);
                  if (match) setPackerName(match[1]);
              }
          }
      }
  }, [step.id, data, value]);

  const handleQuickAction = (action: string) => {
    onChange(action);
  };

  const handleCopyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Packer Update Logic
  const updatePackerInfo = (packed: boolean, name: string) => {
      setIsPacked(packed);
      setPackerName(name);
      
      // Save structured data
      if (onDataChange) {
          onDataChange({ isPacked: packed, packerName: name });
      }
      
      // Update string representation for reports
      const reportString = packed 
          ? `Packed: Yes\nPacker Name: ${name}` 
          : `Packed: No`;
      onChange(reportString);
  };

  // Hash List Logic
  const addFileEntry = () => {
      if (!newFile.fileName || !newFile.hash) return;
      const newList = [...fileList, { id: crypto.randomUUID(), ...newFile }];
      setFileList(newList);
      if(onDataChange) onDataChange({ fileList: newList });
      setNewFile({ fileName: '', hash: '' });
  };

  const deleteFileEntry = (id: string) => {
      const newList = fileList.filter(f => f.id !== id);
      setFileList(newList);
      if(onDataChange) onDataChange({ fileList: newList });
  };

  const startEditingFile = (file: FileHashEntry) => {
      setNewFile({ fileName: file.fileName, hash: file.hash });
      setEditingFileId(file.id);
  };

  const saveEditedFile = () => {
      if (!newFile.fileName || !newFile.hash || !editingFileId) return;
      const newList = fileList.map(f => f.id === editingFileId ? { ...f, ...newFile } : f);
      setFileList(newList);
      if(onDataChange) onDataChange({ fileList: newList });
      setEditingFileId(null);
      setNewFile({ fileName: '', hash: '' });
  };

  const cancelEditFile = () => {
      setEditingFileId(null);
      setNewFile({ fileName: '', hash: '' });
  };

  const copyFileEntry = (file: FileHashEntry) => {
      navigator.clipboard.writeText(file.hash);
  };


  // SPECIAL RENDER FOR PRE-EXECUTION CHECKLIST
  if (step.isReadOnly && step.id === 'ma_dynamic_checklist') {
      return (
        <div className="bg-gradient-to-r from-indigo-900/20 to-purple-900/10 border-l-4 border-indigo-500 rounded-r-xl p-8 mb-8 shadow-lg animate-in fade-in duration-500">
            <div className="flex items-center mb-6">
                <Info className="text-indigo-400 mr-3" size={28} />
                <h3 className="text-2xl font-bold text-white tracking-tight">{step.title}</h3>
            </div>
            
            <div className="space-y-6 text-slate-300">
                {/* 1. Unpacking */}
                <div>
                    <h4 className="text-lg font-bold text-indigo-300 mb-1 flex items-center">
                        <span className="bg-indigo-500/20 text-indigo-400 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">1</span> 
                        Unpacking
                    </h4>
                    <p className="ml-8 text-sm leading-relaxed opacity-90">
                        If the file was found to be packed during Static Analysis, perform Unpacking before full execution.
                    </p>
                </div>

                {/* 2. Fake Network */}
                <div>
                    <h4 className="text-lg font-bold text-indigo-300 mb-1 flex items-center">
                        <span className="bg-indigo-500/20 text-indigo-400 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">2</span> 
                        Fake Network Simulation
                    </h4>
                    <p className="ml-8 text-sm leading-relaxed opacity-90">
                        Activate network simulation tools (e.g., <span className="text-white font-semibold">FakeNet</span> or <span className="text-white font-semibold">INetSim</span>) before running the malware.
                    </p>
                </div>

                {/* 3. PowerShell */}
                <div>
                    <h4 className="text-lg font-bold text-indigo-300 mb-1 flex items-center">
                        <span className="bg-indigo-500/20 text-indigo-400 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">3</span> 
                        PowerShell Transcription
                    </h4>
                    <div className="ml-8">
                        <p className="text-sm leading-relaxed opacity-90 mb-3">
                            Enable PowerShell Transcripting to capture all commands, which is crucial for detecting fileless attack techniques.
                        </p>
                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between group">
                            <code className="font-mono text-xs text-emerald-400">
                                Start-Transcript -Path "C:\PS-Transcript\transcript0.txt" -NoClobber
                            </code>
                            <button 
                                onClick={() => handleCopyCommand('Start-Transcript -Path "C:\\PS-Transcript\\transcript0.txt" -NoClobber')}
                                className="text-slate-500 hover:text-white transition-colors"
                                title="Copy Command"
                            >
                                {copied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Clipboard size={16} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 4. Privileges */}
                <div>
                    <h4 className="text-lg font-bold text-indigo-300 mb-1 flex items-center">
                        <span className="bg-indigo-500/20 text-indigo-400 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">4</span> 
                        Execution Privileges
                    </h4>
                    <p className="ml-8 text-sm leading-relaxed opacity-90">
                        Run the malware with high privileges (<span className="text-red-400 font-mono">Administrator/Root</span>) to ensure full behavior is observed.
                    </p>
                </div>

                {/* 5. Monitoring */}
                <div>
                    <h4 className="text-lg font-bold text-indigo-300 mb-1 flex items-center">
                        <span className="bg-indigo-500/20 text-indigo-400 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">5</span> 
                        System Monitoring
                    </h4>
                    <div className="ml-8 text-sm opacity-90">
                        <p className="mb-2">Simultaneously run monitoring tools (e.g., Procmon, Regshot) to document:</p>
                        <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                            <li>Registry changes.</li>
                            <li>File system changes (creation, modification, or deletion).</li>
                            <li>Process creation and code injection.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg mb-8 transition-all hover:border-slate-700">
      <div className="p-6 border-b border-slate-800 bg-slate-850">
        <div className="flex justify-between items-start">
            <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2 flex items-center">
                    <ChevronRight className="text-cyan-500 mr-2" size={20} />
                    {step.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-3xl">
                    {step.description}
                </p>
                
                {/* COMMAND HELPER FOR GENERAL INSPECTION (MD5) */}
                {step.id === 'ma_general' && (
                    <div className="mt-3 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 flex items-center justify-between max-w-2xl">
                        <div className="flex items-center text-blue-300 text-xs font-mono">
                            <span className="bg-blue-500/20 px-2 py-0.5 rounded mr-2 text-blue-400 font-bold">CMD</span>
                            certutil -hashfile &lt;filename&gt; MD5
                        </div>
                        <button 
                            onClick={() => handleCopyCommand('certutil -hashfile <filename> MD5')}
                            className="text-blue-400 hover:text-white transition-colors p-1"
                            title="Copy Command"
                        >
                            {copied ? <CheckCircle2 size={14} /> : <Clipboard size={14} />}
                        </button>
                    </div>
                )}

                {/* COMMAND HELPER FOR STRINGS */}
                {step.id === 'ma_strings' && (
                    <div className="mt-3 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 flex items-center justify-between max-w-2xl">
                        <div className="flex items-center text-blue-300 text-xs font-mono">
                            <span className="bg-blue-500/20 px-2 py-0.5 rounded mr-2 text-blue-400 font-bold">CMD</span>
                            strings -n 5 &lt;file_path&gt;
                        </div>
                        <button 
                            onClick={() => handleCopyCommand('strings -n 5 <file_path>')}
                            className="text-blue-400 hover:text-white transition-colors p-1"
                            title="Copy Command"
                        >
                            {copied ? <CheckCircle2 size={14} /> : <Clipboard size={14} />}
                        </button>
                    </div>
                )}

                {/* COMMAND HELPER & TABLE FOR MARK OF THE WEB (MOTW) */}
                {step.id === 'ma_motw' && (
                    <div className="mt-3 space-y-4">
                        {/* Command */}
                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 flex items-center justify-between max-w-2xl">
                            <div className="flex items-center text-blue-300 text-xs font-mono">
                                <span className="bg-blue-500/20 px-2 py-0.5 rounded mr-2 text-blue-400 font-bold">PS</span>
                                Get-Content -Path &lt;file_path&gt; -Stream Zone.Identifier
                            </div>
                            <button 
                                onClick={() => handleCopyCommand('Get-Content -Path <file_path> -Stream Zone.Identifier')}
                                className="text-blue-400 hover:text-white transition-colors p-1"
                                title="Copy Command"
                            >
                                {copied ? <CheckCircle2 size={14} /> : <Clipboard size={14} />}
                            </button>
                        </div>

                        {/* Zone ID Table */}
                        <div className="max-w-md">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Zone ID Reference</h4>
                            <div className="border border-slate-700 rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left text-slate-400">
                                    <thead className="text-xs text-slate-300 uppercase bg-slate-800">
                                        <tr>
                                            <th className="px-4 py-2 border-r border-slate-700">Zone</th>
                                            <th className="px-4 py-2">ZoneId</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-slate-900 divide-y divide-slate-800">
                                        <tr className="hover:bg-slate-800/50">
                                            <td className="px-4 py-2 font-medium text-slate-300 border-r border-slate-800">Local Machine</td>
                                            <td className="px-4 py-2 font-mono text-cyan-400">0</td>
                                        </tr>
                                        <tr className="hover:bg-slate-800/50">
                                            <td className="px-4 py-2 font-medium text-slate-300 border-r border-slate-800">Local Intranet</td>
                                            <td className="px-4 py-2 font-mono text-cyan-400">1</td>
                                        </tr>
                                        <tr className="hover:bg-slate-800/50">
                                            <td className="px-4 py-2 font-medium text-slate-300 border-r border-slate-800">Trusted Sites</td>
                                            <td className="px-4 py-2 font-mono text-cyan-400">2</td>
                                        </tr>
                                        <tr className="hover:bg-slate-800/50">
                                            <td className="px-4 py-2 font-medium text-slate-300 border-r border-slate-800">Internet</td>
                                            <td className="px-4 py-2 font-mono text-red-400 font-bold">3</td>
                                        </tr>
                                        <tr className="hover:bg-slate-800/50">
                                            <td className="px-4 py-2 font-medium text-slate-300 border-r border-slate-800">Restricted</td>
                                            <td className="px-4 py-2 font-mono text-red-500 font-bold">4</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

            </div>
            {step.tool && (
                <div className="flex items-center text-xs bg-slate-800 px-3 py-1 rounded text-cyan-400 border border-slate-700 ml-4">
                    <Wrench size={12} className="mr-2" />
                    {step.tool}
                </div>
            )}
        </div>
        
        <div className="mt-4 flex flex-wrap gap-4">
            {step.location && (
                <div className="flex items-center text-xs text-slate-500 font-mono bg-slate-950/50 px-2 py-1 rounded">
                    <FolderOpen size={12} className="mr-2" />
                    {step.location}
                </div>
            )}
        </div>

        <div className="mt-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Forensic Value</h4>
            <ul className="flex flex-wrap gap-2">
                {step.forensicValue.map((val, idx) => (
                    <li key={idx} className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
                        {val}
                    </li>
                ))}
            </ul>
        </div>
      </div>

      <div className="p-6 bg-slate-900">
        <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-slate-300">Findings & Evidence</label>
            <div className="flex space-x-2">
                {/* Hide quick actions for custom inputs to avoid confusion, or keep them */}
                {step.id !== 'ma_packers' && (
                    <>
                    <button 
                        onClick={() => handleQuickAction('Clean')}
                        className={`text-xs px-3 py-1 rounded transition-colors border ${isClean ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
                    >
                        Mark Clean
                    </button>
                    <button 
                        onClick={() => handleQuickAction('Skip')}
                        className={`text-xs px-3 py-1 rounded transition-colors border ${isSkipped ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
                    >
                        Mark Skipped
                    </button>
                    </>
                )}
            </div>
        </div>

        {/* CONDITIONAL RENDERING BASED ON STEP ID */}
        {step.id === 'ma_packers' ? (
            // Custom UI for PEID / Packers
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                    <span className="text-base font-medium text-white flex items-center">
                        Is File Packed?
                        {isPacked && <span className="ml-3 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-mono border border-red-500/30">DETECTED</span>}
                    </span>
                    <button 
                        onClick={() => updatePackerInfo(!isPacked, packerName)}
                        className={`w-14 h-7 rounded-full transition-all duration-300 relative shadow-inner ${isPacked ? 'bg-red-600' : 'bg-slate-700'}`}
                    >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow-md transition-all duration-300 ${isPacked ? 'left-8' : 'left-1'}`}></div>
                    </button>
                </div>
                
                {isPacked && (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Packer Name / Type</label>
                        <input 
                            type="text"
                            value={packerName}
                            onChange={(e) => updatePackerInfo(isPacked, e.target.value)}
                            placeholder="e.g. UPX, Themida, VMProtect..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            autoFocus
                        />
                        <p className="text-xs text-slate-500 mt-2">Specify the packer identified by PEID or entropy analysis.</p>
                    </div>
                )}
                {!isPacked && (
                    <p className="text-sm text-slate-500 italic">Standard analysis indicates the file is not packed.</p>
                )}
            </div>
        ) : (
            // Default Textarea
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={`Enter your findings for ${step.title} here... paste logs, describe artifacts, or note timestamps.`}
                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 font-mono transition-all"
            />
        )}

        {/* DYNAMIC LIST FOR GENERAL INSPECTION */}
        {step.id === 'ma_general' && (
            <div className="mt-6 border-t border-slate-800 pt-6">
                <label className="text-sm font-medium text-slate-300 mb-4 block">Additional Files / Hashes</label>
                
                {/* Input Area */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <input 
                            type="text" 
                            placeholder="File Name (e.g. payload.exe)"
                            value={newFile.fileName}
                            onChange={(e) => setNewFile({...newFile, fileName: e.target.value})}
                            className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                        />
                        <input 
                            type="text" 
                            placeholder="MD5/SHA256 Hash"
                            value={newFile.hash}
                            onChange={(e) => setNewFile({...newFile, hash: e.target.value})}
                            className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none font-mono"
                        />
                    </div>
                    <div className="flex justify-end space-x-2">
                        {editingFileId && (
                            <button 
                                onClick={cancelEditFile}
                                className="text-slate-400 text-xs hover:text-white px-3 py-2"
                            >
                                Cancel
                            </button>
                        )}
                        <button 
                            onClick={editingFileId ? saveEditedFile : addFileEntry}
                            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded text-xs font-bold flex items-center border border-slate-700"
                        >
                            {editingFileId ? <Save size={14} className="mr-1"/> : <Plus size={14} className="mr-1"/>}
                            {editingFileId ? 'Save Changes' : 'Add Entry'}
                        </button>
                    </div>
                </div>

                {/* List Area */}
                <div className="space-y-2">
                    {fileList.map((file) => (
                        <div key={file.id} className="flex items-center justify-between bg-slate-800/30 p-3 rounded border border-slate-800 hover:border-slate-700 transition-colors">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div className="text-sm text-slate-200 font-medium truncate">{file.fileName}</div>
                                <div className="text-xs text-slate-400 font-mono truncate">{file.hash}</div>
                            </div>
                            <div className="flex items-center space-x-1 ml-4">
                                <button onClick={() => copyFileEntry(file)} className="p-1.5 text-slate-500 hover:text-cyan-400 rounded" title="Copy Hash">
                                    <Copy size={14} />
                                </button>
                                <button onClick={() => startEditingFile(file)} className="p-1.5 text-slate-500 hover:text-white rounded" title="Edit">
                                    <Edit2 size={14} />
                                </button>
                                <button onClick={() => deleteFileEntry(file.id)} className="p-1.5 text-slate-500 hover:text-red-400 rounded" title="Delete">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {fileList.length === 0 && <p className="text-xs text-slate-600 italic text-center">No additional files added.</p>}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default StepCard;
