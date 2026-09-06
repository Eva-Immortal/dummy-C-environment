import React from 'react';
import { 
  Terminal, 
  FileInput, 
  AlertTriangle, 
  Activity, 
  Trash2, 
  Copy, 
  Check, 
  Sparkles,
  Clock,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import { ExecutionResult, Diagnostic } from '../types';

interface OutputPanelProps {
  result: ExecutionResult | null;
  isRunning: boolean;
  stdin: string;
  onChangeStdin: (val: string) => void;
  onClearOutput: () => void;
  onJumpToLine: (line: number) => void;
  onAiDebug: (errorMessage: string) => void;
}

type OutputTab = 'terminal' | 'stdin' | 'diagnostics' | 'stats';

export const OutputPanel: React.FC<OutputPanelProps> = ({
  result,
  isRunning,
  stdin,
  onChangeStdin,
  onClearOutput,
  onJumpToLine,
  onAiDebug,
}) => {
  const [activeTab, setActiveTab] = React.useState<OutputTab>('terminal');
  const [copied, setCopied] = React.useState(false);

  // Auto-switch to diagnostics tab if there's a compilation error
  React.useEffect(() => {
    if (result && !result.success && result.diagnostics.length > 0) {
      if (result.stage === 'compile') {
        setActiveTab('diagnostics');
      }
    }
  }, [result]);

  const handleCopy = async () => {
    const text = result ? `${result.stdout}\n${result.stderr}`.trim() : '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const diagnosticsCount = result?.diagnostics?.length || 0;

  return (
    <div id="output-panel" className="flex flex-col h-full bg-[#1e1e1e] overflow-hidden select-none font-mono">
      {/* Panel Tab Header - VS Code High Density style */}
      <div className="h-7 bg-[#252526] border-b border-[#3e3e3e] flex items-center justify-between px-3">
        <div className="flex items-center gap-4 text-[11px]">
          <button
            id="tab-terminal"
            onClick={() => setActiveTab('terminal')}
            className={`pb-1 cursor-pointer uppercase tracking-wider font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'terminal'
                ? 'border-b-2 border-[#007acc] text-white'
                : 'text-[#8e8e8e] hover:text-[#cccccc] border-b-2 border-transparent'
            }`}
          >
            <span>Terminal</span>
          </button>

          <button
            id="tab-stdin"
            onClick={() => setActiveTab('stdin')}
            className={`pb-1 cursor-pointer uppercase tracking-wider font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'stdin'
                ? 'border-b-2 border-[#007acc] text-white'
                : 'text-[#8e8e8e] hover:text-[#cccccc] border-b-2 border-transparent'
            }`}
          >
            <span>Input (cin)</span>
            {stdin.trim().length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffbd2e]" />
            )}
          </button>

          <button
            id="tab-diagnostics"
            onClick={() => setActiveTab('diagnostics')}
            className={`pb-1 cursor-pointer uppercase tracking-wider font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'diagnostics'
                ? 'border-b-2 border-[#007acc] text-white'
                : 'text-[#8e8e8e] hover:text-[#cccccc] border-b-2 border-transparent'
            }`}
          >
            <span>Diagnostics</span>
            {diagnosticsCount > 0 && (
              <span className="px-1 py-0.2 rounded text-[9px] bg-[#d32f2f] text-white">
                {diagnosticsCount}
              </span>
            )}
          </button>

          <button
            id="tab-stats"
            onClick={() => setActiveTab('stats')}
            className={`pb-1 cursor-pointer uppercase tracking-wider font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'stats'
                ? 'border-b-2 border-[#007acc] text-white'
                : 'text-[#8e8e8e] hover:text-[#cccccc] border-b-2 border-transparent'
            }`}
          >
            <span>Output Info</span>
          </button>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {result && (
            <button
              onClick={handleCopy}
              className="p-1 text-[#8e8e8e] hover:text-white hover:bg-[#3c3c3c] rounded transition-colors"
              title="Copy output"
            >
              {copied ? <Check className="w-3 h-3 text-[#4ade80]" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
          <button
            id="clear-output-btn"
            onClick={onClearOutput}
            className="p-1 text-[#8e8e8e] hover:text-white hover:bg-[#3c3c3c] rounded transition-colors"
            title="Clear output"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Panel Body */}
      <div className="flex-1 overflow-y-auto p-3 text-[12px] text-[#cccccc] select-text">
        {isRunning && (
          <div className="flex items-center gap-2 p-2 bg-[#252526] border border-[#3e3e3e] rounded text-[#519aba] mb-2">
            <span className="w-2.5 h-2.5 border-2 border-[#519aba] border-t-transparent rounded-full animate-spin" />
            <span className="text-[11px]">[g++ compiler] Building executable and streaming stdout...</span>
          </div>
        )}

        {/* Tab 1: Terminal Output */}
        {activeTab === 'terminal' && (
          <div className="space-y-2">
            {result ? (
              <>
                {/* Simulated command line execution header */}
                <div className="space-y-1 pb-1 text-[11px] border-b border-[#2d2d2d]">
                  <div className="flex gap-2">
                    <span className="text-[#4ade80]">[user@clang-env]$</span>
                    <span className="text-[#cccccc]">g++ -std=c++20 main.cpp -O2 -o app</span>
                    <span className="text-[#8e8e8e] ml-auto">({result.compileTimeMs}ms)</span>
                  </div>
                  {result.stage === 'run' && (
                    <div className="flex gap-2">
                      <span className="text-[#4ade80]">[user@clang-env]$</span>
                      <span className="text-[#cccccc]">./app</span>
                      <span className="text-[#8e8e8e] ml-auto">({result.executionTimeMs}ms)</span>
                    </div>
                  )}
                </div>

                {/* Status Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded bg-[#252526] border border-[#3e3e3e] text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        result.success
                          ? 'bg-[#4ade80]'
                          : result.timedOut
                          ? 'bg-[#ffbd2e]'
                          : 'bg-[#ff5f56]'
                      }`}
                    />
                    <span className="font-semibold text-white">
                      {result.success
                        ? 'Process exited with code 0'
                        : result.timedOut
                        ? 'Execution timed out (>5s limit)'
                        : result.stage === 'compile'
                        ? 'Build failed with compiler diagnostics'
                        : 'Runtime terminated abnormally'}
                    </span>
                    {result.exitCode !== null && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1e1e1e] text-[#8e8e8e] border border-[#3e3e3e]">
                        Exit: {result.exitCode}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-[#8e8e8e]">
                    <span>Compile: {result.compileTimeMs}ms</span>
                    {result.stage === 'run' && <span>| Exec: {result.executionTimeMs}ms</span>}
                  </div>
                </div>

                {/* AI Error Debug Suggestion Prompt */}
                {!result.success && (
                  <div className="flex items-center justify-between p-2.5 rounded bg-[#252526] border border-[#3e3e3e] text-[#cccccc]">
                    <div className="flex items-center gap-2 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-[#519aba] flex-shrink-0" />
                      <span className="text-[11px]">Encountered {result.stage === 'compile' ? 'compiler' : 'runtime'} errors?</span>
                    </div>
                    <button
                      id="ai-quick-debug-btn"
                      onClick={() => onAiDebug(result.stderr || result.stdout)}
                      className="px-2 py-0.5 text-[11px] font-medium rounded bg-[#007acc] hover:bg-[#0062a3] text-white transition-colors flex items-center gap-1"
                    >
                      <span>Diagnose with AI</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Signal warning (e.g. Segfault) */}
                {result.signalDescription && (
                  <div className="flex items-start gap-2 p-2.5 rounded bg-[#3b1d1d] border border-[#ff5f56]/40 text-[#ff8e8e]">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#ff5f56] flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-[11px]">Termination Signal: {result.signal}</div>
                      <div className="text-[10px] opacity-90 mt-0.5">{result.signalDescription}</div>
                    </div>
                  </div>
                )}

                {/* Program Standard Output */}
                {result.stdout && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#8e8e8e] font-semibold mb-1">
                      stdout:
                    </div>
                    <pre className="p-2.5 rounded bg-[#1e1e1e] border border-[#3e3e3e] text-white overflow-x-auto whitespace-pre-wrap leading-relaxed text-[12px]">
                      {result.stdout}
                    </pre>
                  </div>
                )}

                {/* Standard Error */}
                {result.stderr && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#ff5f56] font-semibold mb-1">
                      {result.stage === 'compile' ? 'g++ diagnostics (stderr):' : 'stderr:'}
                    </div>
                    <pre className="p-2.5 rounded bg-[#252526] border border-[#ff5f56]/30 text-[#ff8e8e] overflow-x-auto whitespace-pre-wrap leading-relaxed text-[12px]">
                      {result.stderr}
                    </pre>
                  </div>
                )}

                {!result.stdout && !result.stderr && (
                  <div className="p-3 rounded bg-[#252526] border border-[#3e3e3e] text-[#8e8e8e] italic text-[11px]">
                    Process finished with exit code 0. No stdout output.
                  </div>
                )}

                {/* Terminal prompt cursor */}
                <div className="flex items-center gap-1 text-[11px] pt-1">
                  <span className="text-[#4ade80]">[user@clang-env]$</span>
                  <span className="w-2 h-3.5 bg-white animate-pulse inline-block" />
                </div>
              </>
            ) : (
              <div className="h-36 flex flex-col items-center justify-center text-[#8e8e8e] gap-2">
                <Terminal className="w-6 h-6 opacity-40 text-[#519aba]" />
                <p className="text-[11px]">Press "Run" (Ctrl+Enter) to build and execute C++ binary.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Standard Input (cin) */}
        {activeTab === 'stdin' && (
          <div className="flex flex-col h-full space-y-2">
            <div className="text-[#8e8e8e] text-[11px] flex items-center justify-between">
              <span>Standard Input piped to <code className="text-[#ce9178] font-semibold">std::cin</code> / <code className="text-[#ce9178] font-semibold">scanf</code>:</span>
              <span className="text-[10px] text-[#8e8e8e]">Input is sent on execution</span>
            </div>
            <textarea
              id="stdin-textarea"
              value={stdin}
              onChange={(e) => onChangeStdin(e.target.value)}
              placeholder={`Enter input values here...\nExample:\n3\n10 20 30`}
              rows={8}
              className="w-full flex-1 p-2.5 rounded bg-[#1e1e1e] border border-[#3e3e3e] text-white font-mono text-[12px] focus:outline-none focus:border-[#007acc] resize-none"
            />
            <div className="flex items-center justify-between text-[10px] text-[#8e8e8e]">
              <span>Characters: {stdin.length}</span>
              {stdin.length > 0 && (
                <button
                  onClick={() => onChangeStdin('')}
                  className="hover:text-[#ff5f56] underline transition-colors"
                >
                  Clear input
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Diagnostics */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-2">
            {result?.diagnostics && result.diagnostics.length > 0 ? (
              result.diagnostics.map((diag, index) => {
                const isError = diag.type === 'error';
                const isWarning = diag.type === 'warning';
                return (
                  <div
                    key={index}
                    className={`p-2.5 rounded border transition-all ${
                      isError
                        ? 'bg-[#252526] border-[#ff5f56]/50 text-[#ff8e8e]'
                        : isWarning
                        ? 'bg-[#252526] border-[#ffbd2e]/50 text-[#ffe28e]'
                        : 'bg-[#252526] border-[#3e3e3e] text-[#cccccc]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] uppercase font-bold px-1 py-0.2 rounded ${
                            isError
                              ? 'bg-[#ff5f56] text-white'
                              : isWarning
                              ? 'bg-[#ffbd2e] text-black'
                              : 'bg-[#3e3e3e] text-white'
                          }`}
                        >
                          {diag.type}
                        </span>
                        <span className="font-semibold text-white text-[11px]">
                          {diag.file}:{diag.line}:{diag.column}
                        </span>
                      </div>

                      <button
                        onClick={() => onJumpToLine(diag.line)}
                        className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-[#3c3c3c] hover:bg-[#4a4a4a] text-white transition-colors"
                      >
                        <span>Jump to Line {diag.line}</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-[11px] leading-relaxed font-mono opacity-90">
                      {diag.message}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="h-36 flex flex-col items-center justify-center text-[#8e8e8e] gap-1.5">
                <Check className="w-6 h-6 text-[#4ade80] opacity-70" />
                <p className="text-[11px]">No compiler warnings or errors detected.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Stats & Telemetry */}
        {activeTab === 'stats' && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded bg-[#252526] border border-[#3e3e3e]">
                <div className="text-[10px] text-[#8e8e8e]">Compile Time</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {result?.compileTimeMs ? `${result.compileTimeMs} ms` : '—'}
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#252526] border border-[#3e3e3e]">
                <div className="text-[10px] text-[#8e8e8e]">Execution Time</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {result?.executionTimeMs !== undefined ? `${result.executionTimeMs} ms` : '—'}
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#252526] border border-[#3e3e3e]">
                <div className="text-[10px] text-[#8e8e8e]">Exit Code</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {result?.exitCode !== null && result?.exitCode !== undefined ? result.exitCode : '—'}
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#252526] border border-[#3e3e3e]">
                <div className="text-[10px] text-[#8e8e8e]">Signal Status</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {result?.signal ? result.signal : 'None'}
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded bg-[#252526] border border-[#3e3e3e] text-[#8e8e8e] space-y-1 text-[11px]">
              <div className="font-semibold text-white">Environment Specifications:</div>
              <div>• Toolchain: GCC 12.3.0 (x86_64-linux-gnu)</div>
              <div>• Target ABI: System V AMD64 ABI</div>
              <div>• Sandboxing: Process isolation, tmpfs workspace, 5000ms max timeout</div>
              <div>• Standard Library: GNU libstdc++ 12</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
