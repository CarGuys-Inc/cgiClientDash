'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Send, Loader2, Mail, CheckCircle2 } from 'lucide-react';

export default function EmailWindow({ applicant, companyId }: any) {
  const supabase = createClient();
  const [messages, setMessages] = useState<any[]>([]);
  const [subject, setSubject] = useState('');
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchEmails = async () => {
      const { data } = await supabase
        .from('email_conversation_messages')
        .select(`*, email_conversations!inner(recipient_email)`)
        .eq('email_conversations.recipient_email', applicant.email)
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data);
    };

    fetchEmails();

    const channel = supabase
      .channel(`email-${applicant.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'email_conversation_messages' 
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [applicant.email, supabase]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendEmail = async () => {
    if (!inputText.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: applicant.email,
          subject: subject || "Update from CarGuys Inc",
          body: inputText,
          applicantId: applicant.id,
          companyId
        })
      });
      
      if (res.ok) {
        setInputText('');
        setSubject('');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white dark:bg-slate-950 rounded-2xl border shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-slate-50 dark:bg-slate-900 flex items-center gap-2">
        <Mail className="text-blue-500" size={20} />
        <h3 className="font-semibold text-sm">Email Applicant: {applicant.first_name}</h3>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.type === 'Internal' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-xl max-w-[80%] text-sm ${
              msg.type === 'Internal' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
            }`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
              <div className="text-[10px] mt-1 opacity-70 flex items-center gap-1">
                {new Date(msg.created_at).toLocaleString()}
                {msg.type === 'Internal' && <CheckCircle2 size={10} />}
              </div>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Inputs */}
      <div className="p-4 border-t space-y-3 bg-white dark:bg-slate-900">
        <input 
          placeholder="Subject Line"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-sm border-none outline-none focus:ring-1 focus:ring-blue-500"
        />
        <textarea 
          placeholder="Write your email here..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={3}
          className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-sm border-none outline-none focus:ring-1 focus:ring-blue-500 resize-none"
        />
        <button 
          onClick={handleSendEmail}
          disabled={sending || !inputText.trim() || !applicant.email}
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-all"
        >
          {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
          {sending ? 'Sending...' : 'Send Email'}
        </button>
      </div>
    </div>
  );
}