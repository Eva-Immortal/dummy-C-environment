import React from 'react';
import { 
  Play, 
  Square, 
  Settings, 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  FileCode2, 
  ChevronDown, 
  Cpu
} from 'lucide-react';
import { CompilerHealth, CompilerSettings, Template } from '../types';
import { C_PLUS_PLUS_TEMPLATES } from '../data/templates';

interface HeaderProps {
  isRunning: boolean;
  onRun: () => void;
  onStop: () => void;
  compilerHealth: CompilerHealth | null;
  compilerSettings: CompilerSettings;
  onOpenSettings: () => void;
  onOpenAi: () => void;
  onSelectTemplate: (template: Template) => void;
  activeFileName: string;
  activeFileContent: string;
  onDownloadProject: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isRunning,
  onRun,
  onStop,
  compilerHealth,
  compilerSettings,
  onOpenSettings,
  onOpenAi,
  onSelectTemplate,
  activeFileName,
  activeFileContent,
  onDownloadProject,
}) => {
  const [templateMenuOpen, setTemplateMenuOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setTemplateMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(activeFileContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <header id="ide-header" className="h-10 bg-[#2d2d2d] border-b border-[#3e3e3e] px-3 flex items-center justify-between select-none z-20 text-[#cccccc] font-sans">
      {/* Left section: Window Controls, Project Breadcrumbs, and Templates */}
      <div className="flex items-center gap-3">
        {/* Traffic light window dots */}
        <div className="flex items-center gap-1.5 pr-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
        </div>

        {/* Project Breadcrumb */}
        <div className="text-[11px] font-medium text-[#8e8e8e] flex items-center gap-1.5">
          <span className="text-[#cccccc] font-semibold tracking-tight">CXX-STUDIO</span>
          <span className="opacity-40">/</span>
          <span className="text-white font-mono">{activeFileName}</span>
          <span className="ml-1 text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-[#1e1e1e] text-[#519aba] border border-[#3e3e3e]">
            {compilerSettings.cppVersion}
          </span>
        </div>

        <div className="h-4 w-px bg-[#3e3e3e] mx-1 hidden sm:block" />

        {/* Templates Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="template-select-btn"
            onClick={() => setTemplateMenuOpen(!templateMenuOpen)}
            className="flex items-center gap-1.5 text-[11px] text-[#cccccc] hover:text-white px-2 py-0.5 rounded bg-[#3c3c3c]/60 hover:bg-[#3c3c3c] border border-[#3e3e3e] transition-colors"
            title="Load starter C++ templates"
          >
            <FileCode2 className="w-3 h-3 text-[#519aba]" />
            <span className="hidden sm:inline">Templates</span>
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>

          {templateMenuOpen && (
            <div className="absolute left-0 top-full mt-1 w-72 bg-[#252526] border border-[#3e3e3e] rounded shadow-2xl py-1 z-50 overflow-hidden">
              <div className="px-3 py-1 border-b border-[#3e3e3e] text-[10px] uppercase font-bold text-[#8e8e8e] tracking-wider">
                C++ Starter Templates
              </div>
              <div className="max-h-80 overflow-y-auto py-1 divide-y divide-[#3e3e3e]/40">
                {C_PLUS_PLUS_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    id={`template-btn-${tmpl.id}`}
                    onClick={() => {
                      onSelectTemplate(tmpl);
                      setTemplateMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#2a2d2e] transition-colors group flex flex-col gap-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-white group-hover:text-[#519aba]">
                        {tmpl.title}
                      </span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-[#1e1e1e] text-[#8e8e8e]">
                        {tmpl.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8e8e8e] line-clamp-1">
                      {tmpl.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center & Right Action Controls */}
      <div className="flex items-center gap-1.5">
        {/* Compiler Status */}
        <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-[#8e8e8e] px-2 py-0.5 bg-[#1e1e1e] border border-[#3e3e3e] rounded mr-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
          <span>{compilerHealth?.compiler ? 'g++ 12.3.0 Ready' : 'Compiler Ready'}</span>
        </div>

        {/* Primary Run Button */}
        {isRunning ? (
          <button
            id="stop-code-btn"
            onClick={onStop}
            className="px-2.5 py-1 bg-[#d32f2f] hover:bg-[#b71c1c] text-white text-[11px] rounded transition-colors flex items-center gap-1.5 font-medium"
          >
            <Square className="w-2.5 h-2.5 fill-current" />
            <span>Running...</span>
          </button>
        ) : (
          <button
            id="run-code-btn"
            onClick={onRun}
            className="px-3 py-1 bg-[#3c3c3c] hover:bg-[#4a4a4a] text-white text-[11px] rounded transition-colors flex items-center gap-1.5 font-medium border border-[#4e4e4e]"
            title="Compile and run code (Ctrl + Enter)"
          >
            <Play className="w-3 h-3 fill-[#4ade80] text-[#4ade80]" />
            <span>Run</span>
            <kbd className="hidden sm:inline-block ml-0.5 px-1 py-0.2 text-[9px] bg-[#252526] rounded text-[#8e8e8e] border border-[#444]">
              Ctrl+↵
            </kbd>
          </button>
        )}

        {/* AI Assistant Button */}
        <button
          id="ai-assistant-btn"
          onClick={onOpenAi}
          className="px-2.5 py-1 bg-[#007acc] hover:bg-[#0062a3] text-white text-[11px] rounded transition-colors flex items-center gap-1.5 font-medium"
          title="Ask AI to Explain, Debug, or Optimize your C++ code"
        >
          <Sparkles className="w-3 h-3 text-white" />
          <span className="hidden sm:inline">AI Assist</span>
        </button>

        {/* Quick Utility Icons */}
        <button
          id="copy-code-btn"
          onClick={handleCopyCode}
          className="p-1 text-[#8e8e8e] hover:text-white hover:bg-[#3c3c3c] rounded transition-colors"
          title="Copy current code to clipboard"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#4ade80]" /> : <Copy className="w-3.5 h-3.5" />}
        </button>

        <button
          id="download-code-btn"
          onClick={onDownloadProject}
          className="p-1 text-[#8e8e8e] hover:text-white hover:bg-[#3c3c3c] rounded transition-colors"
          title={`Download ${activeFileName}`}
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        <button
          id="settings-btn"
          onClick={onOpenSettings}
          className="p-1 text-[#8e8e8e] hover:text-white hover:bg-[#3c3c3c] rounded transition-colors"
          title="Compiler & Editor Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
