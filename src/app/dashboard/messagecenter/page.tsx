"use client";

import React, { useState } from 'react';
import Sidebar from "@/components/Sidebar";
import { 
  Search, Send, Phone, MoreVertical, Calendar, 
  CheckCircle, XCircle, Clock, Paperclip, 
  MessageSquare, Star 
} from 'lucide-react';

// --- Types ---
interface Message {
  id: string;
  sender: 'user' | 'candidate';
  text: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  candidateName: string;
  role: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  status: 'New' | 'Interested' | 'Scheduled' | 'Not Interested';
  aiSentiment: 'positive' | 'neutral' | 'negative';
  messages: Message[];
  email: string;
  phone: string;
  certs: string[];
}

// --- Mock Data ---
const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    candidateName: 'David Rodriguez',
    role: 'Master Tech',
    lastMessage: 'Tuesday works for me. What time?',
    time: '10m',
    unread: true,
    status: 'Interested',
    aiSentiment: 'positive',
    email: 'david.r@example.com',
    phone: '(214) 555-0123',
    certs: ['ASE Master', 'L1'],
    messages: [
      { id: '1', sender: 'user', text: 'Hey David, saw your profile. We have a Master Tech opening at City Ford ($45/hr). Interested in a chat?', timestamp: '10:00 AM' },
      { id: '2', sender: 'candidate', text: 'Yeah, I might be open to looking. What are the hours?', timestamp: '10:05 AM' },
      { id: '3', sender: 'user', text: 'Standard M-F 8-5, rotating Saturdays. We have a guarantee in place too. When are you free to talk?', timestamp: '10:10 AM' },
      { id: '4', sender: 'candidate', text: 'Tuesday works for me. What time?', timestamp: '10:15 AM' },
    ]
  },
  {
    id: '2',
    candidateName: 'Mike Kowalski',
    role: 'Lube Tech',
    lastMessage: 'Not looking right now thanks.',
    time: '2h',
    unread: false,
    status: 'Not Interested',
    aiSentiment: 'negative',
    email: 'mike.k@example.com',
    phone: '(214) 555-0999',
    certs: ['G1'],
    messages: [
      { id: '1', sender: 'user', text: 'Hey Mike, we are hiring Lube Techs at $18/hr. Want to come in?', timestamp: '9:00 AM' },
      { id: '2', sender: 'candidate', text: 'Not looking right now thanks.', timestamp: '11:30 AM' },
    ]
  },
  {
    id: '3',
    candidateName: 'Sarah Chen',
    role: 'Service Advisor',
    lastMessage: 'Can you send me the benefits info?',
    time: '1d',
    unread: false,
    status: 'New',
    aiSentiment: 'neutral',
    email: 'sarah.c@gmail.com',
    phone: '(469) 555-0444',
    certs: ['ASE C1'],
    messages: [
       { id: '1', sender: 'user', text: 'Hi Sarah, are you still looking for Advisor roles?', timestamp: 'Yesterday' },
       { id: '2', sender: 'candidate', text: 'Possibly. Can you send me the benefits info?', timestamp: 'Yesterday' },
    ]
  },
];

export default function InboxPage() {
  const [selectedId, setSelectedId] = useState<string>('1');
  const [inputText, setInputText] = useState('');
  const [filter, setFilter] = useState<'All' | 'Unread' | 'Interested'>('All');

  // Derive current conversation
  const activeChat = MOCK_CONVERSATIONS.find(c => c.id === selectedId) || MOCK_CONVERSATIONS[0];

  // Filter logic
  const filteredList = MOCK_CONVERSATIONS.filter(c => {
    if (filter === 'Unread') return c.unread;
    if (filter === 'Interested') return c.status === 'Interested';
    return true;
  });

  return (
    <div className="flex h-screen bg-white font-sans text-slate-900 overflow-hidden">
      <Sidebar />

      {/* --- COLUMN 1: CONVERSATION LIST (30%) --- */}
      <div className="w-80 flex flex-col border-r border-slate-200 bg-slate-50">
        
        {/* Header & Search */}
        <div className="p-4 border-b border-slate-200 bg-white">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Inbox</h2>
          
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-4">
             {['All', 'Unread', 'Interested'].map(f => (
               <button 
                 key={f}
                 onClick={() => setFilter(f as any)}
                 className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
               >
                 {f}
               </button>
             ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search candidates..." 
              className="w-full pl-9 pr-3 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
            />
          </div>
        </div>

        {/* List Items */}
        <div className="flex-1 overflow-y-auto">
          {filteredList.map((conv) => (
            <div 
              key={conv.id}
              onClick={() => setSelectedId(conv.id)}
              className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors ${selectedId === conv.id ? 'bg-white border-l-4 border-l-indigo-600 shadow-sm' : 'border-l-4 border-l-transparent'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`font-bold text-sm ${conv.unread ? 'text-slate-900' : 'text-slate-600'}`}>
                   {conv.candidateName}
                </span>
                <span className="text-[10px] text-slate-400">{conv.time}</span>
              </div>
              
              <p className="text-xs text-slate-500 truncate mb-2">{conv.lastMessage}</p>
              
              <div className="flex gap-2">
                 {/* Status Badge */}
                 <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    conv.status === 'Interested' ? 'bg-green-50 text-green-700 border-green-200' : 
                    conv.status === 'Not Interested' ? 'bg-red-50 text-red-700 border-red-200' : 
                    'bg-slate-100 text-slate-600 border-slate-200'
                 }`}>
                    {conv.status}
                 </span>
                 
                 {/* AI Sentiment Dot */}
                 {conv.aiSentiment === 'positive' && (
                    <span className="flex items-center gap-1 text-[10px] text-indigo-600 font-medium">
                       <Star className="w-3 h-3 fill-indigo-600" /> Hot Lead
                    </span>
                 )}
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* --- COLUMN 2: ACTIVE CHAT (45%) --- */}
      <div className="flex-1 flex flex-col bg-white">
        
        {/* Chat Header */}
        <div className="h-16 border-b border-slate-200 flex justify-between items-center px-6">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                {activeChat.candidateName.charAt(0)}
             </div>
             <div>
               <h3 className="font-bold text-slate-800 text-sm">{activeChat.candidateName}</h3>
               <p className="text-xs text-slate-500">{activeChat.phone}</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-500">
               <Phone className="w-4 h-4" />
             </button>
             <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-500">
               <MoreVertical className="w-4 h-4" />
             </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
           {activeChat.messages.map((msg) => (
             <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] p-3 rounded-xl text-sm ${
                   msg.sender === 'user' 
                   ? 'bg-indigo-600 text-white rounded-tr-none' 
                   : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                }`}>
                   <p>{msg.text}</p>
                   <p className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {msg.timestamp}
                   </p>
                </div>
             </div>
           ))}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-200 bg-white">
           
           {/* Quick Actions / AI Suggestions */}
           <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              <button className="whitespace-nowrap px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors">
                 ✨ AI Suggestion: Ask for availability
              </button>
              <button className="whitespace-nowrap px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full border border-slate-200 hover:bg-slate-200 transition-colors">
                 Request Resume
              </button>
              <button className="whitespace-nowrap px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full border border-slate-200 hover:bg-slate-200 transition-colors">
                 Send Location
              </button>
           </div>

           <div className="relative">
             <textarea 
               value={inputText}
               onChange={(e) => setInputText(e.target.value)}
               placeholder="Type a message..."
               className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-12 min-h-[48px]"
             />
             <div className="absolute right-2 top-2 flex gap-1">
               <button className="p-2 text-slate-400 hover:text-indigo-600">
                  <Paperclip className="w-4 h-4" />
               </button>
               <button className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm transition-colors">
                  <Send className="w-3.5 h-3.5" />
               </button>
             </div>
           </div>
        </div>
      </div>


      {/* --- COLUMN 3: CONTEXT SIDEBAR (25%) --- */}
      <div className="w-80 bg-white border-l border-slate-200 p-6 flex flex-col overflow-y-auto">
         
         <div className="text-center mb-6">
            <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto flex items-center justify-center text-slate-400 text-2xl font-bold mb-3 border border-slate-200">
               {activeChat.candidateName.charAt(0)}
            </div>
            <h2 className="font-bold text-slate-800 text-lg">{activeChat.candidateName}</h2>
            <p className="text-sm text-indigo-600 font-medium">{activeChat.role}</p>
         </div>

         {/* Quick Actions */}
         <div className="grid grid-cols-2 gap-3 mb-8">
            <button className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors">
               <Calendar className="w-3.5 h-3.5" /> Schedule
            </button>
            <button className="flex items-center justify-center gap-2 py-2 px-3 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors">
               <XCircle className="w-3.5 h-3.5" /> Pass
            </button>
         </div>

         {/* Candidate Details */}
         <div className="space-y-6">
            <div>
               <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Status</h4>
               <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-700 outline-none focus:border-indigo-500">
                  <option>Interested (Hot)</option>
                  <option>Interviewing</option>
                  <option>Passive</option>
                  <option>Not Interested</option>
               </select>
            </div>

            <div>
               <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Certifications</h4>
               <div className="flex flex-wrap gap-2">
                  {activeChat.certs.map(c => (
                     <span key={c} className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-medium">
                        {c}
                     </span>
                  ))}
               </div>
            </div>

            <div>
               <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Contact Info</h4>
               <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm text-slate-600">
                     <Clock className="w-4 h-4 text-slate-400" />
                     Last active: {activeChat.time}
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-600">
                     <MessageSquare className="w-4 h-4 text-slate-400" />
                     {activeChat.email}
                  </li>
               </ul>
            </div>
         </div>
         
         {/* AI Summary Box */}
         <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
               <Star className="w-4 h-4 text-indigo-600 fill-indigo-600" />
               <h4 className="text-xs font-bold text-indigo-900 uppercase">AI Insight</h4>
            </div>
            <p className="text-xs text-indigo-800 leading-relaxed">
               Candidate responded positively to salary range. Mentioned availability for next Tuesday. High probability of hire.
            </p>
         </div>

      </div>

    </div>
  );
}