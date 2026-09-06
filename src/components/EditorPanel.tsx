import React from 'react';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';
import { 
  Plus, 
  X, 
  FileCode, 
  RotateCcw, 
  Trash2, 
  ZoomIn, 
  ZoomOut,
  AlertCircle
} from 'lucide-react';
import { CodeFile, Diagnostic, EditorSettings } from '../types';

interface EditorPanelProps {
  files: CodeFile[];
  activeFileId: string;
  onSelectFile: (id: string) => void;
  onUpdateContent: (id: string, content: string) => void;
  onAddFile: (name: string) => void;
  onDeleteFile: (id: string) => void;
  editorSettings: EditorSettings;
  onUpdateSettings: (settings: Partial<EditorSettings>) => void;
  diagnostics: Diagnostic[];
  targetLine: number | null;
  onResetActiveFile: () => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onUpdateContent,
  onAddFile,
  onDeleteFile,
  editorSettings,
  onUpdateSettings,
  diagnostics,
  targetLine,
  onResetActiveFile,
}) => {
  const [isAddingFile, setIsAddingFile] = React.useState(false);
  const [newFileName, setNewFileName] = React.useState('');
  const editorRef = React.useRef<ReactCodeMirrorRef>(null);

  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  // Jump to specific line when targetLine updates
  React.useEffect(() => {
    if (targetLine && editorRef.current?.view) {
      const view = editorRef.current.view;
      const lineCount = view.state.doc.lines;
      const safeLine = Math.min(Math.max(1, targetLine), lineCount);
      const line = view.state.doc.line(safeLine);
      view.dispatch({
        selection: { anchor: line.from, head: line.to },
        scrollIntoView: true,
      });
      view.focus();
    }
  }, [targetLine]);

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newFileName.trim();
    if (!clean) return;
    const finalName = clean.includes('.') ? clean : `${clean}.cpp`;
    onAddFile(finalName);
    setNewFileName('');
    setIsAddingFile(false);
  };

  const activeDiagnostics = diagnostics.filter(
    (d) => d.file === activeFile.name || d.file.endsWith(activeFile.name)
  );
  const errorCount = activeDiagnostics.filter((d) => d.type === 'error').length;
  const warningCount = activeDiagnostics.filter((d) => d.type === 'warning').length;

  return (
    <div id="editor-panel" className="flex flex-col h-full bg-[#1e1e1e] border-r border-[#3e3e3e] relative overflow-hidden font-sans">
      {/* File Tabs Bar - VS Code High Density style */}
      <div className="h-8 bg-[#252526] border-b border-[#3e3e3e] flex items-center justify-between px-1 overflow-x-auto no-scrollbar select-none">
        <div className="flex items-center h-full">
          {files.map((file) => {
            const isActive = file.id === activeFileId;
            const isHeader = file.name.endsWith('.h') || file.name.endsWith('.hpp');
            return (
              <div
                key={file.id}
                id={`file-tab-${file.id}`}
                onClick={() => onSelectFile(file.id)}
                className={`group flex items-center h-full gap-2 px-3 text-xs font-mono cursor-pointer border-r border-[#3e3e3e] transition-colors ${
                  isActive
                    ? 'bg-[#1e1e1e] text-white border-t-2 border-t-[#007acc]'
                    : 'bg-[#252526] text-[#8e8e8e] hover:text-[#cccccc] hover:bg-[#2a2d2e]'
                }`}
              >
                <span className={`text-[11px] font-bold ${isHeader ? 'text-[#519aba]' : 'text-[#519aba]'}`}>
                  {isHeader ? 'H' : '++'}
                </span>
                <span>{file.name}</span>
                {files.length > 1 && !file.isEntry && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(file.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-[#ff5f56] p-0.5 rounded transition-opacity ml-1"
                    title={`Close ${file.name}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            );
          })}

          {isAddingFile ? (
            <form onSubmit={handleCreateFile} className="flex items-center gap-1 px-2 h-full">
              <input
                type="text"
                autoFocus
                placeholder="filename.h"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onBlur={() => setIsAddingFile(false)}
                className="bg-[#1e1e1e] text-xs px-1.5 py-0.5 rounded border border-[#007acc] text-white focus:outline-none w-28 font-mono"
              />
            </form>
          ) : (
            <button
              id="add-file-btn"
              onClick={() => setIsAddingFile(true)}
              className="p-1.5 text-[#8e8e8e] hover:text-white hover:bg-[#2a2d2e] rounded transition-colors ml-1"
              title="Add new C++ source or header file"
            >
              <Plus className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Editor controls right side */}
        <div className="flex items-center gap-1 text-xs text-[#8e8e8e] pr-1">
          {errorCount > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-white bg-[#d32f2f] px-1.5 py-0.2 rounded font-mono">
              <AlertCircle className="w-2.5 h-2.5" />
              <span>{errorCount}</span>
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-black bg-[#ffbd2e] px-1.5 py-0.2 rounded font-mono font-medium">
              <span>{warningCount}</span>
            </div>
          )}

          {/* Font zoom controls */}
          <button
            onClick={() => onUpdateSettings({ fontSize: Math.max(11, editorSettings.fontSize - 1) })}
            className="p-1 hover:text-white hover:bg-[#3c3c3c] rounded"
            title="Decrease font size"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="text-[10px] font-mono text-[#8e8e8e]">{editorSettings.fontSize}px</span>
          <button
            onClick={() => onUpdateSettings({ fontSize: Math.min(22, editorSettings.fontSize + 1) })}
            className="p-1 hover:text-white hover:bg-[#3c3c3c] rounded"
            title="Increase font size"
          >
            <ZoomIn className="w-3 h-3" />
          </button>

          <button
            onClick={onResetActiveFile}
            className="p-1 hover:text-white hover:bg-[#3c3c3c] rounded ml-0.5"
            title="Reset file content"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* CodeMirror Editor Area */}
      <div 
        className="flex-1 w-full overflow-hidden bg-[#1e1e1e]" 
        style={{ fontSize: `${editorSettings.fontSize}px` }}
      >
        <CodeMirror
          ref={editorRef}
          value={activeFile?.content || ''}
          height="100%"
          theme={oneDark}
          extensions={[cpp()]}
          onChange={(value) => onUpdateContent(activeFile.id, value)}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            history: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            defaultKeymap: true,
            searchKeymap: true,
            historyKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
            tabSize: editorSettings.tabSize,
          }}
          className="h-full font-mono"
        />
      </div>

      {/* Compiler Ready Banner matching Design HTML */}
      <div className="px-3 py-1.5 bg-[#252526] border-t border-[#3e3e3e] flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
          <span className="text-[11px] text-[#8e8e8e] font-sans">
            Compiler Ready: g++ 12.3.0 (Ubuntu 22.04 LTS)
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-[#8e8e8e] font-mono">
          <span>{activeFile.name}</span>
          <span>Tab: {editorSettings.tabSize}</span>
        </div>
      </div>
    </div>
  );
};
