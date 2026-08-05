import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, Sparkles, RefreshCw, SendHorizontal, Phone, ExternalLink, ChevronDown, User } from 'lucide-react';
import { Language, Product } from '../types';
import { PRODUCTS } from '../data/products';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  recommendedProductIds?: string[];
}

interface ChatBotWidgetProps {
  language: Language;
  onSelectProduct?: (product: Product) => void;
}

export const ChatBotWidget: React.FC<ChatBotWidgetProps> = ({ language, onSelectProduct }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize greeting message on first load or language change
  useEffect(() => {
    if (messages.length === 0) {
      const initialGreeting: ChatMessage = {
        id: 'msg_welcome',
        sender: 'bot',
        text: language === 'km'
          ? 'ជម្រាបសួរចាស! 🌸 ខ្ញុំជា **Lumimei AI** ជំនួយការថែរក្សាស្បែក និងផ្តល់ព័ត៌មានផលិតផលរបស់ Lumimei Cambodia។\n\nតើខ្ញុំអាចជួយផ្តល់ព័ត៌មាន ឬណែនាំផលិតផល Lumimei ណាមួយជូនអ្នកនៅថ្ងៃនេះដែរទេចាស? ✨'
          : language === 'zh'
          ? '您好！🌸 我是 **Lumimei AI** 智能客服助手。\n\n请问今天有什么可以帮您的？我可以为您介绍 Lumimei Clay Mask 泥膜、精华液、纯天然椰子油及草本香皂等产品！✨'
          : 'Hello! 🌸 I am **Lumimei AI**, your personal skincare & customer support assistant for Lumimei Cambodia.\n\nHow can I help you with our natural Khmer skincare products today? ✨',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([initialGreeting]);
    }
  }, [language]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setHasUnread(false);
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for API
      const history = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('model' as const),
        content: m.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history,
          language,
        }),
      });

      const data = await res.json();
      const replyText = data.reply || (language === 'km' ? 'សូមអភ័យទោស ប្រព័ន្ធមានបញ្ហាបន្តិចបន្តួច។' : 'Sorry, something went wrong.');

      // Check if reply mentions specific products to show quick cards
      const matchedProductIds: string[] = [];
      PRODUCTS.forEach((p) => {
        if (
          replyText.toLowerCase().includes(p.name.toLowerCase()) ||
          (p.nameKm && replyText.includes(p.nameKm))
        ) {
          matchedProductIds.push(p.id);
        }
      });

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendedProductIds: matchedProductIds.length > 0 ? matchedProductIds : undefined,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'bot',
        text: language === 'km'
          ? 'សូមអភ័យទោស មិនអាចភ្ជាប់ទៅកាន់ប្រព័ន្ធ AI បានទេ។ សូមសាកល្បងម្តងទៀត ឬទាក់ទងមកកាន់ Telegram: @lumimeicambodia 🌸'
          : 'Sorry, failed to connect. Please try again or contact us via Telegram.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    const resetGreeting: ChatMessage = {
      id: `msg_reset_${Date.now()}`,
      sender: 'bot',
      text: language === 'km'
        ? 'ការសន្ទនាត្រូវបានជម្រះរួចរាល់ចាស! 🌸 តើអ្នកមានចម្ងល់អ្វីបន្ថែមទៀតទេ?'
        : 'Chat cleared! 🌸 How else can I assist you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([resetGreeting]);
  };

  const quickPromptsKm = [
    '🌸 Lumimei Clay Mask ប្រើដូចម្តេច?',
    '💧 Lumimei សេរ៉ូម ជួយអ្វីខ្លះ?',
    '🛍️ បញ្ជីតម្លៃផលិតផលទាំងអស់',
    '🚚 សេវាដឹកជញ្ជូន និងទូទាត់ប្រាក់',
  ];

  const quickPromptsEn = [
    '🌸 How to use Lumimei Clay Mask?',
    '💧 Benefits of Lumimei Serum?',
    '🛍️ Full Lumimei Price List',
    '🚚 Shipping & Payment methods',
  ];

  const quickPromptsZh = [
    '🌸 Lumimei Clay Mask 泥膜使用方法？',
    '💧 Lumimei 精华液功效？',
    '🛍️ Lumimei 完整价格表',
    '🚚 配送与支付方式',
  ];

  const currentPrompts = language === 'km' ? quickPromptsKm : language === 'zh' ? quickPromptsZh : quickPromptsEn;

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            id="lumimei-chatbot-trigger"
            onClick={() => {
              setIsOpen(true);
              setHasUnread(false);
            }}
            className="group relative flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-4 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <div className="relative">
              <Bot className="w-6 h-6 text-emerald-100 group-hover:rotate-12 transition-transform duration-300" />
              {hasUnread && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 border-2 border-white"></span>
                </span>
              )}
            </div>
            <span className="font-medium text-sm hidden sm:inline-block pr-1">
              {language === 'km' ? 'Lumimei AI ឆាត' : language === 'zh' ? 'Lumimei AI 客服' : 'Lumimei AI Chat'}
            </span>
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          </button>
        )}
      </div>

      {/* Floating Chat Window Modal */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[420px] sm:h-[620px] z-50 flex flex-col bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20 shadow-inner">
                <Bot className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-base leading-tight">Lumimei AI Assistant</h3>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-xs text-emerald-200">
                  {language === 'km' ? 'ជំនួយការថែរក្សាស្បែក 24/7' : language === 'zh' ? '24/7 护肤美妆智能助手' : '24/7 Skincare Assistant'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                title={language === 'km' ? 'ជម្រះការសន្ទនា' : 'Clear chat'}
                className="p-1.5 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Contact Banner */}
          <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-800">
            <span className="flex items-center gap-1 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {language === 'km' ? 'ឆ្លើយតបរហ័សទាន់ចិត្ត ឥតគិតថ្លៃ' : 'Instant AI Answers'}
            </span>
            <a
              href="https://t.me/lumimeicambodia"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-emerald-700 font-semibold hover:underline"
            >
              <Phone className="w-3 h-3" />
              Telegram @lumimeicambodia
            </a>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className={`flex items-end gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {msg.sender === 'bot' ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs flex-shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs font-bold shadow-xs flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm shadow-xs whitespace-pre-wrap leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>

                {/* Recommended Product Cards inside Chat */}
                {msg.recommendedProductIds && msg.recommendedProductIds.length > 0 && (
                  <div className="mt-2.5 pl-9 w-full grid grid-cols-1 gap-2">
                    {msg.recommendedProductIds.map((pid) => {
                      const prod = PRODUCTS.find((p) => p.id === pid);
                      if (!prod) return null;
                      return (
                        <div
                          key={prod.id}
                          onClick={() => {
                            if (onSelectProduct) onSelectProduct(prod);
                          }}
                          className="flex items-center gap-3 p-2 bg-white rounded-xl border border-emerald-200/80 hover:border-emerald-500 shadow-xs hover:shadow-md transition cursor-pointer group"
                        >
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-12 h-12 object-cover rounded-lg flex-shrink-0 border border-slate-100"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-slate-800 truncate group-hover:text-emerald-700 transition">
                              {language === 'km' && prod.nameKm ? prod.nameKm : prod.name}
                            </h4>
                            <p className="text-xs font-bold text-emerald-600 mt-0.5">
                              ${prod.priceUsd.toFixed(2)}
                            </p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 flex-shrink-0 pr-1" />
                        </div>
                      );
                    })}
                  </div>
                )}

                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 text-xs text-slate-500 flex items-center gap-2 shadow-xs">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                  </div>
                  <span>{language === 'km' ? 'Lumimei AI កំពុងគិត...' : 'Lumimei AI is typing...'}</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Question Prompts */}
          <div className="p-2 bg-white border-t border-slate-100 overflow-x-auto flex gap-1.5 no-scrollbar">
            {currentPrompts.map((promptText, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(promptText)}
                disabled={isLoading}
                className="text-xs whitespace-nowrap bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 rounded-full px-3 py-1.5 transition font-medium disabled:opacity-50"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                language === 'km'
                  ? 'សរសេរសំណួររបស់អ្នកនៅទីនេះ...'
                  : language === 'zh'
                  ? '在此输入您的疑问...'
                  : 'Type your message here...'
              }
              disabled={isLoading}
              className="flex-1 text-sm border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-full px-4 py-2.5 outline-none transition disabled:bg-slate-50"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white p-2.5 rounded-full shadow-md transition-all active:scale-95"
            >
              <SendHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
