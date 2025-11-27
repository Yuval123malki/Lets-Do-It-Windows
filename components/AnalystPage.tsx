
import React, { useState } from 'react';
import { AnalystData, TaskItem, TimelineEvent, IOCItem } from '../types';
import { ClipboardList, ShieldAlert, Clock, FileText, Plus, Trash2, CheckSquare, Square, Calendar, Pencil, X, Download, Save, ChevronDown } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface AnalystPageProps {
  data: AnalystData;
  onChange: (data: AnalystData) => void;
}

const COLORS = [
  { label: 'Cyan', class: 'bg-cyan-500' },
  { label: 'Blue', class: 'bg-blue-500' },
  { label: 'Purple', class: 'bg-purple-500' },
  { label: 'Red', class: 'bg-red-500' },
  { label: 'Orange', class: 'bg-orange-500' },
  { label: 'Emerald', class: 'bg-emerald-500' },
];

const AnalystPage: React.FC<AnalystPageProps> = ({ data, onChange }) => {
  const [newTask, setNewTask] = useState('');
  const [newEvent, setNewEvent] = useState<Partial<TimelineEvent>>({ date: '', time: '', description: '', color: 'bg-cyan-500' });
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  
  // IOC State
  const [newIOC, setNewIOC] = useState('');
  const [newIOCColor, setNewIOCColor] = useState('bg-red-500');
  const [editingIOCId, setEditingIOCId] = useState<string | null>(null);

  // Export Menu State
  const [exportMenuOpen, setExportMenuOpen] = useState<string | null>(null);

  // --- EXPORT LOGIC ---
  const handleSectionExport = (title: string, type: 'notes' | 'tasks' | 'iocs' | 'timeline', format: 'pdf' | 'txt' | 'csv') => {
      const filename = `Analyst_${title.replace(/\s+/g, '_')}`;

      if (format === 'pdf') {
        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.height;
        let y = 20;

        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text(title, 10, y);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Exported: ${new Date().toLocaleString()}`, 10, y + 6);
        y += 15;

        doc.setDrawColor(200, 200, 200);
        doc.line(10, y, 200, y);
        y += 10;

        doc.setFontSize(12);

        switch (type) {
            case 'notes':
                const notesLines = doc.splitTextToSize(data.notes || "No notes recorded.", 180);
                notesLines.forEach((line: string) => {
                    if (y > pageHeight - 20) { doc.addPage(); y = 20; }
                    doc.text(line, 10, y);
                    y += 7;
                });
                break;
            
            case 'tasks':
                if (data.tasks.length === 0) doc.text("No tasks recorded.", 10, y);
                data.tasks.forEach(task => {
                    if (y > pageHeight - 20) { doc.addPage(); y = 20; }
                    const status = task.completed ? "[X]" : "[ ]";
                    const text = `${status} ${task.text}`;
                    doc.text(text, 10, y);
                    y += 8;
                });
                break;

            case 'iocs':
                if (data.iocs.length === 0) doc.text("No IOCs recorded.", 10, y);
                doc.setFont("helvetica", "bold");
                doc.text("Indicators of Compromise:", 10, y);
                y += 10;
                doc.setFont("helvetica", "normal");
                data.iocs.forEach(ioc => {
                    if (y > pageHeight - 20) { doc.addPage(); y = 20; }
                    doc.text(`• ${ioc.text}`, 15, y);
                    y += 8;
                });
                break;

            case 'timeline':
                if (data.timeline.length === 0) doc.text("No events recorded.", 10, y);
                data.timeline.forEach(event => {
                    if (y > pageHeight - 20) { doc.addPage(); y = 20; }
                    doc.setFont("courier", "bold");
                    doc.text(`${event.date} ${event.time}`, 10, y);
                    doc.setFont("helvetica", "normal");
                    doc.text(event.description, 60, y);
                    y += 8;
                });
                break;
        }
        doc.save(`${filename}.pdf`);

      } else if (format === 'csv') {
          let content = '';
          if (type === 'notes') {
              content = `Category,Content\nNotes,"${(data.notes || '').replace(/"/g, '""')}"`;
          } else if (type === 'tasks') {
              content = `Status,Task\n` + data.tasks.map(t => `${t.completed ? 'Done' : 'Pending'},"${t.text.replace(/"/g, '""')}"`).join('\n');
          } else if (type === 'iocs') {
              content = `IOC,Color\n` + data.iocs.map(i => `"${i.text.replace(/"/g, '""')}",${i.color}`).join('\n');
          } else if (type === 'timeline') {
              content = `Date,Time,Description\n` + data.timeline.map(e => `${e.date},${e.time},"${e.description.replace(/"/g, '""')}"`).join('\n');
          }
          
          const blob = new Blob([content], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${filename}.csv`;
          a.click();

      } else if (format === 'txt') {
          let content = `${title.toUpperCase()}\nExported: ${new Date().toLocaleString()}\n\n`;
          
          if (type === 'notes') {
              content += data.notes || "No notes recorded.";
          } else if (type === 'tasks') {
              content += data.tasks.map(t => `[${t.completed ? 'X' : ' '}] ${t.text}`).join('\n');
          } else if (type === 'iocs') {
              content += data.iocs.map(i => `- ${i.text}`).join('\n');
          } else if (type === 'timeline') {
              content += data.timeline.map(e => `[${e.date} ${e.time}] ${e.description}`).join('\n');
          }

          const blob = new Blob([content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${filename}.txt`;
          a.click();
      }

      setExportMenuOpen(null);
  };

  // Helper Component for Export Dropdown
  const ExportDropdown = ({ sectionTitle, sectionType }: { sectionTitle: string, sectionType: 'notes' | 'tasks' | 'iocs' | 'timeline' }) => (
      <div className="relative">
          <button 
              onClick={() => setExportMenuOpen(exportMenuOpen === sectionType ? null : sectionType)}
              className={`text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded transition-colors flex items-center ${exportMenuOpen === sectionType ? 'bg-slate-800 text-white' : ''}`}
              title={`Export ${sectionTitle}`}
          >
              <Download size={18} className="mr-1" />
              <ChevronDown size={14} />
          </button>
          {exportMenuOpen === sectionType && (
              <>
              <div className="fixed inset-0 z-40" onClick={() => setExportMenuOpen(null)}></div>
              <div className="absolute right-0 top-full mt-2 w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <div className="bg-slate-900 px-3 py-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-700">Format</div>
                  <button onClick={() => handleSectionExport(sectionTitle, sectionType, 'pdf')} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white border-b border-slate-700/50">PDF Document</button>
                  <button onClick={() => handleSectionExport(sectionTitle, sectionType, 'txt')} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white border-b border-slate-700/50">Text File (TXT)</button>
                  <button onClick={() => handleSectionExport(sectionTitle, sectionType, 'csv')} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white">CSV (Excel)</button>
              </div>
              </>
          )}
      </div>
  );

  // Handle General Notes
  const handleNotesChange = (value: string) => {
    onChange({ ...data, notes: value });
  };

  // --- IOC LOGIC (Replacing Suspicious Staff) ---
  const addIOC = () => {
      if (!newIOC.trim()) return;
      
      if (editingIOCId) {
          const updatedIOCs = data.iocs.map(i => 
              i.id === editingIOCId ? { ...i, text: newIOC, color: newIOCColor } : i
          );
          onChange({ ...data, iocs: updatedIOCs });
          setEditingIOCId(null);
      } else {
          const iocItem: IOCItem = {
              id: crypto.randomUUID(),
              text: newIOC,
              color: newIOCColor
          };
          onChange({ ...data, iocs: [...data.iocs, iocItem] });
      }
      setNewIOC('');
      setNewIOCColor('bg-red-500');
  };

  const editIOC = (ioc: IOCItem) => {
      setNewIOC(ioc.text);
      setNewIOCColor(ioc.color);
      setEditingIOCId(ioc.id);
  };

  const deleteIOC = (id: string) => {
      const updatedIOCs = data.iocs.filter(i => i.id !== id);
      onChange({ ...data, iocs: updatedIOCs });
      if (editingIOCId === id) {
          setEditingIOCId(null);
          setNewIOC('');
          setNewIOCColor('bg-red-500');
      }
  };

  // --- TASK LOGIC ---
  const addTask = () => {
    if (!newTask.trim()) return;
    const newTaskItem: TaskItem = {
      id: crypto.randomUUID(),
      text: newTask,
      completed: false
    };
    onChange({ ...data, tasks: [...data.tasks, newTaskItem] });
    setNewTask('');
  };

  const toggleTask = (taskId: string) => {
    const updatedTasks = data.tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    onChange({ ...data, tasks: updatedTasks });
  };

  const deleteTask = (taskId: string) => {
    const updatedTasks = data.tasks.filter(t => t.id !== taskId);
    onChange({ ...data, tasks: updatedTasks });
  };

  // --- TIMELINE LOGIC ---
  const existingDates = Array.from(new Set(data.timeline.map(e => e.date))).sort();

  const handleSaveEvent = () => {
    if (!newEvent.date || !newEvent.time || !newEvent.description) return;

    let updatedTimeline: TimelineEvent[];

    if (editingEventId) {
        updatedTimeline = data.timeline.map(e => 
            e.id === editingEventId 
            ? { ...e, date: newEvent.date!, time: newEvent.time!, description: newEvent.description!, color: newEvent.color! } 
            : e
        );
        setEditingEventId(null);
    } else {
        const eventItem: TimelineEvent = {
            id: crypto.randomUUID(),
            date: newEvent.date!,
            time: newEvent.time!,
            description: newEvent.description!,
            color: newEvent.color || 'bg-cyan-500'
        };
        updatedTimeline = [...data.timeline, eventItem];
    }

    updatedTimeline.sort((a, b) => {
       return new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime();
    });
    
    onChange({ ...data, timeline: updatedTimeline });
    setNewEvent({ date: '', time: '', description: '', color: 'bg-cyan-500' });
  };

  const deleteEvent = (eventId: string) => {
     const updatedTimeline = data.timeline.filter(e => e.id !== eventId);
     onChange({ ...data, timeline: updatedTimeline });
     if (editingEventId === eventId) {
         setEditingEventId(null);
         setNewEvent({ date: '', time: '', description: '', color: 'bg-cyan-500' });
     }
  };

  const startEditing = (event: TimelineEvent) => {
      setNewEvent({
          date: event.date,
          time: event.time,
          description: event.description,
          color: event.color
      });
      setEditingEventId(event.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
      setEditingEventId(null);
      setNewEvent({ date: '', time: '', description: '', color: 'bg-cyan-500' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      
      {/* 1. General Notes */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
                <div className="p-2 bg-indigo-900/30 rounded-lg mr-3">
                    <FileText className="text-indigo-400" size={24} />
                </div>
                <h2 className="text-xl font-bold text-white">Analyst General Notes</h2>
            </div>
            <ExportDropdown sectionTitle="Analyst Notes" sectionType="notes" />
        </div>
        <textarea
          value={data.notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="General observations, hypothesis, or overall case context..."
          className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 2. Tasks Checklist */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <div className="p-2 bg-emerald-900/30 rounded-lg mr-3">
                        <ClipboardList className="text-emerald-400" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-white">Tasks & To-Do</h2>
                </div>
                <ExportDropdown sectionTitle="Tasks Checklist" sectionType="tasks" />
            </div>
            
            <div className="flex space-x-2 mb-4">
                <input 
                    type="text" 
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTask()}
                    placeholder="Add a new task..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <button 
                    onClick={addTask}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg transition-colors"
                >
                    <Plus size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[400px] space-y-2 custom-scrollbar pr-2">
                {data.tasks.length === 0 && <p className="text-slate-600 text-sm text-center py-4">No active tasks.</p>}
                {data.tasks.map(task => (
                    <div key={task.id} className="group flex items-center justify-between bg-slate-950/50 p-3 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                        <div 
                            className="flex items-center space-x-3 cursor-pointer flex-1"
                            onClick={() => toggleTask(task.id)}
                        >
                            {task.completed ? (
                                <CheckSquare size={18} className="text-emerald-500" />
                            ) : (
                                <Square size={18} className="text-slate-500" />
                            )}
                            <span className={`text-sm ${task.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                {task.text}
                            </span>
                        </div>
                        <button 
                            onClick={() => deleteTask(task.id)}
                            className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>

        {/* 3. IOCs (Indicators of Compromise) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <div className="p-2 bg-red-900/30 rounded-lg mr-3">
                        <ShieldAlert className="text-red-400" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-white">IOCs</h2>
                </div>
                <ExportDropdown sectionTitle="Indicators of Compromise" sectionType="iocs" />
            </div>

            {/* IOC Input */}
            <div className="bg-slate-950 border border-slate-700 rounded-lg p-3 mb-4">
                <div className="flex space-x-2 mb-2">
                    <input
                        type="text"
                        value={newIOC}
                        onChange={(e) => setNewIOC(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addIOC()}
                        placeholder="IP, Hash, Domain, or Username..."
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                    <button 
                        onClick={addIOC}
                        className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded font-bold text-sm transition-colors"
                    >
                        {editingIOCId ? <Save size={16} /> : <Plus size={16} />}
                    </button>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500">Color Label:</span>
                    {COLORS.map((col) => (
                        <button 
                            key={col.label}
                            onClick={() => setNewIOCColor(col.class)}
                            className={`w-4 h-4 rounded-full hover:scale-125 transition-transform ${col.class} ${newIOCColor === col.class ? 'ring-2 ring-white scale-110' : 'opacity-50 hover:opacity-100'}`}
                            title={col.label}
                        />
                    ))}
                </div>
            </div>

            {/* IOC List */}
            <div className="flex-1 overflow-y-auto max-h-[400px] space-y-2 custom-scrollbar pr-2">
                {data.iocs.length === 0 && <p className="text-slate-600 text-sm text-center py-4">No IOCs recorded.</p>}
                {data.iocs.map(ioc => (
                    <div key={ioc.id} className="group flex items-center justify-between bg-slate-950/50 p-3 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                        <div className="flex items-center space-x-3 flex-1 overflow-hidden">
                            <div className={`w-2 h-8 rounded-full ${ioc.color} flex-shrink-0`}></div>
                            <span className="text-sm text-slate-200 font-mono truncate" title={ioc.text}>{ioc.text}</span>
                        </div>
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => editIOC(ioc)} className="p-1.5 text-slate-500 hover:text-cyan-400 hover:bg-slate-800 rounded">
                                <Pencil size={14} />
                            </button>
                            <button onClick={() => deleteIOC(ioc.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* 4. Visual Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
                <div className="p-2 bg-cyan-900/30 rounded-lg mr-3">
                    <Clock className="text-cyan-400" size={24} />
                </div>
                <h2 className="text-xl font-bold text-white">Course of Events</h2>
            </div>
            <ExportDropdown sectionTitle="Timeline" sectionType="timeline" />
        </div>

        {/* Add/Edit Event Form */}
        <div className={`bg-slate-950 p-4 rounded-xl border mb-8 transition-colors ${editingEventId ? 'border-cyan-500/50 bg-cyan-950/10' : 'border-slate-800'}`}>
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                    {editingEventId ? 'Edit Event' : 'Add Event'}
                </h3>
                {editingEventId && (
                    <button onClick={cancelEditing} className="text-xs text-slate-500 hover:text-white flex items-center bg-slate-900 px-2 py-1 rounded border border-slate-800">
                        <X size={12} className="mr-1" /> Cancel Edit
                    </button>
                )}
            </div>

            {/* Smart Date Selection */}
            {!editingEventId && existingDates.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2 items-center animate-in fade-in slide-in-from-top-1 duration-200">
                    <span className="text-xs text-slate-500 mr-1 font-mono">Quick Dates:</span>
                    {existingDates.map(date => (
                        <button
                            key={date}
                            onClick={() => setNewEvent({ ...newEvent, date })}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-all hover:scale-105 ${newEvent.date === date ? 'bg-cyan-600 text-white border-cyan-500 shadow-lg shadow-cyan-900/30' : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white'}`}
                        >
                            {date}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex flex-wrap gap-3">
                <input 
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 text-slate-400"
                />
                 <input 
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 text-slate-400"
                />
                <input 
                    type="text"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    placeholder="Event description..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 min-w-[200px]"
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEvent()}
                />
                
                {/* Color Palette */}
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2">
                    {COLORS.map((col) => (
                        <button 
                            key={col.label}
                            onClick={() => setNewEvent({...newEvent, color: col.class})}
                            className={`w-4 h-4 rounded-full mx-1 hover:scale-125 transition-transform ${col.class} ${newEvent.color === col.class ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'}`}
                            title={col.label}
                        />
                    ))}
                </div>

                <button 
                    onClick={handleSaveEvent}
                    className={`${editingEventId ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20' : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-500/20'} text-white px-5 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105 shadow-lg`}
                >
                    {editingEventId ? 'Save Changes' : 'Add'}
                </button>
            </div>
        </div>

        {/* Visual Timeline Axis */}
        <div className="relative pl-4 md:pl-8 border-l-2 border-slate-800 ml-4 md:ml-6 space-y-8 py-2">
            {data.timeline.length === 0 && (
                <div className="ml-6 text-slate-600 text-sm italic py-4">No events recorded. Add an event to start the timeline.</div>
            )}
            
            {data.timeline.map((event, index) => (
                <div key={event.id} className="relative ml-6 group">
                    {/* Node */}
                    <div className={`absolute -left-[39px] md:-left-[47px] top-1 w-5 h-5 rounded-full border-4 border-slate-900 ${event.color} shadow-lg shadow-black/50 z-10 transition-transform group-hover:scale-110 ${editingEventId === event.id ? 'ring-2 ring-white scale-110' : ''}`}></div>
                    
                    {/* Content Card */}
                    <div className={`bg-slate-950 border rounded-lg p-4 shadow-md relative transition-all ${editingEventId === event.id ? 'border-cyan-500 ring-1 ring-cyan-500/20 bg-slate-900' : 'border-slate-800 hover:border-slate-700'}`}>
                        <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center text-xs font-mono text-cyan-400 bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-900/50">
                                <Calendar size={12} className="mr-1.5" />
                                {event.date} <span className="mx-1.5 text-slate-600">|</span> {event.time}
                            </div>
                            
                            <div className="flex space-x-1">
                                <button 
                                    onClick={() => startEditing(event)}
                                    className={`p-1.5 rounded transition-colors ${editingEventId === event.id ? 'text-white bg-indigo-600' : 'text-slate-600 hover:text-cyan-400 hover:bg-slate-800'}`}
                                    title="Edit Event"
                                >
                                    <Pencil size={14} />
                                </button>
                                <button 
                                    onClick={() => deleteEvent(event.id)}
                                    className="p-1.5 rounded text-slate-600 hover:text-red-400 hover:bg-slate-800 transition-colors"
                                    title="Delete Event"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                        <p className={`text-sm ${editingEventId === event.id ? 'text-white' : 'text-slate-300'}`}>{event.description}</p>
                    </div>
                </div>
            ))}
        </div>

      </div>
    </div>
  );
};

export default AnalystPage;
