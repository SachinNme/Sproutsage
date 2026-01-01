
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createChat } from '../services/geminiService';
import { ChatMessage, UserProfile } from '../types';
import { Button } from './Button';
import { GenerateContentResponse } from '@google/genai';

const PROFILE_KEY = 'sproutsage_user_profile';

export const GardeningChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatInstance, setChatInstance] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: 'Gardener', avatar: null });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadProfile = () => {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (saved) {
        setUserProfile(JSON.parse(saved));
      }
    };
    loadProfile();
    window.addEventListener('storage', loadProfile);
    return () => window.removeEventListener('storage', loadProfile);
  }, []);

  useEffect(() => {
    setChatInstance(createChat());
    setMessages([{
      id: 'welcome',
      role: 'model',
      text: "Hello! I'm SproutSage. Whether you're dealing with a wilting fern or planning a prize-winning rose garden, I'm here to help. What's on your mind?",
      timestamp: Date.now()
    }]);
  }, []);

  const scrollToBottom = () => {
    if (!searchQuery) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    return messages.filter(msg => 
      msg.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [messages, searchQuery]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading || !chatInstance) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSearchQuery(''); 
    setLoading(true);

    try {
      const response = await chatInstance.sendMessageStream({ message: input });
      let fullText = '';
      
      const modelMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: modelMessageId,
        role: 'model',
        text: '',
        timestamp: Date.now()
      }]);

      for await (const chunk of response) {
        const c = chunk as GenerateContentResponse;
        fullText += (c.text || '');
        setMessages(prev => prev.map(msg => 
          msg.id === modelMessageId ? { ...msg, text: fullText } : msg
        ));
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I'm sorry, I encountered an error. Could you try asking that again?",
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[75vh] bg-white rounded-3xl shadow-xl overflow-hidden animate-in fade-in duration-500 border border-slate-100">
      {/* Header */}
      <div className="bg-emerald-600 p-6 flex items-center gap-4 text-white shadow-md z-10">
        <div className="bg-emerald-500 p-2 rounded-full border-2 border-emerald-400">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3C7.58 3 4 4.79 4 7c0 .52.21 1.01.59 1.45L3 13.5l3.5-1.5c1.45.92 3.33 1.5 5.5 1.5s4.05-.58 5.5-1.5l3.5 1.5-1.59-5.05C19.79 8.01 20 7.52 20 7c0-2.21-3.58-4-8-4zm0 2c3.31 0 6 1.34 6 2s-2.69 2-6 2-6-1.34-6-2 2.69-2 6-2zm0 10c-2.33 0-4.43.37-6 1-.58.23-1 .58-1 1s.42.77 1 1 3.67 1 6 1 5.42-.37 6-1 1-.77 1-1-.42-.77-1-1c-1.57-.63-3.67-1-6-1z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold">Ask SproutSage</h2>
          <p className="text-emerald-100 text-sm">Expert Gardening Knowledge</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            className="block w-full pl-10 pr-10 py-2 border border-slate-200 rounded-full leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all"
            placeholder="Search conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-2 duration-300`}
            >
              {/* Avatar */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm border overflow-hidden ${
                msg.role === 'user' 
                  ? 'bg-amber-100 border-amber-200 text-amber-600' 
                  : 'bg-emerald-100 border-emerald-200 text-emerald-600'
              }`}>
                {msg.role === 'user' ? (
                  userProfile.avatar ? (
                    <img src={userProfile.avatar} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
                  </svg>
                )}
              </div>

              {/* Message Bubble */}
              <div 
                className={`max-w-[75%] p-4 rounded-2xl shadow-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user' 
                    ? 'bg-emerald-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                }`}
              >
                <div className={`text-[10px] mb-1 font-bold opacity-70 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.role === 'user' ? userProfile.name : 'SproutSage'}
                </div>
                {msg.text || (loading && msg.role === 'model' && msg.id === messages[messages.length-1].id ? <TypingIndicator /> : null)}
                <div className={`text-[10px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-right text-emerald-100' : 'text-left text-slate-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 py-12">
            <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No messages found matching "{searchQuery}"</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-6 bg-white border-t border-slate-100">
        <div className="flex gap-3">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about pruning, pests, soil..."
            className="flex-1 px-6 py-4 rounded-full bg-slate-100 border-none focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-slate-700"
            disabled={loading}
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || loading}
            className="!px-6 !rounded-full"
          >
            <svg className="w-6 h-6 rotate-90" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </Button>
        </div>
      </form>
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex space-x-1 py-1">
    <div className="w-2 h-2 bg-emerald-300 rounded-full animate-bounce"></div>
    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-75"></div>
    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-150"></div>
  </div>
);
