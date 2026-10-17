import * as math from 'mathjs';

// Convert Bengali and Arabic digits to standard ASCII digits
export function normalizeDigits(input: string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  
  let result = input;
  for (let i = 0; i < 10; i++) {
    result = result.replaceAll(bengaliDigits[i], i.toString());
    result = result.replaceAll(arabicDigits[i], i.toString());
  }
  return result;
}

// Pre-process math expressions
export function preprocessExpression(rawExpr: string): string {
  let expr = normalizeDigits(rawExpr.trim());

  // Replace common multiplication/division symbols
  expr = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/,/g, '') // remove thousand commas
    .replace(/\[/g, '(')
    .replace(/\]/g, ')')
    .replace(/\{/g, '(')
    .replace(/\}/g, ')');

  // Handle "X% of Y" pattern: e.g. "20% of 500" -> "(20/100) * 500"
  expr = expr.replace(/(\d+(\.\d+)?)\s*%\s*(?:of|\*)\s*(\d+(\.\d+)?)/gi, '($1 / 100) * $3');

  // Handle "X + Y%" pattern: e.g. "200 + 10%" -> "200 + (200 * 0.10)"
  expr = expr.replace(/(\d+(\.\d+)?)\s*([+\-])\s*(\d+(\.\d+)?)\s*%/gi, '$1 $3 ($1 * ($4 / 100))');

  // Handle standalone percentage: "50%" -> "(50/100)"
  expr = expr.replace(/(\d+(\.\d+)?)\s*%/g, '($1 / 100)');

  // Handle power notation: 2^8 remains 2^8 (mathjs handles ^)
  return expr;
}

// Safely evaluate math expression
export function safeEvaluate(expr: string): { success: boolean; result?: string; error?: string } {
  try {
    const cleaned = preprocessExpression(expr);
    if (!cleaned) {
      return { success: false, error: 'Empty expression' };
    }

    // Disallow dangerous keywords
    const blacklist = ['import', 'require', 'process', 'global', 'window', 'document', 'eval', 'Function', 'this', 'constructor', 'prototype'];
    for (const word of blacklist) {
      if (new RegExp(`\\b${word}\\b`, 'i').test(cleaned)) {
        return { success: false, error: 'Unauthorized keyword in expression' };
      }
    }

    // Evaluate in empty scope
    const val = math.evaluate(cleaned, {});

    if (val === undefined || val === null) {
      return { success: false, error: 'Could not calculate result' };
    }

    // Format number nicely
    if (typeof val === 'number') {
      if (isNaN(val)) return { success: false, error: 'Result is NaN (Not a Number)' };
      if (!isFinite(val)) return { success: false, error: 'Result is Infinite (Division by zero)' };
      // Format to prevent floating point inaccuracies like 0.1 + 0.2 = 0.30000000000000004
      const formatted = math.format(val, { precision: 14 });
      return { success: true, result: formatted.toString() };
    }

    if (typeof val === 'object' && val.toString) {
      return { success: true, result: val.toString() };
    }

    return { success: true, result: String(val) };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Invalid mathematical expression' };
  }
}

// Generate inline keyboard for Telegram calculator
export function getCalculatorKeyboard(currentExpr: string = '') {
  return {
    inline_keyboard: [
      [
        { text: 'AC', callback_data: 'calc:ac' },
        { text: '(', callback_data: 'calc:(' },
        { text: ')', callback_data: 'calc:)' },
        { text: '⌫ DEL', callback_data: 'calc:del' },
      ],
      [
        { text: '7', callback_data: 'calc:7' },
        { text: '8', callback_data: 'calc:8' },
        { text: '9', callback_data: 'calc:9' },
        { text: '÷', callback_data: 'calc:/' },
      ],
      [
        { text: '4', callback_data: 'calc:4' },
        { text: '5', callback_data: 'calc:5' },
        { text: '6', callback_data: 'calc:6' },
        { text: '×', callback_data: 'calc:*' },
      ],
      [
        { text: '1', callback_data: 'calc:1' },
        { text: '2', callback_data: 'calc:2' },
        { text: '3', callback_data: 'calc:3' },
        { text: '-', callback_data: 'calc:-' },
      ],
      [
        { text: '0', callback_data: 'calc:0' },
        { text: '.', callback_data: 'calc:.' },
        { text: '=', callback_data: 'calc:=' },
        { text: '+', callback_data: 'calc:+' },
      ],
      [
        { text: '√ sqrt', callback_data: 'calc:sqrt(' },
        { text: '^ pow', callback_data: 'calc:^' },
        { text: '%', callback_data: 'calc:%' },
        { text: 'ℹ️ Help', callback_data: 'calc:help' },
      ],
    ],
  };
}

// Format calculator display message
export function formatCalculatorMessage(expr: string = '', result?: string, note?: string): string {
  const displayExpr = expr || '0';
  let text = `🧮 *Telegram Calculator Bot*\n━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📝 *Expression:*\n\`${displayExpr}\`\n\n`;

  if (result !== undefined) {
    text += `🎯 *Result:*\n\`= ${result}\`\n`;
  } else {
    text += `💡 _Press buttons below or type any math equation in chat!_\n`;
  }

  if (note) {
    text += `\n⚠️ _${note}_\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━\n✨ _Supports +, -, *, /, %, ^, sqrt(), sin(), cos(), etc._`;
  return text;
}
