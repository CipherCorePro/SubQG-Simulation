
import React from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, filename }) => {
  return (
    <div className="my-6 rounded-lg shadow-lg overflow-hidden bg-slate-900 border border-slate-700">
      {filename && (
        <div className="text-xs text-sky-300 bg-slate-700/50 px-4 py-2 font-mono">
          {filename}
        </div>
      )}
      <pre className="p-4 text-sm overflow-x-auto text-slate-200 custom-scrollbar">
        <code className={language ? `language-${language}` : ''}>
          {code.trim()}
        </code>
      </pre>
    </div>
  );
};
