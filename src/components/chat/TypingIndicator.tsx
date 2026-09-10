import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center gap-2 mb-2 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-2xl rounded-bl-xs shadow-sm flex items-center gap-1.5">
        <span className="text-xs text-slate-500 dark:text-slate-400 mr-1 font-medium">
          Escribiendo
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
      </div>
    </div>
  );
};
