export default function ReportsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Export Reports</h2>
          <div className="space-y-3">
            <button className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-left font-medium">
              Revenue Report (CSV)
            </button>
            <button className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-left font-medium">
              Orders Report (CSV)
            </button>
            <button className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-left font-medium">
              User Analytics (CSV)
            </button>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Date Range</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">From</label>
              <input type="date" className="w-full px-4 py-3 rounded-xl border border-slate-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">To</label>
              <input type="date" className="w-full px-4 py-3 rounded-xl border border-slate-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
