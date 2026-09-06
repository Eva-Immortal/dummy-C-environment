import React from 'react';
import { X, Sliders, Check } from 'lucide-react';
import { CompilerSettings, EditorSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  compilerSettings: CompilerSettings;
  onUpdateCompilerSettings: (settings: CompilerSettings) => void;
  editorSettings: EditorSettings;
  onUpdateEditorSettings: (settings: EditorSettings) => void;
}

const CPP_VERSIONS: { id: CompilerSettings['cppVersion']; label: string; desc: string }[] = [
  { id: 'c++23', label: 'C++23 (Latest Draft)', desc: 'Cutting-edge features: std::print, monadic optional, ranges improvements' },
  { id: 'c++20', label: 'C++20 (Recommended)', desc: 'Concepts, Ranges, Coroutines, std::format, modern auto syntax' },
  { id: 'c++17', label: 'C++17 (Industry Standard)', desc: 'Structured bindings, std::string_view, std::filesystem, fold expressions' },
  { id: 'c++14', label: 'C++14', desc: 'Generic lambdas, return type deduction, make_unique' },
  { id: 'c++11', label: 'C++11 (Modern Baseline)', desc: 'Move semantics, lambda expressions, smart pointers, auto' },
];

const OPT_LEVELS: { id: CompilerSettings['optimization']; label: string; desc: string }[] = [
  { id: '-O2', label: '-O2 (Recommended)', desc: 'High optimization without significant compile-time overhead' },
  { id: '-O0', label: '-O0 (No Optimization)', desc: 'Fastest compile time, best for testing & simple algorithms' },
  { id: '-O3', label: '-O3 (Aggressive Speed)', desc: 'Heavier inlining, loop unrolling, and vectorization' },
  { id: '-Ofast', label: '-Ofast (Fast Math)', desc: 'Breaks strict IEEE math standard for maximum throughput' },
  { id: '-Os', label: '-Os (Size Optimization)', desc: 'Minimizes generated machine code footprint' },
];

const AVAILABLE_WARNINGS = [
  { flag: '-Wall', desc: 'Enable all standard compiler warnings' },
  { flag: '-Wextra', desc: 'Enable additional diagnostic warnings' },
  { flag: '-Wpedantic', desc: 'Strict compliance with ISO C++ standard' },
  { flag: '-Wshadow', desc: 'Warn when variable shadows another in outer scope' },
  { flag: '-Wconversion', desc: 'Warn on implicit conversions altering value' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  compilerSettings,
  onUpdateCompilerSettings,
  editorSettings,
  onUpdateEditorSettings,
}) => {
  if (!isOpen) return null;

  const toggleWarning = (flag: string) => {
    const next = compilerSettings.warnings.includes(flag)
      ? compilerSettings.warnings.filter((w) => w !== flag)
      : [...compilerSettings.warnings, flag];
    onUpdateCompilerSettings({ ...compilerSettings, warnings: next });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#3e3e3e] flex items-center justify-between bg-[#2d2d2d]">
          <div className="flex items-center gap-2 text-white font-semibold text-xs">
            <Sliders className="w-3.5 h-3.5 text-[#519aba]" />
            <span>Compiler & Editor Settings</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#8e8e8e] hover:text-white hover:bg-[#3c3c3c] rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-[#cccccc] bg-[#252526]">
          {/* C++ Standard */}
          <div>
            <label className="font-semibold text-white block mb-1.5 text-[11px] uppercase tracking-wider">
              C++ Language Standard (-std=)
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {CPP_VERSIONS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => onUpdateCompilerSettings({ ...compilerSettings, cppVersion: v.id })}
                  className={`flex items-start justify-between p-2 rounded border text-left transition-all ${
                    compilerSettings.cppVersion === v.id
                      ? 'bg-[#37373d] border-[#007acc] text-white'
                      : 'bg-[#1e1e1e] border-[#3e3e3e] hover:bg-[#2a2d2e] text-[#8e8e8e]'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-xs text-white">{v.label}</div>
                    <div className="text-[10px] text-[#8e8e8e] mt-0.5">{v.desc}</div>
                  </div>
                  {compilerSettings.cppVersion === v.id && (
                    <Check className="w-3.5 h-3.5 text-[#007acc] flex-shrink-0 mt-0.5" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Optimization Level */}
          <div>
            <label className="font-semibold text-white block mb-1.5 text-[11px] uppercase tracking-wider">
              Optimization Level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {OPT_LEVELS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onUpdateCompilerSettings({ ...compilerSettings, optimization: opt.id })}
                  className={`p-2 rounded border text-left transition-all ${
                    compilerSettings.optimization === opt.id
                      ? 'bg-[#37373d] border-[#007acc] text-white'
                      : 'bg-[#1e1e1e] border-[#3e3e3e] hover:bg-[#2a2d2e] text-[#8e8e8e]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-xs text-white">{opt.id}</span>
                    {compilerSettings.optimization === opt.id && (
                      <Check className="w-3 h-3 text-[#007acc]" />
                    )}
                  </div>
                  <div className="text-[10px] text-[#8e8e8e] mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Warning Flags */}
          <div>
            <label className="font-semibold text-white block mb-1.5 text-[11px] uppercase tracking-wider">
              Compiler Diagnostic Flags
            </label>
            <div className="space-y-1">
              {AVAILABLE_WARNINGS.map((warn) => {
                const active = compilerSettings.warnings.includes(warn.flag);
                return (
                  <label
                    key={warn.flag}
                    onClick={() => toggleWarning(warn.flag)}
                    className="flex items-center gap-2.5 p-1.5 rounded bg-[#1e1e1e] border border-[#3e3e3e] hover:bg-[#2a2d2e] cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => {}}
                      className="rounded bg-[#252526] border-[#3e3e3e] text-[#007acc] focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="flex-1 text-[11px]">
                      <span className="font-mono text-white font-semibold">{warn.flag}</span>
                      <span className="text-[#8e8e8e] ml-2">— {warn.desc}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Execution Time Limit */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-white text-[11px] uppercase tracking-wider">
                Execution Timeout Guard
              </label>
              <span className="font-mono text-[#519aba] font-semibold text-xs">
                {compilerSettings.timeLimit / 1000} seconds
              </span>
            </div>
            <input
              type="range"
              min={1000}
              max={10000}
              step={500}
              value={compilerSettings.timeLimit}
              onChange={(e) => onUpdateCompilerSettings({ ...compilerSettings, timeLimit: Number(e.target.value) })}
              className="w-full accent-[#007acc] bg-[#1e1e1e]"
            />
            <p className="text-[10px] text-[#8e8e8e] mt-1">
              Guards against infinite loops during process execution.
            </p>
          </div>

          {/* Editor Preferences */}
          <div className="pt-3 border-t border-[#3e3e3e]">
            <label className="font-semibold text-white block mb-2 text-[11px] uppercase tracking-wider">
              Editor Preferences
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-[#8e8e8e] block mb-1">Tab Size</span>
                <div className="flex gap-1.5">
                  {[2, 4].map((size) => (
                    <button
                      key={size}
                      onClick={() => onUpdateEditorSettings({ ...editorSettings, tabSize: size })}
                      className={`flex-1 py-1 rounded border font-mono text-xs transition-colors ${
                        editorSettings.tabSize === size
                          ? 'bg-[#007acc] text-white border-[#007acc]'
                          : 'bg-[#1e1e1e] text-[#8e8e8e] border-[#3e3e3e] hover:text-white'
                      }`}
                    >
                      {size} sp
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-[#8e8e8e] block mb-1">Font Size</span>
                <div className="flex items-center gap-2">
                  <select
                    value={editorSettings.fontSize}
                    onChange={(e) => onUpdateEditorSettings({ ...editorSettings, fontSize: Number(e.target.value) })}
                    className="w-full bg-[#1e1e1e] border border-[#3e3e3e] rounded py-1 px-2 text-white text-xs font-mono"
                  >
                    {[12, 13, 14, 15, 16, 17, 18, 20].map((size) => (
                      <option key={size} value={size}>
                        {size}px
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-[#3e3e3e] bg-[#2d2d2d] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1 rounded bg-[#007acc] hover:bg-[#0062a3] text-white font-medium text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
