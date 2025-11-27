import Dexie, { Table } from 'dexie';
import { CaseData, IOCItem } from './types';

export class DFIRDatabase extends Dexie {
  cases!: Table<CaseData>;

  constructor() {
    super('DFIR_DB');
    
    // Define schema
    // Only fields we want to index for searching/sorting/filtering need to be listed here.
    // Non-indexed fields (like findings, analystData) are still stored in the object.
    this.version(1).stores({
      cases: 'id, caseId, analystName, status, createdAt' 
    });
  }
}

export const db = new DFIRDatabase();

/**
 * One-time migration function.
 * Checks for 'dfir_cases' in localStorage.
 * If found, sanitizes data, inserts into IndexedDB, and clears localStorage.
 */
export const migrateFromLocalStorage = async () => {
  const saved = localStorage.getItem('dfir_cases');
  
  if (saved) {
    try {
      const parsedCases = JSON.parse(saved);
      
      if (Array.isArray(parsedCases) && parsedCases.length > 0) {
        console.log(`Migrating ${parsedCases.length} cases from LocalStorage to IndexedDB...`);

        // Perform data sanitization/migration (same logic as was in App.tsx)
        const sanitizedCases: CaseData[] = parsedCases.map((c: any) => {
            // Handle migration from suspiciousStaff string to IOCs array
            let iocs: IOCItem[] = [];
            if (Array.isArray(c.analystData?.iocs)) {
                iocs = c.analystData.iocs;
            } else if (c.analystData?.suspiciousStaff) {
                // Convert legacy string to a single IOC item
                iocs.push({
                    id: crypto.randomUUID(),
                    text: c.analystData.suspiciousStaff,
                    color: 'bg-red-500'
                });
            }

            return {
                id: c.id || crypto.randomUUID(),
                caseId: c.caseId,
                analystName: c.analystName,
                findings: c.findings || {},
                stepData: c.stepData || {},
                aiReport: c.aiReport || null,
                createdAt: c.createdAt || Date.now(),
                scope: c.scope || '',
                customKeywords: c.customKeywords,
                status: c.status || 'Open',
                includedPhases: c.includedPhases || [],
                analystData: {
                    notes: c.analystData?.notes || '',
                    tasks: Array.isArray(c.analystData?.tasks) ? c.analystData.tasks : [],
                    timeline: Array.isArray(c.analystData?.timeline) ? c.analystData.timeline : [],
                    iocs: iocs
                }
            };
        });

        // Bulk add to Dexie
        await db.cases.bulkPut(sanitizedCases);
        console.log('Migration successful.');
      }
      
      // Clear localStorage only after successful processing
      localStorage.removeItem('dfir_cases');
      
    } catch (e) {
      console.error("Failed to migrate data from LocalStorage:", e);
    }
  }
};