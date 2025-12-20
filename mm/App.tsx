import React, { useState, useEffect } from 'react';

// Define the interface for the external message handler
declare global {
  interface Window {
    externalMessage?: {
      send: (message: string) => any;
    };
    // Global helper for the Muul browser to inject results directly
    updateBrowserResult?: (data: any) => void;
  }
}

const PRINT_JSON = {
  "type": "print",
  "payload": {
    "printer_name": ["EPSON TM-m30 Receipt"],
    "item_length": 26,
    "template": "2",
    "data": [
      { "type": "logo", "data": { "url": "https://pos.tradywork.com/images/22bef43a88f72e2a0e57992865302ba4.png" } },
      { "type": "header", "data": { "top_title": "My Store Name", "bill_no": "13355", "date_of_bill": "3/3/2022" } },
      { "type": "item", "data": { "itemdata": [{ "item_name": "Pizza", "quantity": 1, "price": 44.99, "item_amount": 44.99 }] } },
      { "type": "bigsummary", "data": { "bigsummary": [{ "key": "Total", "value": 44.99 }] } },
      { "type": "footer", "data": { "align": "center", "footer_text": ["Thank you for your visit!"] } }
    ]
  }
};

const GIT_TEMPLATE_JSON = {
  "type": "git",
  "payload": { "repo": "my-app", "branch": "main", "action": "deploy" }
};

const DATABASE_JSON = {
  "connectionname": "xys",      
  "sql": "SELECT * FROM public.vandana"
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [jsonInput, setJsonInput] = useState<string>('');
  const [resultData, setResultData] = useState<string>('');
  
  // File Mode State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileCommandType, setFileCommandType] = useState<string>('GIT_ZIP');
  const [credentialId, setCredentialId] = useState<string>('1');
  const [destination, setDestination] = useState<'github' | 'local' | 'both'>('github');
  const [pathInRepo, setPathInRepo] = useState<string>('');

  // Status State
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle'; message: string; details?: string }>({
    type: 'idle',
    message: ''
  });

  // --- External Bridge Logic ---
  useEffect(() => {
    // 1. Listen for standard window messages (if used by browser)
    const handleMessage = (event: MessageEvent) => {
      if (event.data && (event.data.type === 'SAVED_CREDENTIALS_RESPONSE' || event.data.credentials)) {
        const content = typeof event.data === 'string' ? event.data : JSON.stringify(event.data, null, 2);
        setResultData(content);
        setStatus({ type: 'success', message: 'Data received via postMessage' });
      }
    };

    // 2. Listen for pushed replies (external:result event)
    const handleExternalResult = (e: any) => {
      const data = e.detail !== undefined ? e.detail : e;
      setResultData(typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data));
      setStatus({ type: 'success', message: 'Pushed reply received via event listener' });
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('external:result', handleExternalResult);

    // 3. Expose global function for the browser to call directly
    window.updateBrowserResult = (data: any) => {
      const content = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
      setResultData(content);
      setStatus({ type: 'success', message: 'Result updated via global helper' });
    };

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('external:result', handleExternalResult);
      delete window.updateBrowserResult;
    };
  }, []);

  const resetStatus = () => setStatus({ type: 'idle', message: '' });

  const fillJson = (data: any) => {
    setJsonInput(JSON.stringify(data, null, 2));
    resetStatus();
  };

  const handleFetchCredentials = async () => {
    const cmdObj = { type: 'GET_SAVED_CREDENTIALS', requestId: 'list-' + Date.now() };
    const cmdStr = JSON.stringify(cmdObj);
    setJsonInput(cmdStr);
    resetStatus();
    try {
      if (window.externalMessage && window.externalMessage.send) {
        const res = await window.externalMessage.send(cmdStr);
        const entries = res?.entries || res?.data?.entries || res || [];
        setResultData(JSON.stringify(entries, null, 2));
        setStatus({ type: 'success', message: 'Credentials received' });
      } else {
        setStatus({ type: 'error', message: 'Bridge not available' });
      }
    } catch (e: any) {
      setStatus({ type: 'error', message: 'Fetch failed', details: e.message });
    }
  };

  const handleSendText = async () => {
    if (!jsonInput.trim()) {
      setStatus({ type: 'error', message: 'Please enter JSON content.' });
      return;
    }
    
    resetStatus();
    try {
      let parsed = JSON.parse(jsonInput);
      
      // Ensure requestId exists for tracking as requested
      if (typeof parsed === 'object' && parsed !== null) {
        if (!parsed.requestId) {
          parsed.requestId = 'req-' + Date.now();
        }
      }
      
      const cmd = JSON.stringify(parsed);
      setJsonInput(cmd); // Sync UI with injected requestId

      if (window.externalMessage && window.externalMessage.send) {
        // Await promise result and set to Result View
        const res = await window.externalMessage.send(cmd);
        setResultData(JSON.stringify(res, null, 2));
        setStatus({ type: 'success', message: 'Command Sent and Response Captured' });
      } else {
        console.log('Simulated Send:', cmd);
        setStatus({ type: 'success', message: 'JSON Valid (Bridge Simulated)' });
      }
    } catch (error: any) {
      setStatus({ type: 'error', message: 'Execution Error', details: error.message });
    }
  };

  const handleSendFile = async () => {
    if (!selectedFile) return;
    resetStatus();
    
    const reader = new FileReader();
    reader.onload = async () => {
      const payloadObj = {
        type: fileCommandType,
        name: selectedFile.name,
        dataUrl: reader.result,
        target: destination,
        credentialId,
        pathInRepo,
        requestId: 'file-' + Date.now()
      };
      
      const payloadStr = JSON.stringify(payloadObj);
      
      try {
        if (window.externalMessage && window.externalMessage.send) {
          // Await promise result and set to Result View
          const res = await window.externalMessage.send(payloadStr);
          setResultData(JSON.stringify(res, null, 2));
          setStatus({ type: 'success', message: 'File Sent and Response Captured' });
        } else {
          setStatus({ type: 'success', message: 'File processed (Bridge Simulated)' });
        }
      } catch (err: any) {
        setStatus({ type: 'error', message: 'File send failed', details: err.message });
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
      
      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl items-start justify-center">
        
        {/* Main Command Card */}
        <div className="w-full lg:w-1/2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden flex flex-col">
          <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
            <h1 className="text-white font-bold text-lg">JSON Test Page</h1>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-700 px-2 py-1 rounded">Control</span>
          </div>

          <div className="flex bg-gray-100 p-1 m-4 rounded-lg">
            <button
              onClick={() => { setActiveTab('text'); resetStatus(); }}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${activeTab === 'text' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              JSON TEXT
            </button>
            <button
              onClick={() => { setActiveTab('file'); resetStatus(); }}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${activeTab === 'file' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              SEND FILE
            </button>
          </div>

          <div className="px-6 pb-6 space-y-4">
            {activeTab === 'text' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => fillJson(PRINT_JSON)} className="text-[10px] py-2 bg-gray-50 border border-gray-200 rounded font-bold text-gray-600 hover:bg-gray-100 uppercase tracking-tighter">Print Template</button>
                  <button onClick={() => fillJson(GIT_TEMPLATE_JSON)} className="text-[10px] py-2 bg-gray-50 border border-gray-200 rounded font-bold text-gray-600 hover:bg-gray-100 uppercase tracking-tighter">Git Template</button>
                  <button onClick={() => fillJson(DATABASE_JSON)} className="text-[10px] py-2 bg-gray-50 border border-gray-200 rounded font-bold text-gray-600 hover:bg-gray-100 uppercase tracking-tighter">DB Query</button>
                  <button onClick={handleFetchCredentials} className="text-[10px] py-2 bg-blue-600 border border-blue-700 rounded font-bold text-white hover:bg-blue-700 shadow-sm uppercase tracking-tighter">Fetch DB Credential</button>
                </div>

                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='{ "type": "COMMAND" }'
                  className={`w-full h-64 p-4 rounded-lg border bg-gray-50 text-xs font-mono focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all resize-none ${status.type === 'error' ? 'border-red-300' : 'border-gray-200'}`}
                  spellCheck={false}
                />

                <button
                  onClick={handleSendText}
                  className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-lg font-bold text-sm shadow-md transition-all uppercase tracking-widest"
                >
                  Send JSON Command
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                 <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Command Type</label>
                  <select value={fileCommandType} onChange={(e) => setFileCommandType(e.target.value)} className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none">
                    <option value="GIT_ZIP">GIT_ZIP</option>
                    <option value="GIT_FILE">GIT_FILE</option>
                    <option value="DATABASE">DATABASE</option>
                  </select>
                </div>
                
                <input type="file" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                
                <button
                  onClick={handleSendFile}
                  disabled={!selectedFile}
                  className={`w-full py-3 rounded-lg font-bold text-sm shadow-md transition-all ${selectedFile ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  Send File Content
                </button>
              </div>
            )}

            {status.type !== 'idle' && (
              <div className={`p-3 rounded-lg border text-[11px] flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${status.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                <div className="flex-1">
                  <p className="font-bold">{status.message}</p>
                  {status.details && <p className="mt-0.5 opacity-70 font-mono text-[9px]">{status.details}</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Result Card */}
        <div className="w-full lg:w-1/2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden flex flex-col self-stretch">
          <div className="bg-green-600 px-6 py-4 flex items-center justify-between">
            <h2 className="text-white font-bold text-lg">Result View</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setResultData('')}
                className="text-[10px] font-bold text-white uppercase tracking-widest bg-green-700 hover:bg-green-800 px-2 py-1 rounded transition-colors"
              >
                Clear
              </button>
              {resultData && (
                <button 
                  onClick={() => { setJsonInput(resultData); resetStatus(); }}
                  className="text-[10px] font-bold text-white uppercase tracking-widest bg-green-500 hover:bg-green-400 px-2 py-1 rounded transition-colors"
                >
                  Copy to Input
                </button>
              )}
            </div>
          </div>
          
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Incoming Browser Response</label>
              {resultData && <span className="text-[10px] text-green-600 font-bold animate-pulse">Updated</span>}
            </div>
            
            <div className="relative flex-1 group">
              <div className="absolute inset-0 bg-gray-900 rounded-lg shadow-inner overflow-hidden border border-gray-800">
                <textarea
                  readOnly
                  value={resultData}
                  placeholder="Waiting for bridge activity..."
                  className="w-full h-full p-4 bg-transparent text-green-400 text-xs font-mono leading-relaxed focus:outline-none resize-none placeholder-gray-600"
                />
              </div>
            </div>
            
            <p className="mt-4 text-[10px] text-gray-400 italic">
              * Displaying data from externalMessage.send promise or external:result events.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 text-[10px] text-gray-400 uppercase tracking-widest font-semibold flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
        Muul Browser Bridge Active
      </div>
    </div>
  );
}
