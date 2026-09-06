export interface CodeFile {
  id: string;
  name: string;
  content: string;
  isEntry?: boolean;
}

export interface Diagnostic {
  file: string;
  line: number;
  column: number;
  type: 'error' | 'warning' | 'note';
  message: string;
}

export interface ExecutionResult {
  success: boolean;
  stage: 'compile' | 'run' | 'system';
  compileTimeMs: number;
  executionTimeMs: number;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: string | null;
  signalDescription?: string;
  timedOut?: boolean;
  diagnostics: Diagnostic[];
  error?: string;
  timestamp?: number;
}

export interface CompilerSettings {
  cppVersion: 'c++11' | 'c++14' | 'c++17' | 'c++20' | 'c++23';
  optimization: '-O0' | '-O1' | '-O2' | '-O3' | '-Ofast' | '-Os';
  warnings: string[];
  compilerArgs: string;
  timeLimit: number;
}

export interface EditorSettings {
  fontSize: number;
  tabSize: number;
  lineWrapping: boolean;
}

export interface Template {
  id: string;
  title: string;
  category: string;
  description: string;
  files: { name: string; content: string }[];
  stdin?: string;
}

export interface CompilerHealth {
  status: string;
  compiler: string | null;
  version: string;
  hasGemini: boolean;
}
