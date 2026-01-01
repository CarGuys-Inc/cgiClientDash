import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function AllLeadsPage() {
    return (
        <div className="min-h-screen w-full flex">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
            <Topbar
            title="Sequences"
            subtitle="Test Description"
            />
            <main className="flex-1 p-6 overflow-auto">
                <p className="text-slate-400 text-sm">
                    this is test text
                </p>
            </main>
        </div>
        </div>
    )
}