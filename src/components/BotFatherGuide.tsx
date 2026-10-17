import React from 'react';
import { ExternalLink, Copy, Check, MessageSquare, Key, Sparkles, CheckCircle } from 'lucide-react';

interface Props {
  lang: 'bn' | 'en';
  onUseSampleToken?: (token: string) => void;
}

export const BotFatherGuide: React.FC<Props> = ({ lang }) => {
  const [copiedCmd, setCopiedCmd] = React.useState(false);

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Key className="w-4 h-4 text-amber-400" />
          {lang === 'bn' ? 'টেলিগ্রাম বট টোকেন কীভাবে পাবেন? (How to get Bot Token)' : 'How to get a Telegram Bot Token?'}
        </h3>
        <a
          href="https://t.me/BotFather"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-sky-400 hover:text-sky-300 inline-flex items-center gap-1 font-medium"
        >
          <span>Open @BotFather</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1 */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-xs mb-2">
              1
            </div>
            <h4 className="text-sm font-semibold text-slate-200 mb-1">
              {lang === 'bn' ? 'বটফাদার ওপেন করুন' : 'Open BotFather'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'bn'
                ? 'টেলিগ্রামে @BotFather সার্চ করুন অথবা লিংকে ক্লিক করে স্টার্ট করুন।'
                : 'Search @BotFather in Telegram or click link above, then press Start.'}
            </p>
          </div>
          <div className="mt-3">
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:underline font-medium"
            >
              <MessageSquare className="w-3 h-3" />
              t.me/BotFather
            </a>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs mb-2">
              2
            </div>
            <h4 className="text-sm font-semibold text-slate-200 mb-1">
              {lang === 'bn' ? '/newbot কমান্ড পাঠান' : 'Send /newbot command'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'bn'
                ? 'কমান্ড দিয়ে আপনার বটের একটি সুন্দর নাম এবং ইউজারনেম দিন (শেষে bot থাকতে হবে)।'
                : 'Give your bot a friendly name and a unique username ending in "bot" (e.g. MyCalcBot).'}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between bg-slate-900 px-2 py-1.5 rounded border border-slate-800">
            <code className="text-emerald-400 text-xs font-mono">/newbot</code>
            <button
              onClick={() => copyCommand('/newbot')}
              className="text-slate-400 hover:text-white cursor-pointer"
              title="Copy"
            >
              {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs mb-2">
              3
            </div>
            <h4 className="text-sm font-semibold text-slate-200 mb-1">
              {lang === 'bn' ? 'HTTP API টোকেন কপি করুন' : 'Copy HTTP API Token'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'bn'
                ? 'BotFather আপনাকে এমন একটি টোকেন দেবে: `123456789:ABCdefGhI...`। টোকেনটি কপি করে এখানে পেস্ট করুন।'
                : 'BotFather will provide your API token like `123456789:ABCdefGhI...`. Copy and paste it here!'}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'সম্পূর্ণ ফ্রি ও আনলিমিটেড' : '100% Free & Fast'}</span>
          </div>
        </div>
      </div>

      {/* Feature perks */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5 text-slate-300">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          {lang === 'bn' ? 'কোনো সার্ভার হোস্টিং ছাড়াই চলবে' : 'No server setup needed'}
        </span>
        <span className="flex items-center gap-1.5 text-slate-300">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          {lang === 'bn' ? 'ইনলাইন বাটন ক্যালকুলেটর সাপোর্ট' : 'Interactive Inline Keypad'}
        </span>
        <span className="flex items-center gap-1.5 text-slate-300">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          {lang === 'bn' ? 'বাংলা ও ইংরেজি সব সংখ্যার সাপোর্ট' : 'Supports Bengali & English digits'}
        </span>
      </div>
    </div>
  );
};
