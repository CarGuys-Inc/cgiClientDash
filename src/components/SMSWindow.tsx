'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Send, Loader2, Check, CheckCheck, AlertCircle } from 'lucide-react';

export default function SMSWindow({ applicant, companyId }: any) {
  const supabase = createClient();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Initial Load and Realtime Subscription
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('sms_conversation_messages')
        .select(`*, sms_conversations!inner(applicant_id, company_id)`)
        .eq('sms_conversations.applicant_id', applicant.id)
        .eq('sms_conversations.company_id', companyId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error("Error fetching messages:", error);
      }
      if (data) setMessages(data);
    };

    fetchMessages();

    // Subscribe to Realtime Updates
    const channel = supabase
      .channel(`chat-${applicant.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'sms_conversation_messages' 
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setMessages((prev) => {
            // Prevent duplicates (especially if a message is sent via the same UI)
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        } else if (payload.eventType === 'UPDATE') {
          // Sync delivery status updates from Twilio
          setMessages((prev) => 
            prev.map(m => m.message_sid === payload.new.message_sid ? payload.new : m)
          );
        }
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [applicant.id, companyId, supabase]);

  // 2. Auto-scroll to bottom logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 3. Send SMS Handler
  const handleSend = async () => {
    if (!inputText.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/twilio/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: applicant.mobile || applicant.phone,
          body: inputText,
          applicantId: applicant.id,
          companyId
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        console.error("Failed to send:", errData.error);
      } else {
        setInputText('');
      }
    } catch (err) {
      console.error("SMS Send Error:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-slate-50 dark:bg-slate-950 rounded-2xl border dark:border-slate-800 overflow-hidden shadow-inner">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
            <p className="text-xs italic">No messages in this conversation yet.</p>
          </div>
        )}
        
        {messages.map((msg) => {
          // 'Internal' = Sent by Company/Agent
          // 'External' = Received from Applicant/Lead
          const isFromMe = msg.type === 'Internal';

          return (
            <div key={msg.id} className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm font-medium shadow-sm transition-all ${
                isFromMe 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-slate-900 border dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none'
              }`}>
                <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                
                <div className={`flex justify-end items-center gap-1 mt-1 opacity-70 text-[9px] ${
                  isFromMe ? 'text-blue-100' : 'text-slate-500'
                }`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  
                  {isFromMe && (
                    <span className="ml-1">
                      {msg.status === 'delivered' ? <CheckCheck size={10} className="text-blue-200" /> : 
                       msg.status === 'failed' ? <AlertCircle size={10} className="text-red-300" /> : 
                       msg.status === 'sent' ? <Check size={10} /> : <Loader2 size={8} className="animate-spin" />}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t dark:border-slate-800">
        <div className="flex gap-2">
          <input 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder:text-slate-400"
          />
          <button 
            onClick={handleSend}
            disabled={sending || !inputText.trim()}
            className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center min-w-[42px] shadow-lg shadow-blue-500/20"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}