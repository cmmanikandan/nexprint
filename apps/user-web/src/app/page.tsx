'use client';

import { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import {
  Printer, Zap, MapPin, ShieldCheck, QrCode,
  Users, Store, Truck, Shield, Sparkles, Globe,
  FileText, Star, CheckCircle2, ChevronRight,
  Wifi, Layers, BarChart3, ArrowRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const stats = [
  { value: '12K+', label: 'Active Users', icon: Users },
  { value: '98%', label: 'Uptime SLA', icon: Wifi },
  { value: '< 3s', label: 'Process Time', icon: Zap },
  { value: '50+', label: 'Print Hubs', icon: MapPin },
];

const roles = [
  { label: 'Super Admin', icon: Shield, gradient: 'from-violet-500 to-purple-600' },
  { label: 'Shop Owner', icon: Store, gradient: 'from-blue-500 to-cyan-500' },
  { label: 'Shop Staff', icon: Store, gradient: 'from-sky-500 to-blue-600' },
  { label: 'Delivery Partner', icon: Truck, gradient: 'from-emerald-500 to-teal-500' },
  { label: 'Customer', icon: Users, gradient: 'from-orange-500 to-rose-500' },
];

const features = [
  { icon: Zap, title: 'Flash Printing', desc: 'Documents processed & optimised before you even arrive at the hub.', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', badge: 'Instant' },
  { icon: ShieldCheck, title: 'AES-256 Security', desc: 'Bank-grade encryption on every file upload and transmission.', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', badge: 'Secure' },
  { icon: QrCode, title: 'QR Pickup', desc: 'Present your QR code at the counter — one scan, files printed.', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', badge: 'Easy' },
  { icon: Globe, title: 'Cloud Sync', desc: 'Access your documents from any device, anytime, anywhere.', color: 'text-violet-400', bg: 'bg-violet-400/10 border-violet-400/20', badge: 'Sync' },
  { icon: Layers, title: 'Multi-Format', desc: 'PDF, DOCX, PPTX, images — we handle every file type seamlessly.', color: 'text-pink-400', bg: 'bg-pink-400/10 border-pink-400/20', badge: 'Universal' },
  { icon: BarChart3, title: 'Live Tracking', desc: 'Real-time order status and print queue visibility for all shops.', color: 'text-cyan-400', bg: 'bg-cyan-400/10 border-cyan-400/20', badge: 'Realtime' },
];

const steps = [
  { n: '01', title: 'Upload', desc: 'Select & upload your document from phone, tablet or PC.', icon: FileText },
  { n: '02', title: 'Configure', desc: 'Choose pages, copies, colour mode and paper size.', icon: Layers },
  { n: '03', title: 'Pay', desc: 'Instant payment via UPI, card or more. Auto-receipt.', icon: CheckCircle2 },
  { n: '04', title: 'Pickup', desc: 'Walk to the hub, scan QR — documents ready & waiting.', icon: QrCode },
];

const testimonials = [
  { name: 'Priya S.', role: 'Student', text: 'Submitted assignments stress-free. No more last-minute queue panic!', stars: 5 },
  { name: 'Rajan M.', role: 'Shop Owner', text: 'NexPrint halved our counter time. Queue management is flawless.', stars: 5 },
  { name: 'Ananya K.', role: 'Customer', text: 'Uploaded from hostel at midnight — picked up prints at 8 AM. Magic.', stars: 5 },
];

export default function LandingPage() {
  const [tick, setTick] = useState(0);
  const [mounted, setMounted] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const id = setInterval(() => setTick(p => (p + 1) % roles.length), 2200);
    return () => clearInterval(id);
  }, []);

  const handleMouse = (e: React.MouseEvent) => {
    const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    mouseX.set((e.clientX - cx) / cx * 25);
    mouseY.set((e.clientY - cy) / cy * 25);
  };

  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  const RoleIcon = roles[tick].icon;

  return (
    <div
      className="min-h-screen bg-[#07070f] font-outfit overflow-x-hidden relative selection:bg-blue-500 selection:text-white"
      onMouseMove={handleMouse}
    >
      {/* ── Parallax orbs ──────────────────────────────── */}
      <motion.div style={{ x: springX, y: springY }} className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[-10%]   w-[700px] h-[700px] rounded-full bg-blue-600/10   blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-700/10 blur-[130px]" />
        <div className="absolute top-[40%] left-[40%]    w-[400px] h-[400px] rounded-full bg-cyan-500/5    blur-[100px]" />
      </motion.div>
      {/* Grid */}
      <div className="fixed inset-0 -z-10 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.013) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.013) 1px,transparent 1px)', backgroundSize: '64px 64px' }} />

      {/* ── NAV ──────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Printer className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white text-xl font-black tracking-tight">NexPrint</span>
            <span className="hidden sm:inline px-2 py-0.5 bg-blue-500/15 border border-blue-500/20 rounded-full text-[8px] font-black text-blue-400 uppercase tracking-widest">v2.0</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-white/30">
            <a href="#how" className="hover:text-white/60 transition-colors">How It Works</a>
            <a href="#features" className="hover:text-white/60 transition-colors">Features</a>
            <a href="#reviews" className="hover:text-white/60 transition-colors">Reviews</a>
            <a href="#contact" className="hover:text-white/60 transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-2">
            {mounted && session ? (
              <a href="/dashboard" className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20">
                Go to Dashboard →
              </a>
            ) : (
              <>
                <a href="/signup" className="hidden sm:flex items-center px-4 py-2.5 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">
                  Sign Up
                </a>
                <a href="/login" className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black rounded-full uppercase tracking-widest transition-all backdrop-blur-sm">
                  Sign In →
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO — full width, no login card ─────────────── */}
      <section className="max-w-7xl mx-auto px-6 pt-40 pb-32 text-center">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }} className="space-y-10">

          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-[0.2em]">
            <Sparkles className="w-3 h-3" />
            Next-Gen Cloud Print Platform
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-400" />
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.9 }}
            className="text-7xl lg:text-8xl xl:text-9xl font-black text-white tracking-tighter leading-[0.87] max-w-5xl mx-auto">
            Print<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 italic">Smarter.</span>{' '}
            <span className="text-white/90">Work<br />Faster.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-white/40 text-lg leading-relaxed max-w-xl mx-auto font-medium">
            Upload from anywhere. Configure in seconds. Collect instantly.<br />
            The cloud printing platform built for modern campuses & cities.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="flex flex-wrap gap-4 justify-center">
            <a href="/login"
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[12px] font-black rounded-2xl uppercase tracking-widest transition-all shadow-2xl shadow-blue-600/30 group">
              Sign In Now <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a href="/signup"
              className="flex items-center gap-2 px-8 py-4 bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.09] hover:border-white/[0.2] text-white text-[12px] font-black rounded-2xl uppercase tracking-widest transition-all">
              Create Account
            </a>
            <a href="#how"
              className="flex items-center gap-2 px-8 py-4 text-white/40 hover:text-white/70 text-[12px] font-black uppercase tracking-widest transition-colors">
              See How It Works <ChevronRight className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto pt-4">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.1 }}
                className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-all group">
                <s.icon className="w-4 h-4 text-blue-400/50 mx-auto mb-2 group-hover:text-blue-400 transition-colors" />
                <p className="text-2xl font-black text-white tracking-tight">{s.value}</p>
                <p className="text-[8px] font-black text-white/25 uppercase tracking-widest mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Animated role ticker */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            className="inline-flex items-center gap-4 px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <motion.div
              key={tick}
              initial={{ opacity: 0, scale: 0.7, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.7, rotate: 10 }}
              transition={{ duration: 0.4 }}
              className={`w-8 h-8 rounded-xl bg-gradient-to-br ${roles[tick].gradient} flex items-center justify-center`}
            >
              <RoleIcon className="w-3.5 h-3.5 text-white" />
            </motion.div>
            <div className="text-left">
              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">One platform for every</p>
              <motion.p key={tick} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
                className="text-sm font-black text-white">{roles[tick].label}</motion.p>
            </div>
            <div className="flex gap-1.5">
              {roles.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === tick ? 'w-5 bg-blue-400' : 'w-1 bg-white/10'}`} />
              ))}
            </div>
          </motion.div>

          {/* Role pills row */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
            className="flex flex-wrap gap-2 justify-center">
            {roles.map((r) => (
              <span key={r.label} className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full text-white bg-gradient-to-r ${r.gradient}`}>
                {r.label}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section id="how" className="max-w-7xl mx-auto px-6 py-28 border-t border-white/[0.05]">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[9px] font-black text-white/40 uppercase tracking-widest mb-4">Process</span>
          <h2 className="text-5xl font-black text-white tracking-tighter">How It Works</h2>
          <p className="text-white/40 mt-3 text-sm max-w-md mx-auto leading-relaxed">From upload to pickup in under 5 minutes.</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <motion.div key={s.n} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
              className="relative p-7 rounded-[2rem] bg-white/[0.03] border border-white/[0.06] hover:border-blue-500/30 hover:bg-white/[0.05] transition-all group">
              <span className="absolute -top-3 -left-3 w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg">{s.n}</span>
              <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center mb-5 group-hover:bg-blue-500/15 transition-all">
                <s.icon className="w-5 h-5 text-white/40 group-hover:text-blue-400 transition-colors" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">{s.title}</h3>
              <p className="text-[12px] text-white/35 leading-relaxed font-medium">{s.desc}</p>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <ChevronRight className="w-5 h-5 text-white/15" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-28 border-t border-white/[0.05]">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[9px] font-black text-white/40 uppercase tracking-widest mb-4">Capabilities</span>
          <h2 className="text-5xl font-black text-white tracking-tighter">Built Different</h2>
          <p className="text-white/40 mt-3 text-sm max-w-md mx-auto leading-relaxed">Every feature designed to save time, protect files, and make printing effortless.</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="p-7 rounded-[2rem] bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.14] hover:bg-white/[0.05] transition-all group cursor-default">
              <div className="flex items-start justify-between mb-5">
                <div className={`w-12 h-12 rounded-2xl border ${f.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <span className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-widest rounded-full border ${f.bg} ${f.color}`}>{f.badge}</span>
              </div>
              <h3 className="text-lg font-black text-white mb-2">{f.title}</h3>
              <p className="text-[12px] text-white/35 leading-relaxed font-medium">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────── */}
      <section id="reviews" className="max-w-7xl mx-auto px-6 py-28 border-t border-white/[0.05]">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[9px] font-black text-white/40 uppercase tracking-widest mb-4">Social Proof</span>
          <h2 className="text-5xl font-black text-white tracking-tighter">Loved by Users</h2>
          <div className="flex items-center justify-center gap-1 text-amber-400 mt-4">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400" />)}
            <span className="ml-2 text-[10px] font-black text-white/30 uppercase tracking-widest">4.9 / 5 · 2,400+ ratings</span>
          </div>
        </motion.div>
        <div className="grid sm:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
              className="p-7 rounded-[2rem] bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-all">
              <div className="flex gap-1 text-amber-400 mb-4">
                {[...Array(t.stars)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-amber-400" />)}
              </div>
              <p className="text-sm text-white/60 leading-relaxed font-medium mb-6">&quot;{t.text}&quot;</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30 border border-white/[0.08] flex items-center justify-center">
                  <span className="text-[11px] font-black text-white">{t.name[0]}</span>
                </div>
                <div>
                  <p className="text-[11px] font-black text-white">{t.name}</p>
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-t border-white/[0.05]">
        <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="relative rounded-[2.5rem] border border-blue-500/20 bg-gradient-to-br from-blue-600/10 to-indigo-600/5 p-14 text-center overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-violet-600/8 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-6">
            <h2 className="text-5xl font-black text-white tracking-tighter">Ready to print smarter?</h2>
            <p className="text-white/40 text-sm max-w-md mx-auto leading-relaxed">Join 12,000+ students, faculty and professionals already using NexPrint every day.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="/signup" className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-black rounded-2xl uppercase tracking-widest transition-all shadow-2xl shadow-blue-600/30 group">
                Create Free Account <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a href="/login" className="flex items-center gap-2 px-8 py-4 bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.1] text-white/60 hover:text-white text-[11px] font-black rounded-2xl uppercase tracking-widest transition-all">
                Sign In →
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── CONTACT ──────────────────────────────────────── */}
      <section id="contact" className="max-w-7xl mx-auto px-6 py-28 border-t border-white/[0.05]">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[9px] font-black text-white/40 uppercase tracking-widest mb-4">Connect</span>
          <h2 className="text-5xl font-black text-white tracking-tighter">Get In Touch</h2>
          <p className="text-white/40 mt-3 text-sm max-w-md mx-auto leading-relaxed">Have a question, partnership idea, or just want to say hi? Find us anywhere below.</p>
        </motion.div>

        {/* Social cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">

          {/* Instagram */}
          <motion.a
            href="https://www.instagram.com/nexora._.in?igsh=bjN5MjM2bnF3ZDVs" target="_blank" rel="noopener noreferrer"
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0 }}
            className="group relative p-7 rounded-[2rem] border border-white/[0.06] bg-white/[0.03] hover:border-pink-500/40 hover:bg-white/[0.06] transition-all overflow-hidden cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-pink-600/0 to-orange-500/0 group-hover:from-pink-600/10 group-hover:to-orange-500/5 transition-all duration-500 rounded-[2rem]" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 flex items-center justify-center mb-5 shadow-xl shadow-pink-500/30 group-hover:scale-110 transition-transform">
                {/* Instagram SVG */}
                <svg className="w-7 h-7 text-white fill-white" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
              </div>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Follow Us</p>
              <h3 className="text-lg font-black text-white mb-1">Instagram</h3>
              <p className="text-[11px] text-pink-400/70 font-bold">@nexora._.in</p>
              <p className="text-[11px] text-white/30 mt-2 leading-relaxed">Behind-the-scenes, updates & campus vibes.</p>
            </div>
            <div className="absolute bottom-5 right-5 text-white/10 group-hover:text-pink-400/30 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>
            </div>
          </motion.a>

          {/* LinkedIn */}
          <motion.a
            href="https://www.linkedin.com/in/team-nexora-b471713b3/" target="_blank" rel="noopener noreferrer"
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}
            className="group relative p-7 rounded-[2rem] border border-white/[0.06] bg-white/[0.03] hover:border-blue-500/40 hover:bg-white/[0.06] transition-all overflow-hidden cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-cyan-500/0 group-hover:from-blue-600/10 group-hover:to-cyan-500/5 transition-all duration-500 rounded-[2rem]" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-[#0077B5] flex items-center justify-center mb-5 shadow-xl shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white fill-white" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              </div>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Connect With Us</p>
              <h3 className="text-lg font-black text-white mb-1">LinkedIn</h3>
              <p className="text-[11px] text-blue-400/70 font-bold">Team Nexora</p>
              <p className="text-[11px] text-white/30 mt-2 leading-relaxed">Careers, product news & professional updates.</p>
            </div>
            <div className="absolute bottom-5 right-5 text-white/10 group-hover:text-blue-400/30 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>
            </div>
          </motion.a>

          {/* GitHub */}
          <motion.a
            href="https://github.com/teamnexora23" target="_blank" rel="noopener noreferrer"
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.16 }}
            className="group relative p-7 rounded-[2rem] border border-white/[0.06] bg-white/[0.03] hover:border-white/[0.2] hover:bg-white/[0.06] transition-all overflow-hidden cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/5 group-hover:to-transparent transition-all duration-500 rounded-[2rem]" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mb-5 shadow-xl group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white fill-white" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
              </div>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Open Source</p>
              <h3 className="text-lg font-black text-white mb-1">GitHub</h3>
              <p className="text-[11px] text-white/50 font-bold">github.com/teamnexora23</p>
              <p className="text-[11px] text-white/30 mt-2 leading-relaxed">Explore our code, contribute & raise issues.</p>
            </div>
            <div className="absolute bottom-5 right-5 text-white/10 group-hover:text-white/30 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>
            </div>
          </motion.a>

          {/* WhatsApp */}
          <motion.a
            href="https://wa.me/917540006268" target="_blank" rel="noopener noreferrer"
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.24 }}
            className="group relative p-7 rounded-[2rem] border border-white/[0.06] bg-white/[0.03] hover:border-emerald-500/40 hover:bg-white/[0.06] transition-all overflow-hidden cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/0 to-teal-500/0 group-hover:from-emerald-600/10 group-hover:to-teal-500/5 transition-all duration-500 rounded-[2rem]" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-[#25D366] flex items-center justify-center mb-5 shadow-xl shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white fill-white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              </div>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Chat With Us</p>
              <h3 className="text-lg font-black text-white mb-1">WhatsApp</h3>
              <p className="text-[11px] text-emerald-400/70 font-bold">+91 75400 06268</p>
              <p className="text-[11px] text-white/30 mt-2 leading-relaxed">Support queries answered in under 2 hours.</p>
            </div>
            <div className="absolute bottom-5 right-5 text-white/10 group-hover:text-emerald-400/30 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>
            </div>
          </motion.a>
        </div>

        {/* Email contact card */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
          className="relative rounded-[2rem] border border-white/[0.06] bg-white/[0.03] p-8 flex flex-col sm:flex-row items-center justify-between gap-6 group hover:border-blue-500/30 transition-all overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-all rounded-[2rem]" />
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/25 flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Direct Email</p>
              <h3 className="text-lg font-black text-white">teamnexora23@gmail.com</h3>
              <p className="text-[11px] text-white/30 mt-0.5">We reply within 24 hours on business days.</p>
            </div>
          </div>
          <a href="mailto:teamnexora23@gmail.com"
            className="relative z-10 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-600/20 flex-shrink-0 group/btn">
            Send Email <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </a>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          {/* Top row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Printer className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-white font-black text-base block leading-none">NexPrint</span>
                <span className="text-white/20 text-[8px] font-black uppercase tracking-widest">Cloud Print Platform</span>
              </div>
            </div>
            {/* Social icons row */}
            <div className="flex items-center gap-3">
              {/* Instagram */}
              <a href="https://www.instagram.com/nexora._.in?igsh=bjN5MjM2bnF3ZDVs" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-gradient-to-br hover:from-pink-500 hover:to-orange-400 hover:border-transparent flex items-center justify-center transition-all group">
                <svg className="w-4 h-4 text-white/30 group-hover:text-white fill-current transition-colors" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
              </a>
              {/* LinkedIn */}
              <a href="https://www.linkedin.com/in/team-nexora-b471713b3/" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-[#0077B5] hover:border-transparent flex items-center justify-center transition-all group">
                <svg className="w-4 h-4 text-white/30 group-hover:text-white fill-current transition-colors" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              </a>
              {/* GitHub */}
              <a href="https://github.com/teamnexora23" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/10 hover:border-white/20 flex items-center justify-center transition-all group">
                <svg className="w-4 h-4 text-white/30 group-hover:text-white fill-current transition-colors" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
              </a>
              {/* WhatsApp */}
              <a href="https://wa.me/917540006268" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-[#25D366] hover:border-transparent flex items-center justify-center transition-all group">
                <svg className="w-4 h-4 text-white/30 group-hover:text-white fill-current transition-colors" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              </a>
            </div>
            <div className="flex items-center gap-5 text-[9px] font-black text-white/20 uppercase tracking-widest">
              <a href="#" className="hover:text-white/50 transition-colors">Privacy</a>
              <a href="#" className="hover:text-white/50 transition-colors">Terms</a>
              <a href="#contact" className="hover:text-white/50 transition-colors">Contact</a>
            </div>
          </div>
          {/* Bottom row */}
          <div className="pt-6 border-t border-white/[0.04] text-center">
            <p className="text-[9px] font-black text-white/10 uppercase tracking-[0.3em]">© 2026 Team Nexora Inc. • Built in India 🇮🇳 • All rights reserved</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
