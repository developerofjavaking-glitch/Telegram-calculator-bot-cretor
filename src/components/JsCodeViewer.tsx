import React, { useState, useEffect } from 'react';
import { Copy, Check, Download, FileCode, Terminal, Sparkles } from 'lucide-react';
import { safeFetchJson } from '../utils/api';

interface Props {
  token: string;
  lang: 'bn' | 'en';
}

export const JsCodeViewer: React.FC<Props> = ({ token, lang }) => {
  const [code, setCode] = useState<string>('// Loading JavaScript source code...');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    safeFetchJson<{ code: string }>(`/api/bot/code?token=${encodeURIComponent(token || 'YOUR_BOT_TOKEN_HERE')}`)
      .then((res) => {
        if (res.ok && res.data?.code) {
          setCode(res.data.code);
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'application/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'telegram-calculator-bot.js';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Code Viewer Header */}
      <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
          <FileCode className="w-4 h-4 text-amber-400" />
          <span>calculator-bot.js</span>
          <span className="text-xs bg-amber-400/10 text-amber-300 px-2 py-0.5 rounded border border-amber-400/20 font-mono">
            Node.js / Express / mathjs
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer border border-slate-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? (lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (lang === 'bn' ? 'কোড কপি করুন' : 'Copy Code')}
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition cursor-pointer shadow-md shadow-emerald-900/40"
          >
            <Download className="w-3.5 h-3.5" />
            {lang === 'bn' ? 'ফাইল ডাউনলোড (.js)' : 'Download .js'}
          </button>
        </div>
      </div>

      {/* Code Editor Body */}
      <div className="p-4 bg-[#0a0f18] overflow-x-auto max-h-[500px] text-xs font-mono leading-relaxed text-slate-300 scrollbar-thin">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading code...</div>
        ) : (
          <pre className="selection:bg-sky-500 selection:text-white">
            <code>{code}</code>
          </pre>
        )}
      </div>

      {/* Footer Info & Run Instructions */}
      <div className="bg-slate-950 p-4 border-t border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2 text-slate-300">
          <Terminal className="w-4 h-4 text-sky-400 shrink-0" />
          <span>
            {lang === 'bn' ? 'লোকালি রান করার কমান্ড:' : 'To run locally in Node.js:'}
          </span>
          <code className="bg-slate-900 px-2.5 py-1 rounded text-sky-300 font-mono border border-slate-800">
            npm i express mathjs && node calculator-bot.js
          </code>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-emerald-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'নিরাপদ Math AST এভালুয়েশন' : 'Safe Math AST Evaluation'}</span>
        </div>
      </div>
    </div>
  );
};
