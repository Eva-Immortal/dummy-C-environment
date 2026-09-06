import React from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  X, 
  Sparkles, 
  HelpCircle, 
  Bug, 
  Zap, 
  Send, 
  Copy, 
  Check, 
  FileCode,
  ArrowRight
} from 'lucide-react';
import { CodeFile } from '../types';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFile: CodeFile;
  lastError: string;
  onApplyCode: (code: string) => void;
}

type AiMode = 'explain' | 'debug' | 'optimize' | 'ask';

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  activeFile,
  lastError,
  onApplyCode,
}) => {
  const [mode, setMode] = React.useState<AiMode>(lastError ? 'debug' : 'explain');
  const [customPrompt, setCustomPrompt] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [responseMarkdown, setResponseMarkdown] = React.useState('');
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Extract first code block from response if present
  const extractedCode = React.useMemo(() => {
    if (!responseMarkdown) return null;
    const match = responseMarkdown.match(/```(?:cpp|c\+\+)?\n([\s\S]*?)```/);
    return match ? match[1].trim() : null;
  }, [responseMarkdown]);

  const runAiQuery = async (selectedMode: AiMode, userQuery?: string) => {
    setLoading(true);
    setApiError(null);
    setResponseMarkdown('');

    try {
      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: selectedMode,
          code: activeFile.content,
          error: lastError || '',
          prompt: userQuery || customPrompt,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResponseMarkdown(data.text);
      } else {
        setApiError(data.error || 'Failed to get response from Gemini.');
      }
    } catch (err: any) {
      setApiError(err.message || 'Network request failed.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && !responseMarkdown && !loading) {
      runAiQuery(mode);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!responseMarkdown) return;
    try {
      await navigator.clipboard.writeText(responseMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#3e3e3e] flex items-center justify-between bg-[#2d2d2d]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#007acc]/20 border border-[#007acc]/40 flex items-center justify-center text-[#519aba]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-xs text-white">C++ Assistant</span>
              <span className="text-[10px] text-[#8e8e8e] ml-2 font-mono">({activeFile.name})</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {responseMarkdown && (
              <button
                onClick={handleCopy}
                className="p-1 text-[#8e8e8e] hover:text-white hover:bg-[#3c3c3c] rounded transition-colors"
                title="Copy AI analysis"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#4ade80]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-[#8e8e8e] hover:text-white hover:bg-[#3c3c3c] rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Action Mode Pills */}
        <div className="px-4 py-2 bg-[#1e1e1e] border-b border-[#3e3e3e] flex flex-wrap items-center gap-2 select-none">
          <button
            onClick={() => {
              setMode('explain');
              runAiQuery('explain');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              mode === 'explain'
                ? 'bg-[#007acc] text-white'
                : 'bg-[#252526] border border-[#3e3e3e] text-[#8e8e8e] hover:text-white'
            }`}
          >
            <HelpCircle className="w-3 h-3" />
            <span>Explain Code</span>
          </button>

          <button
            onClick={() => {
              setMode('debug');
              runAiQuery('debug');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              mode === 'debug'
                ? 'bg-[#007acc] text-white'
                : 'bg-[#252526] border border-[#3e3e3e] text-[#8e8e8e] hover:text-white'
            }`}
          >
            <Bug className="w-3 h-3" />
            <span>Diagnose & Fix</span>
          </button>

          <button
            onClick={() => {
              setMode('optimize');
              runAiQuery('optimize');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              mode === 'optimize'
                ? 'bg-[#007acc] text-white'
                : 'bg-[#252526] border border-[#3e3e3e] text-[#8e8e8e] hover:text-white'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Modernize & Optimize</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 text-[#cccccc] text-xs leading-relaxed space-y-3 bg-[#252526]">
          {loading ? (
            <div className="h-48 flex flex-col items-center justify-center text-[#8e8e8e] gap-2">
              <div className="w-5 h-5 border-2 border-[#007acc] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono">Analyzing code semantics with Gemini...</p>
            </div>
          ) : apiError ? (
            <div className="p-3 rounded bg-[#3b1d1d] border border-[#ff5f56]/40 text-[#ff8e8e] space-y-1">
              <div className="font-semibold text-xs">Error communicating with Gemini:</div>
              <p className="text-[11px] font-mono">{apiError}</p>
            </div>
          ) : responseMarkdown ? (
            <div className="space-y-3">
              {/* Quick action: Apply code if detected */}
              {extractedCode && (
                <div className="flex items-center justify-between p-2.5 rounded bg-[#1f3a2b] border border-[#4ade80]/40 text-[#c2f0d0]">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-[#4ade80]" />
                    <span className="text-[11px]">AI generated executable C++ code.</span>
                  </div>
                  <button
                    onClick={() => {
                      onApplyCode(extractedCode);
                      onClose();
                    }}
                    className="px-2.5 py-1 rounded bg-[#007acc] hover:bg-[#0062a3] text-white text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <span>Apply to {activeFile.name}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="prose prose-invert prose-xs max-w-none prose-pre:bg-[#1e1e1e] prose-pre:border prose-pre:border-[#3e3e3e] prose-code:text-[#519aba] font-mono">
                <ReactMarkdown>{responseMarkdown}</ReactMarkdown>
              </div>
            </div>
          ) : null}
        </div>

        {/* Custom Query Input Box */}
        <div className="p-2.5 border-t border-[#3e3e3e] bg-[#2d2d2d]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customPrompt.trim()) {
                setMode('ask');
                runAiQuery('ask', customPrompt);
              }
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Ask anything about this C++ code (e.g. 'Explain pointer arithmetic')..."
              className="flex-1 bg-[#1e1e1e] text-xs px-2.5 py-1.5 rounded border border-[#3e3e3e] text-white placeholder-[#8e8e8e] focus:outline-none focus:border-[#007acc] font-sans"
            />
            <button
              type="submit"
              disabled={loading || !customPrompt.trim()}
              className="px-3 py-1.5 rounded bg-[#007acc] hover:bg-[#0062a3] disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1 transition-colors"
            >
              <Send className="w-3 h-3" />
              <span>Ask</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
