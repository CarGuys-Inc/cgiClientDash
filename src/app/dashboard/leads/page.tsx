import { Suspense } from 'react'; // 1. Import Suspense
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import LeadPipeline from '@/components/LeadPipeline';

export default function LeadsPipelinePage() {
  return (
    <div className="min-h-screen w-full flex">
      <Sidebar />

      {/* Content column */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          title="Job Pipelines"
          subtitle="Track every applicant from first contact to hire."
        />

        {/* Only the board area scrolls */}
        <main className="flex-1 p-6 overflow-auto">
          {/* 2. Wrap LeadPipeline in Suspense */}
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
              <p className="text-sm text-slate-500 font-medium">Loading Pipelines...</p>
            </div>
          }>
            <LeadPipeline />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

// Optional: Helper icon for the fallback (if you want it to look nice)
function Loader2({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
  );
}