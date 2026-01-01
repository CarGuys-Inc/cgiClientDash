'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Send, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AddNoteForm({ applicantId }: { applicantId: string }) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from('client_dashboard_notes')
      .insert([
        { 
          body: content, 
          applicant_id: applicantId, // This links the note to the specific lead
          created_at: new Date().toISOString(),
          created_by: 'b80f2ef3-4d25-4485-9680-413fa324665e'
        }
      ]);

    if (error) {
      console.error('Error saving note:', error.message);
      alert('Failed to save note');
    } else {
      setContent('');
      // router.refresh() tells Next.js to re-fetch the server data 
      // so the new note appearing in the timeline instantly
      router.refresh(); 
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="relative">
        <textarea
          className="w-full bg-white border border-slate-200 rounded-xl p-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none shadow-sm"
          placeholder="Type a new note..."
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="absolute right-3 bottom-3 p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </form>
  );
}