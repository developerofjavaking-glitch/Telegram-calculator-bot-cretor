import React from 'react';
import { ExternalLink, CheckCircle2, Cloud, Sparkles, Copy, Check, Terminal, Shield } from 'lucide-react';

interface Props {
  lang: 'bn' | 'en';
}

export const VercelGuide: React.FC<Props> = ({ lang }) => {
  const [copied, setCopied] = React.useState(false);

  const copyVercelConfig = () => {
    navigator.clipboard.writeText(`// vercel.json already included in this repository:
{
  "version": 2,
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-bold text-xl shadow-md">
            ▲
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{lang === 'bn' ? 'Vercel-এ বট হোস্ট করার নির্দেশিকা' : 'How to Host on Vercel (100% Free)'}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Serverless Ready
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'bn'
                ? 'vercel.json ও serverless API কনফিগার করা আছে। কোনো অতিরিক্ত সেটিংস ছাড়াই সরাসরি চলবে!'
                : 'Pre-configured with vercel.json & serverless functions. Ready to deploy out of the box.'}
            </p>
          </div>
        </div>

        <a
          href="https://vercel.com/new"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-black text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
        >
          <span>Deploy on Vercel</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* 3 Step Deployment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <div>
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-xs mb-2">
              1
            </div>
            <h4 className="text-sm font-semibold text-slate-200 mb-1">
              {lang === 'bn' ? 'GitHub-এ পুশ করুন' : 'Push to GitHub'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'bn'
                ? 'এই প্রজেক্টের কোড আপনার GitHub রিপোজিটরিতে আপলোড করুন।'
                : 'Push this project codebase to your personal GitHub repository.'}
            </p>
          </div>
          <div className="mt-3">
            <span className="text-[11px] text-sky-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Git repo ready</span>
            </span>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <div>
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center text-xs mb-2">
              2
            </div>
            <h4 className="text-sm font-semibold text-slate-200 mb-1">
              {lang === 'bn' ? 'Vercel-এ ইমপোর্ট করুন' : 'Import to Vercel'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'bn'
                ? 'Vercel ড্যাশবোর্ডে গিয়ে "Add New Project" থেকে আপনার রিপোটি সিলেক্ট করে "Deploy" চাপুন।'
                : 'Select your repo on Vercel and click Deploy. It auto-detects Vite and api/index.ts!'}
            </p>
          </div>
          <div className="mt-3">
            <span className="text-[11px] text-purple-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Zero-config auto build</span>
            </span>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <div>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs mb-2">
              3
            </div>
            <h4 className="text-sm font-semibold text-slate-200 mb-1">
              {lang === 'bn' ? 'বট টোকেন দিয়ে চালু করুন' : 'Enter Bot Token'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'bn'
                ? 'আপনার Vercel লিংকে ভিজিট করে টেলিগ্রাম বট টোকেন দিয়ে "বট চালু করুন" চাপুন। সাথে সাথে Webhook যুক্ত হয়ে বট ২৪/৭ চলবে!'
                : 'Open your Vercel URL, paste your bot token and press Start Bot. It auto-registers the webhook 24/7!'}
            </p>
          </div>
          <div className="mt-3">
            <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Runs 24/7 for free</span>
            </span>
          </div>
        </div>
      </div>

      {/* How it works on Vercel */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Cloud className="w-4 h-4 text-sky-400" />
            {lang === 'bn' ? 'Vercel Serverless আর্কিটেকচার কীভাবে কাজ করে?' : 'How Vercel Serverless Architecture Works'}
          </span>
          <button
            onClick={copyVercelConfig}
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy vercel.json'}</span>
          </button>
        </div>
        <p className="text-slate-400 leading-relaxed">
          {lang === 'bn'
            ? 'Vercel-এ কোনো সার্ভার সার্বক্ষণিক চালু রাখার প্রয়োজন হয় না। টেলিগ্রামে যখনই কেউ হিসাব করতে মেসেজ পাঠায়, টেলিগ্রাম সরাসরি আপনার Vercel-এর `/api/webhook/:token` এন্ডপয়েন্টে রিকোয়েস্ট পাঠায়। Vercel মাত্র ৫ মিলি-সেকেন্ডে উত্তর ক্যালকুলেট করে টেলিগ্রামে পাঠিয়ে দেয় এবং স্লিপ মোডে চলে যায়। ফলে কোনো খরচ ছাড়াই সম্পূর্ণ ফ্রিতে বট আজীবন চালু থাকে!'
            : 'Vercel uses Serverless Functions. Whenever a Telegram user sends an equation, Telegram posts it to your `/api/webhook/:token` endpoint. Vercel spins up, calculates the result in milliseconds, replies, and goes to sleep. 100% free with unlimited 24/7 uptime!'}
        </p>
      </div>
    </div>
  );
};
