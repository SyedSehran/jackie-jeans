"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <main className="noise min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden" style={{ background: '#07080D' }}>

      {/* Deep background glow blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.12]"
          style={{ background: 'radial-gradient(circle, #1A2744 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, #2D4A8A 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #C9A84C 0%, transparent 70%)', filter: 'blur(100px)' }} />
      </div>

      {/* Denim thread lines (decorative) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {mounted && [15, 35, 55, 75, 88].map((pct, i) => (
          <motion.div
            key={i}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 0.04 + i * 0.008 }}
            transition={{ delay: 0.3 + i * 0.12, duration: 1.2, ease: [0.16,1,0.3,1] }}
            className="absolute h-[1px] w-full origin-left"
            style={{ top: `${pct}%`, background: 'linear-gradient(90deg, transparent, #4A7FD4, transparent)' }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Logo mark */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="mb-12 flex items-center gap-3"
        >
          <div className="flex gap-[3px]">
            {[1,2,3].map(i => (
              <motion.div
                key={i}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
                className="w-[3px] rounded-full origin-bottom"
                style={{ height: `${8 + i * 4}px`, background: `rgba(201,168,76,${0.4 + i * 0.2})` }}
              />
            ))}
          </div>
          <span className="text-[11px] tracking-[0.35em] uppercase" style={{ color: 'rgba(201,168,76,0.7)' }}>
            Jackie Jeans
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7, ease: [0.16,1,0.3,1] }}
          className="mb-3"
        >
          <h1 className="text-[44px] leading-[1.05] font-bold tracking-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Jeans that<br />
            <span className="shimmer italic">actually fit.</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="text-sm leading-relaxed mb-12"
          style={{ color: 'rgba(240,235,225,0.45)' }}
        >
          Stop guessing. Stop returning. Two minutes,<br />ten questions — your perfect pair, guaranteed.
        </motion.p>

        {/* CTA Cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6 }}
          className="flex flex-col gap-3"
        >
          {/* Manual */}
          <button
            onClick={() => router.push('/quiz')}
            className="group relative w-full overflow-hidden rounded-2xl text-left transition-all duration-200 active:scale-[0.98]"
            style={{ padding: '1px', background: 'linear-gradient(135deg, rgba(74,127,212,0.5), rgba(45,74,138,0.2))' }}
          >
            <div className="relative rounded-[15px] px-5 py-4 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, #111827, #0D1525)' }}>
              <div>
                <div className="text-xs tracking-widest uppercase mb-1" style={{ color: 'rgba(74,127,212,0.8)' }}>Manual Quiz</div>
                <div className="font-semibold text-sm" style={{ color: '#F0EBE1' }}>Take the Fit Quiz ✍️</div>
              </div>
              <motion.div
                className="text-lg opacity-60 group-hover:opacity-100"
                whileHover={{ x: 4 }}
              >→</motion.div>
            </div>
          </button>

          {/* Voice */}
          <button
            onClick={() => router.push('/voice')}
            className="group relative w-full overflow-hidden rounded-2xl text-left transition-all duration-200 active:scale-[0.98]"
            style={{ padding: '1px', background: 'linear-gradient(135deg, rgba(201,168,76,0.5), rgba(201,168,76,0.1))' }}
          >
            <div className="relative rounded-[15px] px-5 py-4 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, #15120A, #0F0E08)' }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-xs tracking-widest uppercase" style={{ color: 'rgba(201,168,76,0.8)' }}>AI Voice</div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold tracking-wide"
                    style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}>
                    NEW
                  </span>
                </div>
                <div className="font-semibold text-sm" style={{ color: '#F0EBE1' }}>Try Voice Onboarding 🎙️</div>
              </div>
              <motion.div className="text-lg opacity-60 group-hover:opacity-100" whileHover={{ x: 4 }}>→</motion.div>
            </div>
          </button>
        </motion.div>

        {/* Trust line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex items-center gap-4"
        >
          <div className="flex-1 h-[1px]" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: 'rgba(240,235,225,0.2)' }}>
            No account · 2 min
          </span>
          <div className="flex-1 h-[1px]" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </motion.div>
      </motion.div>
    </main>
  );
}
