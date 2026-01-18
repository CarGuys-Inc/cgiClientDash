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
          <LeadPipeline />
        </main>
      </div>
    </div>
  );
}