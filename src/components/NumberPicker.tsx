'use client';

import { useState } from 'react';
import { Search, Hash, Loader2, CheckCircle2 } from 'lucide-react';
import { searchAvailableNumbers, provisionNumber } from '@/app/actions/twilioNumbers';

export default function NumberPicker({ companyId }: { companyId: number }) {
  const [areaCode, setAreaCode] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [provisioning, setProvisioning] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  const handleSearch = async () => {
    if (areaCode.length !== 3) return;
    setLoading(true);
    const res = await searchAvailableNumbers(companyId, areaCode);
    if (res.success) setResults(res.numbers);
    setLoading(false);
  };

  const handleBuy = async (num: string) => {
    setProvisioning(num);
    const res = await provisionNumber(companyId, num);
    if (res.success) setComplete(true);
    else alert(res.error);
    setProvisioning(null);
  };

  if (complete) return (
    <div className="p-8 text-center bg-emerald-50 rounded-3xl border border-emerald-100 animate-in zoom-in-95">
      <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={48} />
      <h4 className="text-xl font-black">Number Active!</h4>
      <p className="text-sm text-slate-500">Your new business line is ready to send and receive messages.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input 
            value={areaCode}
            onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, '').slice(0,3))}
            placeholder="Enter Area Code (e.g. 616)"
            className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold"
          />
          <Hash className="absolute right-4 top-4 text-slate-400" size={18} />
        </div>
        <button 
          onClick={handleSearch}
          disabled={loading || areaCode.length < 3}
          className="bg-slate-900 text-white px-6 rounded-2xl font-black text-xs uppercase hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Search size={18} />}
        </button>
      </div>

      <div className="space-y-2">
        {results.map((n) => (
          <div key={n.phoneNumber} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex justify-between items-center group hover:border-blue-500 transition-all">
            <div>
              <p className="text-lg font-black">{n.friendlyName}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">{n.locality}, {n.region}</p>
            </div>
            <button 
              onClick={() => handleBuy(n.phoneNumber)}
              disabled={!!provisioning}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50"
            >
              {provisioning === n.phoneNumber ? <Loader2 className="animate-spin" size={14} /> : 'Select'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}