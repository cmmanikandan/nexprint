'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Loader2, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PrintShopLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const unauthorized = searchParams.get('error') === 'unauthorized';

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;
      const userId = data.user?.id;
      if (!userId) throw new Error('Login failed. Please try again.');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      if (profile?.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (profile?.role === 'shop_owner' || profile?.role === 'staff') {
        router.push('/dashboard');
      } else {
        await supabase.auth.signOut();
        throw new Error('This account cannot access the print shop portal.');
      }

      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
            <Shield size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">NexPrint Shop Portal</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Single Portal Login</p>
          </div>
        </div>

        {unauthorized && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
            <AlertCircle size={16} className="mt-0.5" />
            <p className="text-xs font-bold">Unauthorized account for this portal.</p>
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-700">
            <AlertCircle size={16} className="mt-0.5" />
            <p className="text-xs font-bold">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-11 px-4 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 text-sm"
              placeholder="shop@company.com"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-11 px-4 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
