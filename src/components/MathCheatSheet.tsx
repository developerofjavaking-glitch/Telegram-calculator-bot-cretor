import React from 'react';
import { Calculator, Check } from 'lucide-react';

interface Props {
  lang: 'bn' | 'en';
  onSelectExpr?: (expr: string) => void;
}

export const MathCheatSheet: React.FC<Props> = ({ lang, onSelectExpr }) => {
  const categories = [
    {
      title: lang === 'bn' ? 'সাধারণ হিসাব' : 'Basic Arithmetic',
      examples: [
        { expr: '25 + 75 * 2', desc: lang === 'bn' ? 'যোগ ও গুণ' : 'Addition & Multiplication' },
        { expr: '(500 - 120) / 4', desc: lang === 'bn' ? 'ব্র্যাকেট ও ভাগ' : 'Parentheses & Division' },
        { expr: '14.5 * 3.2', desc: lang === 'bn' ? 'দশমিক সংখ্যা' : 'Decimal numbers' },
      ],
    },
    {
      title: lang === 'bn' ? 'শতকরা ও পার্সেন্টেজ' : 'Percentage Math',
      examples: [
        { expr: '20% of 850', desc: lang === 'bn' ? '৮৫০ এর ২০%' : '20 percent of 850' },
        { expr: '1200 + 15%', desc: lang === 'bn' ? 'ভ্যাট বা কর যোগ' : 'Add 15% tax to 1200' },
        { expr: '500 - 10%', desc: lang === 'bn' ? '১০% ছাড় বা ডিসকাউন্ট' : '10% discount off 500' },
      ],
    },
    {
      title: lang === 'bn' ? 'পাওয়ার ও রুট' : 'Powers & Roots',
      examples: [
        { expr: 'sqrt(144)', desc: lang === 'bn' ? 'বর্গমূল (Square Root)' : 'Square root of 144' },
        { expr: '2^8', desc: lang === 'bn' ? 'ঘাত বা পাওয়ার (2 to the power 8)' : 'Power (2^8)' },
        { expr: 'cbrt(27)', desc: lang === 'bn' ? 'ঘনমূল (Cube Root)' : 'Cube root of 27' },
      ],
    },
    {
      title: lang === 'bn' ? 'বাংলা সংখ্যা ও সাইন্টিফিক' : 'Bengali Digits & Scientific',
      examples: [
        { expr: '২৫ * ৪ + ৫০', desc: lang === 'bn' ? 'বাংলা অক্ষরে হিসাব' : 'Bengali numerals support' },
        { expr: 'sin(30 deg)', desc: lang === 'bn' ? 'ত্রিকোণমিতিক সাইন' : 'Trigonometric sine' },
        { expr: 'log10(1000)', desc: lang === 'bn' ? 'লগারিদম ভিত্তি ১০' : 'Base-10 Logarithm' },
      ],
    },
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
        <Calculator className="w-5 h-5 text-emerald-400" />
        <h3 className="text-base font-bold text-white">
          {lang === 'bn' ? 'বটের ক্যালকুলেশন ফিচার তালিকা' : 'Supported Math Calculations'}
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat, idx) => (
          <div key={idx} className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-2.5">
                {cat.title}
              </h4>
              <div className="space-y-2">
                {cat.examples.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => onSelectExpr?.(item.expr)}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-sky-500/40 transition cursor-pointer group"
                  >
                    <div className="font-mono text-xs text-white group-hover:text-sky-300 font-semibold flex items-center justify-between">
                      <span>{item.expr}</span>
                      <Check className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
