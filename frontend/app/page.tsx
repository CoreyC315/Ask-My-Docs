import ChatPanel from '@/components/ChatPanel';
import UploadPanel from '@/components/UploadPanel';

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-3 flex items-center gap-3 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span className="font-semibold text-gray-900">AskMyDocs</span>
      </header>

      {/* Two-panel layout */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left: upload panel */}
        <aside className="w-72 shrink-0 border-r border-gray-200 bg-white p-5 overflow-y-auto">
          <UploadPanel />
        </aside>

        {/* Right: chat panel */}
        <section className="flex-1 p-5 overflow-hidden">
          <ChatPanel />
        </section>
      </main>
    </div>
  );
}
