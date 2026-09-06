import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const execAsync = promisify(exec);
const app = express();
const PORT = 3000;

app.use(express.json({ limit: '5mb' }));

// Lazy initialize Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Check compiler information
app.get('/api/health', async (_req, res) => {
  try {
    const { stdout } = await execAsync('g++ --version');
    const firstLine = stdout.split('\n')[0] || 'g++ available';
    res.json({
      status: 'ok',
      compiler: 'g++',
      version: firstLine,
      hasGemini: Boolean(process.env.GEMINI_API_KEY),
    });
  } catch (err: any) {
    res.json({
      status: 'limited',
      compiler: null,
      error: err.message,
      hasGemini: Boolean(process.env.GEMINI_API_KEY),
    });
  }
});

interface CodeFile {
  name: string;
  content: string;
}

interface Diagnostic {
  file: string;
  line: number;
  column: number;
  type: 'error' | 'warning' | 'note';
  message: string;
}

function parseDiagnostics(output: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const regex = /([^:\n\r]+):(\d+):(\d+):\s+(error|warning|note):\s+(.+)/g;
  let match;
  while ((match = regex.exec(output)) !== null) {
    diagnostics.push({
      file: match[1].trim(),
      line: parseInt(match[2], 10),
      column: parseInt(match[3], 10),
      type: match[4] as 'error' | 'warning' | 'note',
      message: match[5].trim(),
    });
  }
  return diagnostics;
}

function getSignalDescription(signal: string | null): string {
  if (!signal) return '';
  switch (signal) {
    case 'SIGSEGV':
      return 'Segmentation Fault (SIGSEGV): illegal memory access (e.g. out-of-bounds array indexing, null pointer dereference).';
    case 'SIGFPE':
      return 'Floating Point Exception (SIGFPE): arithmetic error (e.g. division by zero, modulo by zero).';
    case 'SIGABRT':
      return 'Aborted (SIGABRT): program called abort() or assertion failed.';
    case 'SIGILL':
      return 'Illegal Instruction (SIGILL): corrupted stack or invalid CPU instruction.';
    case 'SIGKILL':
    case 'SIGTERM':
      return 'Terminated: process killed by system or timeout.';
    default:
      return `Terminated by signal: ${signal}`;
  }
}

// Execute C++ code endpoint
app.post('/api/execute', async (req, res) => {
  const {
    files = [{ name: 'main.cpp', content: '' }],
    stdin = '',
    cppVersion = 'c++20',
    optimization = '-O2',
    warnings = ['-Wall', '-Wextra'],
    compilerArgs = '',
    timeLimit = 5000,
  } = req.body;

  const validCppVersions = ['c++11', 'c++14', 'c++17', 'c++20', 'c++23'];
  const safeCppVersion = validCppVersions.includes(cppVersion) ? cppVersion : 'c++20';
  const validOpts = ['-O0', '-O1', '-O2', '-O3', '-Ofast', '-Os'];
  const safeOpt = validOpts.includes(optimization) ? optimization : '-O2';

  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'cpp_ide_'));

  try {
    // Write all files
    const cppSources: string[] = [];
    for (const file of files as CodeFile[]) {
      const sanitizedName = path.basename(file.name || 'main.cpp');
      const filePath = path.join(tmpDir, sanitizedName);
      await fs.promises.writeFile(filePath, file.content || '', 'utf8');
      if (sanitizedName.endsWith('.cpp')) {
        cppSources.push(sanitizedName);
      }
    }

    if (cppSources.length === 0) {
      return res.status(400).json({ error: 'No .cpp source file provided' });
    }

    // Prepare compilation command
    const safeWarnings = (warnings || []).filter((w: string) => /^-W[a-zA-Z0-9_-]+$/.test(w));
    const cleanExtraArgs = (compilerArgs || '')
      .split(/\s+/)
      .filter((arg: string) => /^-([a-z0-9_=.-]+)$/i.test(arg))
      .join(' ');

    const binaryPath = path.join(tmpDir, 'program.out');
    const compileArgs = [
      `-std=${safeCppVersion}`,
      safeOpt,
      ...safeWarnings,
      ...cppSources,
      '-o',
      binaryPath,
      ...(cleanExtraArgs ? cleanExtraArgs.split(' ') : []),
    ];

    const compileStart = Date.now();
    const compileResult = await new Promise<{
      exitCode: number | null;
      stdout: string;
      stderr: string;
    }>((resolve) => {
      const proc = spawn('g++', compileArgs, { cwd: tmpDir });
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (d) => { stdout += d.toString(); });
      proc.stderr.on('data', (d) => { stderr += d.toString(); });

      proc.on('close', (exitCode) => {
        resolve({ exitCode, stdout, stderr });
      });

      proc.on('error', (err) => {
        resolve({ exitCode: 1, stdout: '', stderr: `Failed to invoke g++: ${err.message}` });
      });
    });

    const compileDuration = Date.now() - compileStart;

    if (compileResult.exitCode !== 0) {
      const diagnostics = parseDiagnostics(compileResult.stderr);
      return res.json({
        success: false,
        stage: 'compile',
        compileTimeMs: compileDuration,
        executionTimeMs: 0,
        stdout: compileResult.stdout,
        stderr: compileResult.stderr,
        exitCode: compileResult.exitCode,
        signal: null,
        diagnostics,
      });
    }

    // Execution phase
    const maxExecutionMs = Math.min(Math.max(1000, Number(timeLimit) || 5000), 10000);
    const executionStart = Date.now();

    const execResult = await new Promise<{
      stdout: string;
      stderr: string;
      exitCode: number | null;
      signal: string | null;
      timedOut: boolean;
    }>((resolve) => {
      const child = spawn(binaryPath, [], {
        cwd: tmpDir,
      });

      let stdout = '';
      let stderr = '';
      let timedOut = false;
      const MAX_OUTPUT_BYTES = 256 * 1024; // 256 KB

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGKILL');
      }, maxExecutionMs);

      child.stdout.on('data', (chunk) => {
        if (stdout.length < MAX_OUTPUT_BYTES) {
          stdout += chunk.toString();
        } else if (!stdout.endsWith('\n[Output truncated exceeding 256KB]\n')) {
          stdout += '\n[Output truncated exceeding 256KB]\n';
        }
      });

      child.stderr.on('data', (chunk) => {
        if (stderr.length < MAX_OUTPUT_BYTES) {
          stderr += chunk.toString();
        } else if (!stderr.endsWith('\n[Stderr truncated exceeding 256KB]\n')) {
          stderr += '\n[Stderr truncated exceeding 256KB]\n';
        }
      });

      child.on('close', (exitCode, signal) => {
        clearTimeout(timer);
        resolve({
          stdout,
          stderr,
          exitCode,
          signal,
          timedOut,
        });
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        resolve({
          stdout,
          stderr: `Execution error: ${err.message}`,
          exitCode: 1,
          signal: null,
          timedOut: false,
        });
      });

      if (stdin && typeof stdin === 'string') {
        try {
          child.stdin.write(stdin);
          child.stdin.end();
        } catch {
          // Stdin closed early
        }
      } else {
        child.stdin.end();
      }
    });

    const executionDuration = Date.now() - executionStart;
    const diagnostics = parseDiagnostics(compileResult.stderr);

    return res.json({
      success: execResult.exitCode === 0 && !execResult.timedOut && !execResult.signal,
      stage: 'run',
      compileTimeMs: compileDuration,
      executionTimeMs: executionDuration,
      stdout: execResult.stdout,
      stderr: execResult.stderr,
      exitCode: execResult.exitCode,
      signal: execResult.signal,
      signalDescription: getSignalDescription(execResult.signal),
      timedOut: execResult.timedOut,
      diagnostics,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      stage: 'system',
      error: err.message || 'Internal execution server error',
    });
  } finally {
    // Clean up temporary workspace
    try {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
});

// Gemini AI Assistant Endpoint
app.post('/api/ai/assist', async (req, res) => {
  const { mode = 'explain', code = '', error = '', prompt = '' } = req.body;

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({
      error: 'Gemini API key is not configured in Settings > Secrets.',
    });
  }

  try {
    let systemInstruction = 'You are an expert C++ programming instructor and compiler diagnostics assistant. Provide clear, accurate, modern C++ insights formatted in clean Markdown.';
    let contents = '';

    if (mode === 'explain') {
      contents = `Please explain this C++ code thoroughly:
\`\`\`cpp
${code}
\`\`\`
Include:
1. High-level summary of what the program accomplishes.
2. Step-by-step breakdown of key constructs (memory, types, STL algorithms, loops).
3. Big-O Time & Space Complexity analysis.
4. Any potential edge cases or subtleties to be mindful of.`;
    } else if (mode === 'debug') {
      contents = `The following C++ code produced this error/diagnostic during compilation or runtime:
Code:
\`\`\`cpp
${code}
\`\`\`

Diagnostic / Error Output:
\`\`\`
${error}
\`\`\`

User question: ${prompt || 'How do I fix this error?'}

Please provide:
1. Root Cause Explanation: Why this error occurred.
2. The exact corrected code block ready to use.
3. Tips on how to avoid similar C++ pitfalls in the future.`;
    } else if (mode === 'optimize') {
      contents = `Please review and optimize this C++ code for performance and modern best practices (C++20/C++23):
\`\`\`cpp
${code}
\`\`\`

Highlight:
1. Modern C++ idioms (e.g. \`std::string_view\`, \`constexpr\`, structured bindings, ranges, move semantics).
2. Performance gains and cache friendliness.
3. The refactored modernized code.`;
    } else {
      contents = `Regarding this C++ code:
\`\`\`cpp
${code}
\`\`\`
User Query: ${prompt}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    res.json({
      success: true,
      text: response.text || 'No response generated.',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Gemini API request failed',
    });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`C++ IDE Server running on http://localhost:${PORT}`);
  });
}

startServer();
