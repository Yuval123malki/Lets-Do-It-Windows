
import { ForensicStep, Phase } from './types';

export const FORENSIC_STEPS: ForensicStep[] = [
  // --- PART 1: DEEP OS & ARTIFACTS ANALYSIS (MERGED) ---
  {
    id: 'autopsy',
    title: 'Autopsy',
    phase: Phase.OS_ARTIFACTS_MERGED,
    description: 'Forensics platform providing a GUI for hard drive analysis. Used for file system analysis, web history, and connected devices.',
    forensicValue: ['System Info', 'Browsing History', 'User Login History', 'Previously Connected Devices'],
    tool: 'Autopsy'
  },
  {
    id: 'event_viewer',
    title: 'Event Viewer',
    phase: Phase.OS_ARTIFACTS_MERGED,
    description: 'Windows component logging system, security, and application events. Use Sysmon for enhanced visibility.',
    forensicValue: ['User activity', 'Security events', 'Process creation', 'Network connections'],
    tool: 'Event Viewer / Sysmon / DeepBlueCLI'
  },
  {
    id: 'registry',
    title: 'Registry Analysis',
    phase: Phase.OS_ARTIFACTS_MERGED,
    description: 'Hierarchical database storing configuration for system, apps, and hardware.',
    forensicValue: ['User activity tracking', 'Application configuration', 'System configuration'],
    location: 'Hives (SYSTEM, SOFTWARE, NTUSER.DAT, etc.)'
  },
  {
    id: 'network_forensics',
    title: 'Network Forensics',
    phase: Phase.OS_ARTIFACTS_MERGED,
    description: 'Examining how computers communicate. Vital for identifying attacks and data exfiltration.',
    forensicValue: ['Traffic analysis', 'Connection logs', 'Suspicious IP/Domains'],
    tool: 'Wireshark / TCPView'
  },
  {
    id: 'task_scheduler',
    title: 'Task Scheduler',
    phase: Phase.OS_ARTIFACTS_MERGED,
    description: 'Internal mechanism for automated tasks. Critical for identifying persistence.',
    forensicValue: ['Who created the task', 'When it runs', 'What action it executes'],
    location: 'C:\\Windows\\System32\\Tasks'
  },
  {
    id: 'user_activity',
    title: 'User Activity',
    phase: Phase.OS_ARTIFACTS_MERGED,
    description: 'Analysis of folders like Downloads, Documents, and Desktop to understand user habits and file manipulation.',
    forensicValue: ['Downloaded suspicious files', 'Phishing attachments (Outlook/Thunderbird)', 'File modifications'],
    location: 'Users\\<User>\\Downloads, Desktop, Documents'
  },
  {
    id: 'system_configuration',
    title: 'System Configuration',
    phase: Phase.OS_ARTIFACTS_MERGED,
    description: 'Analyzing installed applications, GPO changes, and local users/groups.',
    forensicValue: ['Suspicious installed software', 'Disabled security policies (Defender/Firewall)', 'New admin accounts created'],
    location: 'Control Panel / Group Policy'
  },
  {
    id: 'thumbcache',
    title: 'Thumbcache',
    phase: Phase.OS_ARTIFACTS_MERGED,
    description: 'Thumbnail cache allowing recovery of deleted images or proof of image existence.',
    forensicValue: ['Recover deleted images', 'Prove user viewed specific images'],
    location: '%userprofile%\\AppData\\Local\\Microsoft\\Windows\\Explorer',
    tool: 'Thumbcache Viewer'
  },
  {
    id: 'jump_lists',
    title: 'Jump Lists',
    phase: Phase.OS_ARTIFACTS_MERGED,
    description: 'Dynamic lists of recently opened files/items on the taskbar or start menu.',
    forensicValue: ['Recent file access', 'Lateral movement traces (RDP)', 'File execution history'],
    location: '%userprofile%\\AppData\\Roaming\\Microsoft\\Windows\\Recent\\AutomaticDestinations',
    tool: 'JLECmd.exe'
  },
  {
    id: 'recycle_bin',
    title: 'Recycle Bin',
    phase: Phase.OS_ARTIFACTS_MERGED,
    description: 'Deleted files storage. Creates $I (Metadata) and $R (Data) files.',
    forensicValue: ['Original file path', 'File size', 'Deletion date'],
    location: 'C:\\$Recycle.Bin',
    tool: 'RBCmd.exe'
  },
  {
    id: 'prefetch',
    title: 'Prefetch Files',
    phase: Phase.OS_ARTIFACTS_MERGED,
    description: 'Optimization files created on first application run.',
    forensicValue: ['Executable name', 'Full path', 'Run count', 'Last run time', 'Loaded DLLs'],
    location: '%SystemRoot%\\Prefetch',
    tool: 'PECmd.exe'
  },
  {
    id: 'shimcache',
    title: 'ShimCache (AppCompatCache)',
    phase: Phase.OS_ARTIFACTS_MERGED,
    description: 'Tracks executable file compatibility information.',
    forensicValue: ['File names and paths', 'Last modification time', 'Binary size', 'Execution flag'],
    location: 'HKLM\\SYSTEM\\CurrentControlSet\\Control\\SessionManager\\AppCompatCache',
    tool: 'AppCompatCacheParser.exe'
  },
  {
    id: 'amcache',
    title: 'Amcache',
    phase: Phase.OS_ARTIFACTS_MERGED,
    description: 'Registry hive storing SHA1 hashes of installed programs/EXEs.',
    forensicValue: ['Program name and path', 'Last run time', 'SHA1 Hash', 'Binary version'],
    location: 'C:\\Windows\\appcompat\\Programs\\Amcache.hve',
    tool: 'AmcacheParser.exe'
  },
  {
    id: 'srum',
    title: 'SRUM (System Resource Usage Monitor)',
    phase: Phase.OS_ARTIFACTS_MERGED,
    description: 'Database recording application performance, network usage, and power consumption.',
    forensicValue: ['Network activity per process', 'Bytes sent/received', 'Power usage'],
    location: 'C:\\Windows\\System32\\sru\\SRUDB.dat',
    tool: 'SrumECmd.exe'
  },
  {
    id: 'ads',
    title: 'Alternate Data Streams (ADS)',
    phase: Phase.OS_ARTIFACTS_MERGED,
    description: 'NTFS feature allowing data to be attached to a file without changing its size visibly.',
    forensicValue: ['Hidden data extraction', 'Identifier for downloaded files (Zone.Identifier)'],
    location: 'File system (NTFS)',
    tool: 'Sysinternals streams.exe / PowerShell Get-Item -Stream'
  },
  {
    id: 'lnk_files',
    title: 'LNK Files (Shortcuts)',
    phase: Phase.OS_ARTIFACTS_MERGED,
    description: 'Shortcut files containing metadata about the target file.',
    forensicValue: ['Target full path', 'Creation/Access timestamps', 'Volume info'],
    location: '%userprofile%\\Recent',
    tool: 'LECmd.exe'
  },
  {
    id: 'wordwheel',
    title: 'WordWheelQuery',
    phase: Phase.OS_ARTIFACTS_MERGED,
    description: 'Registry key containing search terms used in Windows Explorer.',
    forensicValue: ['User search terms', 'Intent analysis'],
    location: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\WordWheelQuery'
  },
  {
    id: 'ntuser',
    title: 'NTUSER.DAT',
    phase: Phase.OS_ARTIFACTS_MERGED,
    description: 'User-specific registry hive.',
    forensicValue: ['User settings', 'Software configuration', 'Activity history'],
    location: '%userprofile%\\NTUSER.DAT',
    tool: 'RegRipper / RegistryExplorer'
  },
  {
    id: 'powershell_history',
    title: 'PowerShell History',
    phase: Phase.OS_ARTIFACTS_MERGED,
    description: 'Text file containing history of typed PowerShell commands.',
    forensicValue: ['Executed scripts', 'Downloaded payloads', 'Attacker commands'],
    location: '%userprofile%\\AppData\\Roaming\\Microsoft\\Windows\\PowerShell\\PSReadLine\\ConsoleHost_history.txt'
  },
  {
    id: 'mft',
    title: 'Master File Table (MFT)',
    phase: Phase.OS_ARTIFACTS_MERGED,
    description: 'NTFS database with a record for every file.',
    forensicValue: ['Timestamps (Created, Modified, Accessed, Entry Modified)', 'Deleted file recovery'],
    location: '$MFT (Root of partition)',
    tool: 'MFTECmd.exe'
  },
  {
    id: 'userassist',
    title: 'UserAssist',
    phase: Phase.OS_ARTIFACTS_MERGED,
    description: 'Registry keys tracking GUI-launched applications.',
    forensicValue: ['Run count', 'Last execution time', 'ROT13 encoded names'],
    location: 'HKCU\\...\\Explorer\\UserAssist',
    tool: 'RegRipper'
  },
  {
    id: 'setupapi',
    title: 'SetupAPI & USB Devices',
    phase: Phase.OS_ARTIFACTS_MERGED,
    description: 'Logs regarding hardware installation, specifically USB drives.',
    forensicValue: ['USB Vendor/Product ID', 'Serial Number', 'First/Last connection times'],
    location: 'C:\\Windows\\inf\\setupapi.dev.log',
    tool: 'USBDeview / Registry Explorer'
  },
  {
    id: 'browser_artifacts',
    title: 'Browser Artifacts',
    phase: Phase.OS_ARTIFACTS_MERGED,
    description: 'History, cookies, cache, and downloads from web browsers.',
    forensicValue: ['Browsing history', 'Downloads', 'Session tokens'],
    location: '%LocalAppData%\\Google\\Chrome\\User Data\\Default',
    tool: 'BrowserHistoryView / SQLiteBrowser'
  },

  // --- PART 3: MEMORY ANALYSIS ---
  {
    id: 'memory_dump',
    title: 'Memory Acquisition',
    phase: Phase.MEMORY,
    description: 'Capturing RAM content during incident response.',
    forensicValue: ['Decryption keys', 'Running processes', 'Network connections', 'Open files'],
    tool: 'FTK Imager / DumpIt / WinPmem'
  },
  {
    id: 'volatility_analysis',
    title: 'Volatility Analysis',
    phase: Phase.MEMORY,
    description: 'Using Volatility framework to analyze the memory image.',
    forensicValue: ['PsList (Processes)', 'NetScan (Network)', 'Malfind (Injected code)'],
    tool: 'Volatility'
  },
  {
    id: 'anomalous_processes',
    title: 'Anomalous Processes',
    phase: Phase.MEMORY,
    description: 'Identifying suspicious processes (wrong parent, wrong path, misspelled names).',
    forensicValue: ['Identify malware masquerading as system processes (svchost, explorer)'],
    tool: 'Volatility (pslist, pstree)'
  },
  {
    id: 'suspicious_services',
    title: 'Suspicious Services',
    phase: Phase.MEMORY,
    description: 'Analyzing background services for persistence.',
    forensicValue: ['Malicious DLLs loaded by svchost', 'Unsigned drivers'],
    location: 'HKLM\\SYSTEM\\CurrentControlSet\\Services',
    tool: 'Volatility (svcscan)'
  },

  // --- PART 4: MALWARE ANALYSIS ---
  
  // Phase 3.1: Static Analysis
  {
    id: 'ma_general',
    title: 'General Inspection',
    phase: Phase.MALWARE_STATIC,
    description: 'Calculate MD5 hashes. Upload to VirusTotal to check reputation and attribution.',
    forensicValue: ['File Hash', 'Attribution', 'Reputation Score'],
    tool: 'CertUtil / VirusTotal'
  },
  {
    id: 'ma_strings',
    title: 'Strings Analysis',
    phase: Phase.MALWARE_STATIC,
    description: 'Use Strings tool. Look for embedded IPs, URLs, filenames, PDB paths, or error messages that reveal functionality.',
    forensicValue: ['C2 IPs/URLs', 'PDB Paths', 'Hardcoded credentials'],
    tool: 'Strings'
  },
  {
    id: 'ma_motw',
    title: 'Mark Of The Web (MotW)',
    phase: Phase.MALWARE_STATIC,
    description: "Check the 'Zone.Identifier' alternate data stream to see where the file originated.",
    forensicValue: ['Origin URL', 'Download Status'],
    tool: 'PowerShell: Get-Content -Stream Zone.Identifier'
  },
  {
    id: 'ma_pe_headers',
    title: 'CFF Explorer / PE Headers',
    phase: Phase.MALWARE_STATIC,
    description: 'View metadata, compile time, sections, and import tables. Look for anomalies in "File Type" or "Build Date".',
    forensicValue: ['Compile Time', 'Import anomalies', 'Section names'],
    tool: 'CFF Explorer'
  },
  {
    id: 'ma_packers',
    title: 'PEID / Packers Check',
    phase: Phase.MALWARE_STATIC,
    description: 'Scan for signatures of packers (like UPX) which hide code. High entropy indicates packed/encrypted code.',
    forensicValue: ['Detected Packer', 'Entropy Score'],
    tool: 'PEID'
  },
  {
    id: 'ma_pestudio',
    title: 'PEStudio Analysis',
    phase: Phase.MALWARE_STATIC,
    description: 'Automated static assessment. Flags suspicious imports, embedded files, and Virustotal score.',
    forensicValue: ['Suspicious Imports', 'Embedded Files', 'Indicators'],
    tool: 'PEStudio'
  },
  {
    id: 'ma_macros',
    title: 'Office Macros',
    phase: Phase.MALWARE_STATIC,
    description: 'If analyzing DOC/XLS, extract vbaProject.bin. Check for AutoOpen/AutoExec macros.',
    forensicValue: ['Malicious VBA', 'Auto-execution triggers'],
    tool: 'olevba / oletools'
  },
  {
    id: 'ma_cyberchef',
    title: 'CyberChef Decoding',
    phase: Phase.MALWARE_STATIC,
    description: 'If obfuscated strings (Base64, XOR) are found, use CyberChef to decode them.',
    forensicValue: ['Decoded C2 config', 'Hidden commands'],
    tool: 'CyberChef'
  },

  // Phase 3.2: Dynamic Analysis
  {
    id: 'ma_dynamic_checklist',
    title: 'Suggestions & Pre-Execution Checklist',
    phase: Phase.MALWARE_DYNAMIC,
    description: 'Pre-flight checks to ensure safe and effective dynamic analysis.',
    forensicValue: ['Safety', 'Data Capture Quality'],
    isReadOnly: true
  },
  {
    id: 'ma_regshot',
    title: 'Registry Monitoring',
    phase: Phase.MALWARE_DYNAMIC,
    description: 'Take "1st Shot" (Before run) and "2nd Shot" (After run). Compare to see exactly which keys were added/modified for persistence.',
    forensicValue: ['Persistence Keys', 'Configuration Changes'],
    tool: 'RegShot'
  },
  {
    id: 'ma_procmon',
    title: 'Process Monitoring',
    phase: Phase.MALWARE_DYNAMIC,
    description: 'Capture real-time filesystem, registry, and process activity. Filter by Process Name to see dropped files.',
    forensicValue: ['Dropped Files', 'Child Processes', 'File Modifications'],
    tool: 'Process Monitor (Procmon)'
  },
  {
    id: 'ma_traffic',
    title: 'Traffic Analysis',
    phase: Phase.MALWARE_DYNAMIC,
    description: 'Capture packets. Look for DNS queries, HTTP POST requests to C2 servers, or non-standard port usage.',
    forensicValue: ['C2 IPs', 'Data Exfiltration', 'Beaconing intervals'],
    tool: 'Wireshark / TCPView'
  },
  {
    id: 'ma_autoruns',
    title: 'Persistence Check',
    phase: Phase.MALWARE_DYNAMIC,
    description: 'Check for new entries in Run Keys, Scheduled Tasks, or Services created by the malware.',
    forensicValue: ['Persistence Mechanism', 'Launch command'],
    tool: 'Sysinternals AutoRuns'
  },
  {
    id: 'ma_apimonitor',
    title: 'API Monitor',
    phase: Phase.MALWARE_DYNAMIC,
    description: 'Hook and track specific Win32 API calls (e.g., CreateFile, InternetOpen) to see intent.',
    forensicValue: ['API Call Sequence', 'Intent Analysis'],
    tool: 'API Monitor'
  },

  // Phase 3.3: Reverse Engineering
  {
    id: 'ma_deobfuscation',
    title: 'De-Obfuscation Strategy',
    phase: Phase.MALWARE_REVERSING,
    description: 'Check for NOP sleds (0x90), huge files filled with junk, or "Packed" sections.',
    forensicValue: ['Unpacked Binary', 'Clean Code'],
    tool: 'Debloat / Generic Unpacker'
  },
  {
    id: 'ma_static_reversing',
    title: 'Static Reversing',
    phase: Phase.MALWARE_REVERSING,
    description: 'Disassemble the binary. View Control Flow Graph (CFG). Use Python console bv.read() to extract decrypted data from memory offsets.',
    forensicValue: ['Control Flow Graph', 'Decrypted Strings'],
    tool: 'Binary Ninja / IDA / Ghidra'
  },
  {
    id: 'ma_dynamic_reversing',
    title: 'Dynamic Reversing',
    phase: Phase.MALWARE_REVERSING,
    description: 'Dynamic instrumentation. Inject scripts into the running process to hook functions, bypass SSL pinning, or dump decrypted strings from memory.',
    forensicValue: ['Runtime Memory Dump', 'SSL Bypass'],
    tool: 'Frida'
  }
];
