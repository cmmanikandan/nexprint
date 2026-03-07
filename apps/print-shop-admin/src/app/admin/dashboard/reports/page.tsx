export default function AdminReportsPage() {
    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Reports</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Export & Analytics Center</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Export Reports</h2>
                    <div className="space-y-3">
                        <button className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-left font-medium text-sm transition-colors">Revenue Report (CSV)</button>
                        <button className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-left font-medium text-sm transition-colors">Orders Report (CSV)</button>
                        <button className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-left font-medium text-sm transition-colors">User Analytics (CSV)</button>
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
