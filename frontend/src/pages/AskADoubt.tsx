import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { StudyMaterial, DoubtMessage } from '../types';
import { MessageSquare, Send, Sparkles, BookOpen, Bot, User, CheckCircle2 } from 'lucide-react';

export const AskADoubt: React.FC = () => {
  const location = useLocation();
  const initialMaterialId = (location.state as any)?.materialId || '';

  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(initialMaterialId);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DoubtMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Fetch materials list for scope selector
    api.get('/materials')
      .then(res => setMaterials(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    // Start or load doubt conversation for the selected material scope
    setLoading(true);
    api.post('/doubts/conversations', { material_id: selectedMaterialId || undefined })
      .then(res => {
        setConversationId(res.data.conversation.id);
        setMessages(res.data.messages || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedMaterialId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || !conversationId || sending) return;

    const qText = inputQuestion.trim();
    setInputQuestion('');
    setSending(true);

    // Optimistic UI append student message
    const tempStudentMsg: DoubtMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender: 'student',
      content: qText,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempStudentMsg]);

    api.post(`/doubts/conversations/${conversationId}/messages`, {
      content: qText,
      material_id: selectedMaterialId || undefined
    }).then(res => {
      setMessages(prev => [...prev.filter(m => !m.id.startsWith('temp-')), res.data.studentMessage, res.data.aiMessage]);
    }).catch(err => {
      console.error(err);
    }).finally(() => setSending(false));
  };

  const currentMatTitle = selectedMaterialId 
    ? materials.find(m => m.id === selectedMaterialId)?.title 
    : 'All Assigned Study Materials';

  return (
    <div className="space-y-6 max-w-4xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
      
      {/* Header & Scope Selector matching §43 */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <MessageSquare className="w-6 h-6 text-brand-600" />
            <span>Ask a Doubt (AI Assistant)</span>
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Ground answers strictly in your course materials.</p>
        </div>

        {/* Scope Selector */}
        <div className="flex items-center space-x-2 bg-slate-50 p-2 border border-slate-200 rounded-xl">
          <BookOpen className="w-4 h-4 text-brand-600" />
          <span className="text-xs font-bold text-slate-600">Scoped to:</span>
          <select
            value={selectedMaterialId}
            onChange={e => setSelectedMaterialId(e.target.value)}
            className="bg-white text-xs font-bold text-slate-800 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Assigned Materials</option>
            {materials.map(m => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat Messages Panel matching §43 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex-1 overflow-y-auto space-y-4 shadow-inner">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs animate-pulse">Loading conversation context...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-14 h-14 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto">
              <Bot className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Ask anything about {currentMatTitle}</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              The AI assistant will answer based strictly on your accessible study materials and provide source references.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start space-x-3 ${m.sender === 'student' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-8 h-8 bg-brand-600 text-white rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-xl p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                m.sender === 'student'
                  ? 'bg-brand-600 text-white font-medium rounded-tr-none shadow-md'
                  : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-tl-none'
              }`}>
                {m.content}
                {m.sender === 'ai' && (
                  <div className="mt-2 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Grounded in: {currentMatTitle}</span>
                  </div>
                )}
              </div>

              {m.sender === 'student' && (
                <div className="w-8 h-8 bg-slate-800 text-white rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {sending && (
          <div className="flex items-center space-x-2 text-xs text-brand-600 font-semibold animate-pulse">
            <Bot className="w-4 h-4" />
            <span>Assistant is thinking & searching grounded materials...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form matching §43 */}
      <form onSubmit={handleSendMessage} className="flex items-center space-x-3 flex-shrink-0">
        <input
          type="text"
          placeholder="Type your question about this study material..."
          value={inputQuestion}
          onChange={e => setInputQuestion(e.target.value)}
          className="flex-1 px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:outline-none shadow-sm"
        />
        <button
          type="submit"
          disabled={!inputQuestion.trim() || sending}
          className="px-6 py-3.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 transition-all"
        >
          <span>Send</span>
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};
