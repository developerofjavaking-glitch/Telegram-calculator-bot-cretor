import React, { useState } from 'react';
import { Send, Sparkles, RotateCcw, Bot } from 'lucide-react';
import { SimulatorMessage } from '../types';
import { safeFetchJson } from '../utils/api';

interface Props {
  botName?: string;
  botUsername?: string;
  lang: 'bn' | 'en';
}

export const TelegramSimulator: React.FC<Props> = ({
  botName = 'Calculator Bot',
  botUsername,
  lang,
}) => {
  const [messages, setMessages] = useState<SimulatorMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text:
        `👋 **Hello!**\nWelcome to your **JavaScript Telegram Calculator Bot** 🧮\n\n` +
        `Send any math problem directly in chat (e.g. \`150 * 4 + 85\`, \`sqrt(144)\`, \`20% of 500\`) or use the interactive keypad below:`,
      timestamp: '12:00 PM',
      isKeypad: true,
      display: '0',
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [currentExpr, setCurrentExpr] = useState('');
  const [keypadResult, setKeypadResult] = useState<string | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);

  const getTimeString = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle direct text message submission
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || isProcessing) return;

    const userText = inputVal.trim();
    setInputVal('');

    const userMsg: SimulatorMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: getTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const res = await safeFetchJson<any>('/api/bot/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userText }),
      });
      const data = res.data;

      let botReplyText = '';
      if (!res.ok || !data) {
        botReplyText = `⚠️ Server error (${res.error || 'Connection failed'}).`;
      } else if (data.type === 'command') {
        botReplyText = data.message;
      } else if (data.success) {
        botReplyText = `🧮 **Calculation Result**\n━━━━━━━━━━━━━━━━━━━━\n📥 Input: \`${data.input}\`\n📤 Result: \`= ${data.result}\`\n━━━━━━━━━━━━━━━━━━━━\n✨ *Accurate calculation completed.*`;
      } else {
        botReplyText = `⚠️ **Could not calculate:** \`${data.input}\`\n\n❌ Error: ${data.error || 'Invalid expression'}\n💡 Example: \`25 * 40\` or \`sqrt(64) + 12\``;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: botReplyText,
          timestamp: getTimeString(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: '⚠️ Simulator connection error.',
          timestamp: getTimeString(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle keypad button clicks
  const handleKeypadPress = async (action: string) => {
    let nextExpr = currentExpr;
    let nextResult = keypadResult;

    if (action === 'ac') {
      nextExpr = '';
      nextResult = undefined;
    } else if (action === 'del') {
      nextExpr = nextExpr.slice(0, -1);
    } else if (action === '=') {
      if (!nextExpr.trim()) return;
      try {
        const res = await safeFetchJson<any>('/api/bot/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: nextExpr }),
        });
        if (res.ok && res.data?.success && res.data?.result !== undefined) {
          nextResult = res.data.result;
        } else {
          nextResult = 'Error';
        }
      } catch {
        nextResult = 'Error';
      }
    } else {
      // Numbers or operators
      if (nextResult !== undefined && ['+', '-', '*', '/', '^', '%'].includes(action)) {
        nextExpr = nextResult + action;
        nextResult = undefined;
      } else if (nextResult !== undefined) {
        nextExpr = action;
        nextResult = undefined;
      } else {
        nextExpr += action;
      }
    }

    setCurrentExpr(nextExpr);
    setKeypadResult(nextResult);
  };

  const resetChat = () => {
    setCurrentExpr('');
    setKeypadResult(undefined);
    setMessages([
      {
        id: '1',
        sender: 'bot',
        text:
          `👋 **Hello!**\nWelcome to your **JavaScript Telegram Calculator Bot** 🧮\n\n` +
          `Send any math problem directly in chat (e.g. \`150 * 4 + 85\`, \`sqrt(144)\`, \`20% of 500\`) or use the interactive keypad below:`,
        timestamp: getTimeString(),
        isKeypad: true,
        display: '0',
      },
    ]);
  };

  const keypadButtons = [
    [
      { label: 'AC', action: 'ac', bg: 'bg-rose-900/60 hover:bg-rose-800 text-rose-200 border-rose-700/50' },
      { label: '(', action: '(', bg: 'bg-slate-800 hover:bg-slate-700 text-slate-200' },
      { label: ')', action: ')', bg: 'bg-slate-800 hover:bg-slate-700 text-slate-200' },
      { label: '⌫ DEL', action: 'del', bg: 'bg-amber-900/60 hover:bg-amber-800 text-amber-200 border-amber-700/50' },
    ],
    [
      { label: '7', action: '7', bg: 'bg-slate-800 hover:bg-slate-700 text-white font-semibold' },
      { label: '8', action: '8', bg: 'bg-slate-800 hover:bg-slate-700 text-white font-semibold' },
      { label: '9', action: '9', bg: 'bg-slate-800 hover:bg-slate-700 text-white font-semibold' },
      { label: '÷', action: '/', bg: 'bg-sky-900/60 hover:bg-sky-800 text-sky-200 font-bold border-sky-700/50' },
    ],
    [
      { label: '4', action: '4', bg: 'bg-slate-800 hover:bg-slate-700 text-white font-semibold' },
      { label: '5', action: '5', bg: 'bg-slate-800 hover:bg-slate-700 text-white font-semibold' },
      { label: '6', action: '6', bg: 'bg-slate-800 hover:bg-slate-700 text-white font-semibold' },
      { label: '×', action: '*', bg: 'bg-sky-900/60 hover:bg-sky-800 text-sky-200 font-bold border-sky-700/50' },
    ],
    [
      { label: '1', action: '1', bg: 'bg-slate-800 hover:bg-slate-700 text-white font-semibold' },
      { label: '2', action: '2', bg: 'bg-slate-800 hover:bg-slate-700 text-white font-semibold' },
      { label: '3', action: '3', bg: 'bg-slate-800 hover:bg-slate-700 text-white font-semibold' },
      { label: '-', action: '-', bg: 'bg-sky-900/60 hover:bg-sky-800 text-sky-200 font-bold border-sky-700/50' },
    ],
    [
      { label: '0', action: '0', bg: 'bg-slate-800 hover:bg-slate-700 text-white font-semibold' },
      { label: '.', action: '.', bg: 'bg-slate-800 hover:bg-slate-700 text-white font-semibold' },
      { label: '=', action: '=', bg: 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-900/40' },
      { label: '+', action: '+', bg: 'bg-sky-900/60 hover:bg-sky-800 text-sky-200 font-bold border-sky-700/50' },
    ],
    [
      { label: '√ sqrt', action: 'sqrt(', bg: 'bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 text-xs' },
      { label: '^ pow', action: '^', bg: 'bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 text-xs' },
      { label: '%', action: '%', bg: 'bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 text-xs' },
      { label: 'ℹ️ /calc', action: 'ac', bg: 'bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs' },
    ],
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[650px] shadow-2xl overflow-hidden">
      {/* Telegram App Header Bar */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-white font-bold text-lg shadow-md">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white leading-tight">{botName}</h3>
              <span className="text-[10px] bg-sky-500/20 text-sky-400 px-1.5 py-0.2 rounded border border-sky-500/30">
                BOT
              </span>
            </div>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {lang === 'bn' ? 'অনলাইন / প্রস্তুত' : 'online • bot'}
              {botUsername && <span className="text-slate-500 ml-1">@{botUsername}</span>}
            </p>
          </div>
        </div>

        <button
          onClick={resetChat}
          title="Reset Chat"
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Telegram Chat Message History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0e1621] text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3 shadow-md ${
                msg.sender === 'user'
                  ? 'bg-sky-600 text-white rounded-tr-none'
                  : 'bg-[#182533] text-slate-100 border border-slate-800 rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-line leading-relaxed font-sans">{msg.text}</div>

              {/* Render Interactive Keypad inside chat for Bot */}
              {msg.isKeypad && (
                <div className="mt-3 pt-3 border-t border-slate-700/60">
                  {/* Calculator Display Screen */}
                  <div className="bg-[#0b121b] border border-slate-800 rounded-xl p-3 mb-3">
                    <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                      <span>Expression</span>
                      <span className="text-emerald-400 font-mono">JS Engine</span>
                    </div>
                    <div className="font-mono text-base font-bold text-sky-400 break-all min-h-[1.5rem]">
                      {currentExpr || '0'}
                    </div>
                    {keypadResult !== undefined && (
                      <div className="mt-1 pt-1 border-t border-slate-800 font-mono text-sm text-emerald-400 font-semibold flex items-center justify-between">
                        <span className="text-xs text-slate-500">Result:</span>
                        <span>= {keypadResult}</span>
                      </div>
                    )}
                  </div>

                  {/* Buttons Grid */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {keypadButtons.flat().map((btn, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleKeypadPress(btn.action)}
                        className={`h-9 rounded-lg flex items-center justify-center text-xs transition active:scale-95 cursor-pointer border border-transparent ${btn.bg}`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div
                className={`text-[9px] mt-1 text-right ${
                  msg.sender === 'user' ? 'text-sky-200' : 'text-slate-500'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-center gap-1.5 text-slate-400 text-xs italic bg-[#182533] p-2 rounded-xl w-36">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-sky-400" />
            <span>Calculating...</span>
          </div>
        )}
      </div>

      {/* Quick Suggestion Chips */}
      <div className="bg-[#121c27] px-3 py-2 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-300 scrollbar-none">
        <span className="text-slate-500 shrink-0">Try:</span>
        {[
          '150 * 4 + 85',
          'sqrt(144) + 2^3',
          '20% of 750',
          '(1200 - 450) / 5',
          '২৫ * ৪ + ১০',
        ].map((example, i) => (
          <button
            key={i}
            onClick={() => {
              setInputVal(example);
            }}
            className="shrink-0 px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-sky-300 rounded-full cursor-pointer transition border border-slate-700/50"
          >
            {example}
          </button>
        ))}
      </div>

      {/* Chat Input Box */}
      <form
        onSubmit={handleSendMessage}
        className="bg-[#0e1621] p-3 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={
            lang === 'bn'
              ? 'যেকোনো সমীকরণ লিখুন (উদাঃ 25 * 4 + 10)'
              : 'Type any math equation (e.g. 25 * 4 + 10)'
          }
          className="flex-1 bg-[#182533] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
        <button
          type="submit"
          disabled={!inputVal.trim() || isProcessing}
          className="w-10 h-10 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 text-white flex items-center justify-center transition cursor-pointer shrink-0 shadow-md shadow-sky-600/30"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
