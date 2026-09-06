import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { EditorPanel } from './components/EditorPanel';
import { OutputPanel } from './components/OutputPanel';
import { SettingsModal } from './components/SettingsModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { 
  CodeFile, 
  CompilerHealth, 
  CompilerSettings, 
  EditorSettings, 
  ExecutionResult, 
  Template 
} from './types';
import { C_PLUS_PLUS_TEMPLATES } from './data/templates';
import { SplitSquareVertical, Columns } from 'lucide-react';

const DEFAULT_FILES: CodeFile[] = [
  {
    id: 'f-main',
    name: 'main.cpp',
    content: C_PLUS_PLUS_TEMPLATES[0].files[0].content,
    isEntry: true,
  },
];

const DEFAULT_COMPILER_SETTINGS: CompilerSettings = {
  cppVersion: 'c++20',
  optimization: '-O2',
  warnings: ['-Wall', '-Wextra'],
  compilerArgs: '',
  timeLimit: 5000,
};

const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  fontSize: 14,
  tabSize: 4,
  lineWrapping: true,
};

export default function App() {
  // Load saved state or defaults
  const [files, setFiles] = useState<CodeFile[]>(() => {
    try {
      const saved = localStorage.getItem('cpp_studio_files');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_FILES;
  });

  const [activeFileId, setActiveFileId] = useState<string>(() => files[0]?.id || 'f-main');
  const [stdin, setStdin] = useState<string>(() => {
    return localStorage.getItem('cpp_studio_stdin') || '';
  });

  const [compilerSettings, setCompilerSettings] = useState<CompilerSettings>(() => {
    try {
      const saved = localStorage.getItem('cpp_studio_compiler_settings');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_COMPILER_SETTINGS;
  });

  const [editorSettings, setEditorSettings] = useState<EditorSettings>(() => {
    try {
      const saved = localStorage.getItem('cpp_studio_editor_settings');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_EDITOR_SETTINGS;
  });

  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [compilerHealth, setCompilerHealth] = useState<CompilerHealth | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [targetLine, setTargetLine] = useState<number | null>(null);
  const [layoutMode, setLayoutMode] = useState<'split-horizontal' | 'split-vertical'>('split-horizontal');
  const [showSidebar, setShowSidebar] = useState(true);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('cpp_studio_files', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem('cpp_studio_stdin', stdin);
  }, [stdin]);

  useEffect(() => {
    localStorage.setItem('cpp_studio_compiler_settings', JSON.stringify(compilerSettings));
  }, [compilerSettings]);

  useEffect(() => {
    localStorage.setItem('cpp_studio_editor_settings', JSON.stringify(editorSettings));
  }, [editorSettings]);

  // Fetch compiler health status on load
  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => setCompilerHealth(data))
      .catch(() => {
        setCompilerHealth({
          status: 'ok',
          compiler: 'g++',
          version: 'g++ 12.3.0',
          hasGemini: false,
        });
      });
  }, []);

  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  const handleUpdateContent = useCallback((id: string, content: string) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, content } : f)));
  }, []);

  const handleAddFile = useCallback((name: string) => {
    const newId = `f-${Date.now()}`;
    const isCpp = name.endsWith('.cpp');
    const defaultTemplate = isCpp
      ? `// ${name}\n#include <iostream>\n\n`
      : `// ${name}\n#pragma once\n\n`;
    setFiles((prev) => [...prev, { id: newId, name, content: defaultTemplate }]);
    setActiveFileId(newId);
  }, []);

  const handleDeleteFile = useCallback((id: string) => {
    setFiles((prev) => {
      const filtered = prev.filter((f) => f.id !== id);
      if (filtered.length > 0 && activeFileId === id) {
        setActiveFileId(filtered[0].id);
      }
      return filtered;
    });
  }, [activeFileId]);

  const handleSelectTemplate = useCallback((template: Template) => {
    const loadedFiles: CodeFile[] = template.files.map((tf, index) => ({
      id: `f-tmpl-${index}-${Date.now()}`,
      name: tf.name,
      content: tf.content,
      isEntry: tf.name === 'main.cpp',
    }));
    setFiles(loadedFiles);
    setActiveFileId(loadedFiles[0].id);
    if (template.stdin !== undefined) {
      setStdin(template.stdin);
    }
    setResult(null);
    setStatusNotification(`Loaded "${template.title}" template`);
    setTimeout(() => setStatusNotification(null), 3000);
  }, []);

  const handleResetActiveFile = useCallback(() => {
    handleUpdateContent(activeFile.id, DEFAULT_FILES[0].content);
    setStatusNotification('File reset to default template');
    setTimeout(() => setStatusNotification(null), 2500);
  }, [activeFile.id, handleUpdateContent]);

  // Execute C++ Code
  const handleRun = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setTargetLine(null);

    try {
      const payload = {
        files: files.map((f) => ({ name: f.name, content: f.content })),
        stdin,
        cppVersion: compilerSettings.cppVersion,
        optimization: compilerSettings.optimization,
        warnings: compilerSettings.warnings,
        compilerArgs: compilerSettings.compilerArgs,
        timeLimit: compilerSettings.timeLimit,
      };

      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data: ExecutionResult = await res.json();
      setResult({ ...data, timestamp: Date.now() });
    } catch (err: any) {
      setResult({
        success: false,
        stage: 'system',
        compileTimeMs: 0,
        executionTimeMs: 0,
        stdout: '',
        stderr: err.message || 'Failed to connect to execution server.',
        exitCode: 1,
        signal: null,
        diagnostics: [],
        timestamp: Date.now(),
      });
    } finally {
      setIsRunning(false);
    }
  }, [files, stdin, compilerSettings, isRunning]);

  const handleStop = useCallback(() => {
    setIsRunning(false);
  }, []);

  // Keyboard Shortcuts (Ctrl/Cmd + Enter to Run, Ctrl/Cmd + S to notify)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        setStatusNotification('Code autosaved to browser storage');
        setTimeout(() => setStatusNotification(null), 2000);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRun]);

  const handleDownloadProject = useCallback(() => {
    const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeFile]);

  const handleJumpToLine = useCallback((line: number) => {
    setTargetLine(line);
  }, []);

  const handleAiDebug = useCallback((_errorMsg: string) => {
    setIsAiOpen(true);
  }, []);

  const handleApplyAiCode = useCallback((code: string) => {
    handleUpdateContent(activeFile.id, code);
    setStatusNotification(`Applied AI suggested code to ${activeFile.name}`);
    setTimeout(() => setStatusNotification(null), 3000);
  }, [activeFile.id, activeFile.name, handleUpdateContent]);

  const errorCount = result?.diagnostics?.filter((d) => d.type === 'error').length || (result && !result.success && result.stage === 'compile' ? 1 : 0);
  const warningCount = result?.diagnostics?.filter((d) => d.type === 'warning').length || 0;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1e1e1e] text-[#cccccc] overflow-hidden font-sans select-none">
      {/* Top Application Header */}
      <Header
        isRunning={isRunning}
        onRun={handleRun}
        onStop={handleStop}
        compilerHealth={compilerHealth}
        compilerSettings={compilerSettings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAi={() => setIsAiOpen(true)}
        onSelectTemplate={handleSelectTemplate}
        activeFileName={activeFile.name}
        activeFileContent={activeFile.content}
        onDownloadProject={handleDownloadProject}
      />

      {/* Main Workspace split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Explorer Sidebar matching High Density Design HTML */}
        {showSidebar && (
          <aside className="w-56 bg-[#252526] border-r border-[#3e3e3e] flex flex-col flex-shrink-0 select-none text-[12px]">
            <div className="flex items-center justify-between px-3 py-2 text-[10px] uppercase tracking-wider font-bold text-[#8e8e8e] border-b border-[#3e3e3e]">
              <span>Explorer</span>
              <button 
                onClick={() => handleAddFile(`file_${files.length}.h`)}
                className="hover:text-white transition-colors text-sm px-1"
                title="New File"
              >
                +
              </button>
            </div>
            
            <div className="flex flex-col py-1 overflow-y-auto">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-[#8e8e8e] uppercase tracking-wider">
                Project Files
              </div>
              {files.map((file) => {
                const isActive = file.id === activeFileId;
                const isHeader = file.name.endsWith('.h') || file.name.endsWith('.hpp');
                return (
                  <div
                    key={file.id}
                    onClick={() => setActiveFileId(file.id)}
                    className={`flex items-center justify-between px-3 py-1 cursor-pointer font-mono transition-colors text-[12px] ${
                      isActive
                        ? 'bg-[#37373d] text-white border-l-2 border-[#007acc]'
                        : 'text-[#cccccc] hover:bg-[#2a2d2e] opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[#519aba] font-bold text-[11px]">
                        {isHeader ? 'H' : '++'}
                      </span>
                      <span className="truncate">{file.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dependencies block matching High Density Design HTML */}
            <div className="mt-auto border-t border-[#3e3e3e] p-3 text-[11px] text-[#8e8e8e] space-y-1">
              <div className="text-[10px] uppercase tracking-wider font-bold text-[#8e8e8e] mb-1">
                Dependencies
              </div>
              <div className="opacity-70 font-mono text-[10px]">GCC 12.3.0 (x86_64)</div>
              <div className="opacity-70 font-mono text-[10px]">libstdc++ 12</div>
              <div className="opacity-70 font-mono text-[10px]">POSIX Threads (pthread)</div>
              <div className="opacity-70 font-mono text-[10px]">CMake 3.20+ Ready</div>
            </div>
          </aside>
        )}

        {/* Center / Right: Main editor and output */}
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Editor (Left / Top) */}
          <div className={`flex-1 min-w-0 ${layoutMode === 'split-horizontal' ? 'h-1/2 md:h-full md:w-3/5' : 'h-1/2 w-full'}`}>
            <EditorPanel
              files={files}
              activeFileId={activeFileId}
              onSelectFile={setActiveFileId}
              onUpdateContent={handleUpdateContent}
              onAddFile={handleAddFile}
              onDeleteFile={handleDeleteFile}
              editorSettings={editorSettings}
              onUpdateSettings={(newSettings) => setEditorSettings((s) => ({ ...s, ...newSettings }))}
              diagnostics={result?.diagnostics || []}
              targetLine={targetLine}
              onResetActiveFile={handleResetActiveFile}
            />
          </div>

          {/* Layout orientation separator */}
          <div className="hidden md:flex items-center justify-center w-1.5 bg-[#1e1e1e] border-x border-[#3e3e3e] hover:bg-[#007acc] cursor-col-resize transition-colors select-none group">
            <div className="w-0.5 h-6 rounded-full bg-[#3e3e3e] group-hover:bg-white" />
          </div>

          {/* Output Panel (Right / Bottom) */}
          <div className={`flex-1 min-w-0 ${layoutMode === 'split-horizontal' ? 'h-1/2 md:h-full md:w-2/5' : 'h-1/2 w-full'}`}>
            <OutputPanel
              result={result}
              isRunning={isRunning}
              stdin={stdin}
              onChangeStdin={setStdin}
              onClearOutput={() => setResult(null)}
              onJumpToLine={handleJumpToLine}
              onAiDebug={handleAiDebug}
            />
          </div>
        </main>
      </div>

      {/* Signature VS Code Status Bar matching High Density Design HTML */}
      <div className="h-6 bg-[#007acc] flex items-center justify-between px-3 text-[10px] text-white font-mono select-none z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="hover:bg-white/20 px-1 py-0.5 rounded transition-colors flex items-center gap-1"
            title="Toggle Explorer Sidebar"
          >
            <span>{showSidebar ? 'Hide Explorer' : 'Show Explorer'}</span>
          </button>
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${errorCount > 0 ? 'bg-red-300' : 'bg-white/40'}`} />
            <span>{errorCount} Errors</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${warningCount > 0 ? 'bg-yellow-300' : 'bg-white/40'}`} />
            <span>{warningCount} Warnings</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span>Spaces: {editorSettings.tabSize}</span>
          <span>UTF-8</span>
          <span className="uppercase">{compilerSettings.cppVersion}</span>
          <span className="hidden sm:inline">Linux x86_64</span>
        </div>
      </div>

      {/* Floating toast notification */}
      {statusNotification && (
        <div className="fixed bottom-8 right-4 z-50 bg-[#252526] border border-[#3e3e3e] text-white text-xs px-3 py-2 rounded shadow-2xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#4ade80]" />
          <span>{statusNotification}</span>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        compilerSettings={compilerSettings}
        onUpdateCompilerSettings={setCompilerSettings}
        editorSettings={editorSettings}
        onUpdateEditorSettings={setEditorSettings}
      />

      {/* Gemini AI Assistant Modal */}
      <AiAssistantModal
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        activeFile={activeFile}
        lastError={result && !result.success ? `${result.stderr}\n${result.stdout}` : ''}
        onApplyCode={handleApplyAiCode}
      />
    </div>
  );
}
