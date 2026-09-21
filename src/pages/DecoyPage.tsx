import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Send, CheckCheck } from 'lucide-react';

interface MockMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isMe: boolean;
}

const INITIAL_MESSAGES: MockMessage[] = [
  {
    id: '1',
    sender: 'Carlos',
    text: 'Hola, ¿pudiste revisar el reporte trimestral de ventas?',
    time: '10:14 AM',
    isMe: false,
  },
  {
    id: '2',
    sender: 'Tú',
    text: 'Sí, estuve revisando los números. El incremento del 12% en servicios en la nube quedó bien sustentado.',
    time: '10:15 AM',
    isMe: true,
  },
  {
    id: '3',
    sender: 'Carlos',
    text: 'Perfecto, entonces preparo las diapositivas para la reunión del lunes con la gerencia.',
    time: '10:17 AM',
    isMe: false,
  },
  {
    id: '4',
    sender: 'Tú',
    text: 'De acuerdo. Me avisas cuando las subas a la carpeta compartida.',
    time: '10:18 AM',
    isMe: true,
  },
];

export const DecoyPage: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<MockMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMsg: MockMessage = {
      id: Date.now().toString(),
      sender: 'Tú',
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Decoy Header */}
      <header className="h-16 px-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
            CP
          </div>
          <div>
            <h2 className="font-semibold text-sm">Carlos Peralta (Coordinación)</h2>
            <p className="text-xs text-emerald-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> En línea
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="hidden sm:inline">Canal Corporativo Seguro</span>
        </div>
      </header>

      {/* Messages Feed */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3 max-w-3xl w-full mx-auto">
        <div className="text-center my-2">
          <span className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-500 text-xs rounded-full">
            Hoy
          </span>
        </div>

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.isMe ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                m.isMe
                  ? 'bg-blue-600 text-white rounded-br-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-xs'
              }`}
            >
              <p className="leading-relaxed">{m.text}</p>
              <div
                className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                  m.isMe ? 'text-blue-100' : 'text-slate-400'
                }`}
              >
                <span>{m.time}</span>
                {m.isMe && <CheckCheck className="w-3 h-3 text-blue-200" />}
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* Message input */}
      <footer className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            placeholder="Escribe un mensaje de trabajo..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center cursor-pointer transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </footer>
    </div>
  );
};
