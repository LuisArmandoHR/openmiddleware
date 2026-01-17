import { CodeBlock as CodeshineBlock } from '@oxog/codeshine/react';
import { useTheme } from './theme-provider';
import { clsx } from 'clsx';
import { useState, useEffect } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  terminal?: boolean;
}

export function CodeBlock({
  code,
  language = 'typescript',
  filename,
  showLineNumbers = false,
  terminal = false
}: CodeBlockProps) {
  const { resolvedTheme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isTerminal = terminal || language === 'bash' || language === 'shell';
  const isDark = resolvedTheme === 'dark';

  // GitHub-style theme colors
  const themeColors = {
    dark: {
      background: '#0d1117',
      headerBg: '#161b22',
      border: '#30363d',
      badgeBg: '#21262d',
      badgeText: '#7ee787',
      copyText: '#8b949e',
      copyHoverBg: '#30363d',
      copyHoverText: '#ffffff',
      copyHoverBorder: '#484f58',
      lineNumber: '#484f58',
      lineNumberBorder: '#30363d',
    },
    light: {
      background: '#ffffff',
      headerBg: '#f6f8fa',
      border: '#d0d7de',
      badgeBg: '#eaeef2',
      badgeText: '#0550ae',
      copyText: '#656d76',
      copyHoverBg: '#d0d7de',
      copyHoverText: '#1f2328',
      copyHoverBorder: '#8c959f',
      lineNumber: '#8c959f',
      lineNumberBorder: '#d0d7de',
    }
  };

  const colors = isDark ? themeColors.dark : themeColors.light;

  // Fallback for SSR
  if (!mounted) {
    return (
      <div className="rounded-xl overflow-hidden bg-[rgb(var(--card))] border border-[rgb(var(--border))]">
        <div className="p-4">
          <pre className="text-sm font-mono">{code}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(
      'code-block-wrapper relative group rounded-xl overflow-hidden',
      'shadow-lg shadow-[rgb(var(--primary)/0.05)]',
      'border',
      isDark ? 'border-[#30363d]' : 'border-[#d0d7de]',
      isDark ? 'code-block-dark' : 'code-block-light'
    )}>
      {/* Terminal/File Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{
          backgroundColor: colors.headerBg,
          borderColor: colors.border
        }}
      >
        <div className="flex items-center gap-3">
          {/* Traffic lights */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57] shadow-[0_0_6px_rgba(255,95,87,0.5)] transition-transform hover:scale-110" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e] shadow-[0_0_6px_rgba(254,188,46,0.5)] transition-transform hover:scale-110" />
            <div className="w-3 h-3 rounded-full bg-[#28c840] shadow-[0_0_6px_rgba(40,200,64,0.5)] transition-transform hover:scale-110" />
          </div>
          {/* Filename or Terminal */}
          {(filename || isTerminal) && (
            <div
              className="flex items-center gap-2 ml-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border"
              style={{
                backgroundColor: colors.badgeBg,
                color: colors.badgeText,
                borderColor: colors.border
              }}
            >
              {isTerminal ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>terminal</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{filename}</span>
                </>
              )}
            </div>
          )}
        </div>
        {/* Copy button */}
        <button
          onClick={handleCopy}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
            'opacity-0 group-hover:opacity-100',
            'border',
            copied && 'bg-green-500/20 text-green-400 border-green-500/30'
          )}
          style={!copied ? {
            backgroundColor: colors.badgeBg,
            color: colors.copyText,
            borderColor: colors.border
          } : undefined}
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div
        className="overflow-x-auto"
        style={{ backgroundColor: colors.background }}
      >
        <CodeshineBlock
          code={code.trim()}
          language={language}
          theme={isDark ? 'github-dark' : 'github-light'}
          lineNumbers={showLineNumbers}
        />
      </div>

      {/* Custom styles for codeshine */}
      <style>{`
        .code-block-wrapper pre {
          margin: 0 !important;
          padding: 1rem !important;
          background: transparent !important;
          overflow-x: auto !important;
        }

        .code-block-wrapper code {
          font-family: var(--font-mono) !important;
          font-size: 0.875rem !important;
          line-height: 1.7 !important;
          display: block !important;
        }

        /* Each line should be a flex row */
        .code-block-wrapper .cs-line {
          display: flex !important;
          min-height: 1.7em !important;
        }

        /* Line number styling */
        .code-block-wrapper .cs-line-number {
          display: inline-block !important;
          min-width: 3rem !important;
          padding-right: 1rem !important;
          text-align: right !important;
          user-select: none !important;
          flex-shrink: 0 !important;
        }

        /* Dark mode line numbers */
        .code-block-dark .cs-line-number {
          color: #484f58 !important;
          border-right: 1px solid #30363d !important;
          margin-right: 1rem !important;
        }

        /* Light mode line numbers */
        .code-block-light .cs-line-number {
          color: #8c959f !important;
          border-right: 1px solid #d0d7de !important;
          margin-right: 1rem !important;
        }

        /* Line content */
        .code-block-wrapper .cs-line-content {
          flex: 1 !important;
          white-space: pre !important;
        }

        /* Selection styling */
        .code-block-dark ::selection {
          background: rgba(56, 139, 253, 0.4) !important;
        }

        .code-block-light ::selection {
          background: rgba(84, 174, 255, 0.4) !important;
        }

        /* Copy button hover states */
        .code-block-dark button:not(.bg-green-500\\/20):hover {
          background-color: #30363d !important;
          color: #ffffff !important;
          border-color: #484f58 !important;
        }

        .code-block-light button:not(.bg-green-500\\/20):hover {
          background-color: #d0d7de !important;
          color: #1f2328 !important;
          border-color: #8c959f !important;
        }
      `}</style>
    </div>
  );
}

// Compact inline code component
export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-[rgb(var(--primary)/0.1)] to-[rgb(var(--accent)/0.1)] border border-[rgb(var(--primary)/0.2)] text-[rgb(var(--primary))] font-mono text-sm">
      {children}
    </code>
  );
}
