import React, { useState, useRef } from 'react';

// Define the interface for the external message handler
declare global {
  interface Window {
    externalMessage?: {
      send: (message: string) => void;
    };
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  
  // Text Mode State
  const [jsonInput, setJsonInput] = useState<string>('');
  
  // File Mode State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileCommandType, setFileCommandType] = useState<string>('GIT_ZIP');
  const [credentialId, setCredentialId] = useState<string>('1');

  // GIT_PULL Specific State
  const [repoUrl, setRepoUrl] = useState<string>('');
  const [branch, setBranch] = useState<string>('');
  const [filePath, setFilePath] = useState<string>('');

  // GIT_FILE Specific State
  const [pathInRepo, setPathInRepo] = useState<string>('');

  // Status State
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle'; message: string; details?: string }>({
    type: 'idle',
    message: ''
  });

  // --- Shared Helpers ---

  const resetStatus = () => setStatus({ type: 'idle', message: '' });

  const getLineColumn = (text: string, position: number) => {
    const textUpToError = text.substring(0, position);
    const lines = textUpToError.split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;
    return { line, column };
  };

  const sendToExternal = (payload: string, successMessage: string) => {
    try {
      if (window.externalMessage && window.externalMessage.send) {
        window.externalMessage.send(payload);
        setStatus({ type: 'success', message: successMessage });
      } else {
        console.log('External message handler not available. Would send:', payload);
        setStatus({ type: 'success', message: `${successMessage} (Simulated)` });
      }
    } catch (err: any) {
      console.error("Send failed", err);
      setStatus({ type: 'error', message: 'Failed to send command.', details: err.message });
    }
  };

  // --- Text Logic ---

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
    if (status.type !== 'idle') resetStatus();
  };

  const handleSendText = () => {
    const jsonText = jsonInput;

    if (!jsonText.trim()) {
      setStatus({ type: 'error', message: 'Please enter JSON content.' });
      return;
    }

    try {
      JSON.parse(jsonText);
    } catch (error: any) {
      let errorMessage = error.message || 'Invalid JSON format.';
      let errorDetails = '';
      const match = errorMessage.match(/at position (\d+)/);
      if (match && match[1]) {
        const position = parseInt(match[1], 10);
        const { line, column } = getLineColumn(jsonText, position);
        errorDetails = `Line ${line}, Column ${column}`;
      }
      setStatus({ type: 'error', message: errorMessage, details: errorDetails });
      return;
    }

    sendToExternal(jsonText, 'JSON Command Sent!');
  };

  // --- File Logic ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      resetStatus();
    }
  };

  const handleSendFile = () => {
    // 1. Handle GIT_PULL Logic specifically
    if (fileCommandType === 'GIT_PULL') {
      if (!repoUrl.trim() || !branch.trim() || !filePath.trim()) {
        setStatus({ type: 'error', message: 'Please fill in Repo URL, Branch, and File Path.' });
        return;
      }

      const payload = JSON.stringify({
        type: 'GIT_PULL',
        credentialId: credentialId,
        repoUrl: repoUrl.trim(),
        branch: branch.trim(),
        filePath: filePath.trim()
      });

      sendToExternal(payload, 'Git Pull Command Sent!');
      return;
    }

    // 2. Handle GIT_FILE validation
    if (fileCommandType === 'GIT_FILE') {
      if (!pathInRepo.trim()) {
        setStatus({ type: 'error', message: 'Please specify the Target Path in Repo.' });
        return;
      }
    }

    // 3. Handle File Upload Logic for types (GIT_ZIP, GIT_FILE, DATABASE, etc.)
    if (!selectedFile) {
      setStatus({ type: 'error', message: 'Please select a file first.' });
      return;
    }

    const reader = new FileReader();
    
    reader.onerror = () => {
      setStatus({ type: 'error', message: 'Failed to read file.' });
    };

    reader.onload = () => {
      try {
        const base64String = reader.result as string;
        
        // Construct a JSON object to represent the file command
        const payloadObj: any = {
          type: fileCommandType,
          name: selectedFile.name,
          mimeType: selectedFile.type || 'application/octet-stream',
          dataUrl: base64String 
        };

        // Add credentialId for GIT commands
        if (fileCommandType === 'GIT_ZIP' || fileCommandType === 'GIT_FILE') {
          payloadObj.credentialId = credentialId;
        }

        // Add pathInRepo for GIT_FILE
        if (fileCommandType === 'GIT_FILE') {
          payloadObj.pathInRepo = pathInRepo.trim();
        }

        const filePayload = JSON.stringify(payloadObj);

        sendToExternal(filePayload, 'Command Sent Successfully!');
      } catch (err: any) {
        // Catch string length errors or out of memory errors
        console.error("File processing error", err);
        setStatus({ 
          type: 'error', 
          message: 'Error processing file.', 
          details: err.message === 'Invalid string length' ? 'File is too large to process.' : err.message 
        });
      }
    };

    // Read as Data URL (Base64)
    reader.readAsDataURL(selectedFile);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
      
      {/* Compact Card */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800">Test Utility</h1>
          <span className="text-xs font-mono text-gray-400">JSON/File Sender</span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => { setActiveTab('text'); resetStatus(); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'text' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white' 
                : 'text-gray-500 hover:text-gray-700 bg-gray-50'
            }`}
          >
            JSON Text
          </button>
          <button
            onClick={() => { setActiveTab('file'); resetStatus(); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'file' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white' 
                : 'text-gray-500 hover:text-gray-700 bg-gray-50'
            }`}
          >
            Send File
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5">
          
          {/* TEXT MODE */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <textarea
                value={jsonInput}
                onChange={handleInputChange}
                placeholder='{ "type": "TEST", "data": "..." }'
                className={`
                  w-full h-48 p-3 rounded-lg border 
                  bg-gray-50 text-gray-800 text-xs font-mono leading-relaxed placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-y
                  ${status.type === 'error' ? 'border-red-300' : 'border-gray-300'}
                `}
                spellCheck={false}
              />
              <button
                onClick={handleSendText}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
              >
                Send JSON
              </button>
            </div>
          )}

          {/* FILE MODE */}
          {activeTab === 'file' && (
            <div className="space-y-4 py-2">
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">
                  Command Type
                </label>
                <select
                  value={fileCommandType}
                  onChange={(e) => { 
                    setFileCommandType(e.target.value); 
                    resetStatus();
                  }}
                  className="block w-full p-2 rounded-lg border border-gray-300 bg-gray-50 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                >
                  <option value="GIT_ZIP">GIT_ZIP</option>
                  <option value="GIT_PULL">GIT_PULL</option>
                  <option value="GIT_FILE">GIT_FILE</option>
                  <option value="DATABASE">DATABASE</option>
                </select>
              </div>

              {/* Git Profile Input (Only for GIT commands) */}
              {(fileCommandType === 'GIT_ZIP' || fileCommandType === 'GIT_PULL' || fileCommandType === 'GIT_FILE') && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">
                    Git Profile (Credential ID / Repo Name)
                  </label>
                  <input
                    type="text"
                    value={credentialId}
                    onChange={(e) => { 
                      setCredentialId(e.target.value); 
                      resetStatus();
                    }}
                    placeholder="Enter Credential ID or Repo Name"
                    className="block w-full p-2 rounded-lg border border-gray-300 bg-gray-50 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              )}

              {/* GIT_FILE Specific Input */}
              {fileCommandType === 'GIT_FILE' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">
                    Target Path in Repo
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. assets/logo.png"
                    value={pathInRepo}
                    onChange={(e) => { setPathInRepo(e.target.value); resetStatus(); }}
                    className="block w-full p-2 rounded-lg border border-gray-300 bg-gray-50 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              )}

              {fileCommandType === 'GIT_PULL' ? (
                /* GIT PULL UI inputs */
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Repo URL (e.g. https://github.com/user/repo.git)"
                    value={repoUrl}
                    onChange={(e) => { setRepoUrl(e.target.value); resetStatus(); }}
                    className="block w-full p-2 rounded-lg border border-gray-300 bg-gray-50 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Branch (e.g. main)"
                    value={branch}
                    onChange={(e) => { setBranch(e.target.value); resetStatus(); }}
                    className="block w-full p-2 rounded-lg border border-gray-300 bg-gray-50 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                  <input
                    type="text"
                    placeholder="File Path in Repo (e.g. src/config.json)"
                    value={filePath}
                    onChange={(e) => { setFilePath(e.target.value); resetStatus(); }}
                    className="block w-full p-2 rounded-lg border border-gray-300 bg-gray-50 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              ) : (
                /* Standard File Upload UI for GIT_ZIP, GIT_FILE, DATABASE */
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  className="block w-full text-xs text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-xs file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    cursor-pointer"
                />
              )}

              <button
                onClick={handleSendFile}
                disabled={fileCommandType !== 'GIT_PULL' && !selectedFile}
                className={`
                  w-full py-2.5 px-4 rounded-lg text-sm font-semibold shadow-sm transition-colors focus:ring-2 focus:ring-offset-1
                  ${(fileCommandType === 'GIT_PULL' || selectedFile) 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                `}
              >
                {fileCommandType === 'GIT_PULL' ? 'Send Git Pull' : 'Send File'}
              </button>
            </div>
          )}

          {/* Status Message */}
          <div className={`mt-4 overflow-hidden transition-all duration-300 ${status.type === 'idle' ? 'max-h-0 opacity-0' : 'max-h-24 opacity-100'}`}>
            <div className={`
              text-xs p-3 rounded-md flex items-start gap-2 border
              ${status.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}
            `}>
              <div className="mt-0.5 shrink-0">
                {status.type === 'error' ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 001 1 1 1 0 001-1V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{status.message}</p>
                {status.details && <p className="mt-1 font-mono opacity-80">{status.details}</p>}
              </div>
            </div>
          </div>

        </div>
      </div>
      
      <div className="mt-6 text-gray-300 text-[10px] text-center">
        Compact JSON/File Tester
      </div>
    </div>
  );
}