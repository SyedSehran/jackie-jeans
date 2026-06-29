"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { QUIZ_QUESTIONS, FitProfile, BRANDS, SIZES } from "../lib/quiz";

const JACKIE_URL = "https://jackie-jeans.vercel.app/";

const slide = {
  enter: (d: number) => ({ x: d > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (d: number) => ({ x: d < 0 ? 48 : -48, opacity: 0 }),
};

// ── helpers ───────────────────────────────────────────────
function getProfileValue(profile: FitProfile, id: string): string | string[] | null {
  return (profile as any)[id] ?? null;
}

function summaryLine(profile: FitProfile): string[] {
  const lines: string[] = [];
  if (profile.height)    lines.push(`Height: ${profile.height}`);
  if (profile.weight)    lines.push(`Weight: ${profile.weight} lbs`);
  if (profile.waist)     lines.push(`Waist: ${profile.waist}`);
  if (profile.hip)       lines.push(`Hips: ${profile.hip}`);
  if (profile.waistFit)  lines.push(`Waist fit: ${profile.waistFit}`);
  if (profile.rise)      lines.push(`Rise: ${profile.rise}`);
  if (profile.thighFit)  lines.push(`Thighs: ${profile.thighFit}`);
  if (profile.frustration) lines.push(`Pain point: ${profile.frustration}`);
  return lines;
}

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<FitProfile>({});
  const [direction, setDirection] = useState(1);
  const [brandSizeMap, setBrandSizeMap] = useState<Record<string, string>>({});
  const [brandSizeIndex, setBrandSizeIndex] = useState(0);
  const [tempValue, setTempValue] = useState<string>("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const TOTAL = 10;
  const qIndex = step - 1;
  const currentQ = step > 0 && step <= QUIZ_QUESTIONS.length ? QUIZ_QUESTIONS[qIndex] : null;
  const isPerBrand = currentQ?.type === "per-brand";
  const brandsToAsk = selectedBrands;
  const currentBrand = isPerBrand ? brandsToAsk[brandSizeIndex] : null;
  const progressPct = step === 0 ? 0 : Math.round((step / (TOTAL + 1)) * 100);
  const isComplete = step > TOTAL;

  // When step/brandIndex changes, pre-fill from profile (BACK SUPPORT)
  useEffect(() => {
    setError("");
    if (!currentQ) { setTempValue(""); return; }

    if (currentQ.type === "multi-select") {
      setSelectedBrands(profile.brands ?? []);
      setTempValue("");
      return;
    }
    if (currentQ.type === "per-brand") {
      const brand = brandsToAsk[brandSizeIndex];
      setTempValue(brandSizeMap[brand] ?? "");
      return;
    }
    if (currentQ.type === "number-optional") {
      setTempValue(profile.weight ?? "");
      return;
    }
    // dropdown / single-select — pre-fill from profile
    const saved = getProfileValue(profile, currentQ.id as string);
    setTempValue(typeof saved === "string" ? saved : "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, brandSizeIndex]);

  // Focus number input
  useEffect(() => {
    if (currentQ?.type === "number-optional") inputRef.current?.focus();
  }, [currentQ]);

  // ── navigation ──────────────────────────────────────────────
  const goNext = () => {
    setDirection(1);
    setError("");

    if (step === 0) { setStep(1); return; }

    const q = QUIZ_QUESTIONS[qIndex];

    if (q.type === "dropdown") {
      if (!tempValue) { setError("Please choose one to continue."); return; }
      setProfile(p => ({ ...p, [q.id]: tempValue }));
    } else if (q.type === "number-optional") {
      setProfile(p => ({ ...p, weight: tempValue || null }));
    } else if (q.type === "single-select") {
      if (!tempValue) { setError("Please pick one to continue."); return; }
      setProfile(p => ({ ...p, [q.id]: tempValue }));
    } else if (q.type === "multi-select") {
      if (selectedBrands.length === 0) { setError("Select at least one brand."); return; }
      setProfile(p => ({ ...p, brands: selectedBrands }));
    } else if (q.type === "per-brand") {
      if (!tempValue) { setError(`Please pick your size for ${currentBrand}.`); return; }
      const updated = { ...brandSizeMap, [currentBrand!]: tempValue };
      setBrandSizeMap(updated);
      if (brandSizeIndex < brandsToAsk.length - 1) {
        setBrandSizeIndex(i => i + 1);
        return;
      }
      setProfile(p => ({ ...p, brandSizes: updated }));
      setBrandSizeIndex(0);
    }

    if (step >= TOTAL) {
      setShowSummary(true);
      return;
    }
    setStep(s => s + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setError("");
    if (isPerBrand && brandSizeIndex > 0) { setBrandSizeIndex(i => i - 1); return; }
    if (step > 0) setStep(s => s - 1);
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const doRedirect = () => {
    window.location.href = `${JACKIE_URL}?fitProfile=${encodeURIComponent(JSON.stringify(profile))}`;
  };

  // ── INTRO ──────────────────────────────────────────────────
  if (step === 0) {
    return (
      <Shell onBack={() => router.push('/')} progress={0} showProgress={false}>
        <motion.div
          key="intro"
          custom={1} variants={slide} initial="enter" animate="center" exit="exit"
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="flex flex-col h-full"
        >
          <div className="flex-1 flex flex-col justify-center">
            {/* Decorative pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 self-start"
              style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#C9A84C' }} />
              <span className="text-[10px] tracking-widest uppercase" style={{ color: '#C9A84C' }}>Fit Quiz</span>
            </div>

            <h1 className="text-3xl font-bold mb-4 leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Your personal<br />
              <span style={{
                background: 'linear-gradient(135deg, #C9A84C, #F0D98A)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>fit profile</span>
            </h1>

            <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(240,235,225,0.45)' }}>
              Ten questions. We use your answers to find jeans
              that fit your actual body — not a size average.
            </p>

            <div className="space-y-3">
              {[
                ["⏱", "About 2 minutes"],
                ["↩", "Go back and edit any answer"],
                ["◌", "Skip anything optional"],
              ].map(([icon, text], i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className="flex items-center gap-3 text-sm"
                  style={{ color: 'rgba(240,235,225,0.45)' }}
                >
                  <span className="w-6 text-center text-base opacity-60">{icon}</span>
                  {text}
                </motion.div>
              ))}
            </div>
          </div>

          <GoldButton onClick={goNext}>Start the Quiz →</GoldButton>
        </motion.div>
      </Shell>
    );
  }

  // ── SUMMARY ────────────────────────────────────────────────
  if (showSummary) {
    return <SummaryScreen profile={profile} onContinue={doRedirect} />;
  }

  // ── COMPLETE (fallback) ────────────────────────────────────
  if (isComplete) {
    return <SummaryScreen profile={profile} onContinue={doRedirect} />;
  }

  // ── QUESTIONS ──────────────────────────────────────────────
  const title = isPerBrand ? `Your size in ${currentBrand}?` : currentQ!.question;
  const subLabel = isPerBrand
    ? `Brand ${brandSizeIndex + 1} of ${brandsToAsk.length}`
    : `Question ${currentQ!.number} of ${TOTAL}`;
  const isLast = step === TOTAL && !(isPerBrand && brandSizeIndex < brandsToAsk.length - 1);

  return (
    <Shell onBack={step > 1 ? goBack : () => setStep(0)} progress={progressPct} showProgress label={subLabel}>
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={`q-${step}-${brandSizeIndex}`}
          custom={direction} variants={slide} initial="enter" animate="center" exit="exit"
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="flex flex-col h-full"
        >
          {/* Question header */}
          <div className="mb-6 flex-shrink-0">
            <h2 className="text-2xl font-bold leading-tight mb-2"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              {title}
            </h2>
            {currentQ!.hint && !isPerBrand && (
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(240,235,225,0.35)' }}>
                {currentQ!.hint}
              </p>
            )}
          </div>

          {/* Input area */}
          <div className="flex-1 overflow-y-auto min-h-0 pb-2">
            <QuizInput
              q={currentQ!}
              tempValue={tempValue}
              setTempValue={setTempValue}
              selectedBrands={selectedBrands}
              toggleBrand={toggleBrand}
              brandSizeMap={brandSizeMap}
              currentBrand={currentBrand}
              inputRef={inputRef}
            />
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-xs mt-2 flex-shrink-0"
                style={{ color: '#F87171' }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Buttons */}
          <div className="mt-4 flex gap-2 flex-shrink-0">
            <button
              onClick={goBack}
              className="py-4 px-4 rounded-2xl text-sm font-medium transition-all active:scale-[0.97]"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(240,235,225,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              ←
            </button>
            <GoldButton onClick={goNext} className="flex-1">
              {isLast ? "See My Fit Profile →" : "Continue →"}
            </GoldButton>
          </div>

          {/* Skip optional */}
          {currentQ!.optional && (
            <button
              onClick={() => {
                setTempValue("");
                setProfile(p => ({ ...p, weight: null }));
                setDirection(1);
                setStep(s => s + 1);
              }}
              className="mt-3 w-full py-3 text-sm text-center transition-all flex-shrink-0"
              style={{ color: 'rgba(240,235,225,0.3)' }}
            >
              Skip — I&apos;d rather not share
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </Shell>
  );
}

// ── QuizInput ─────────────────────────────────────────────
function QuizInput({ q, tempValue, setTempValue, selectedBrands, toggleBrand, brandSizeMap, currentBrand, inputRef }: {
  q: typeof QUIZ_QUESTIONS[0];
  tempValue: string;
  setTempValue: (v: string) => void;
  selectedBrands: string[];
  toggleBrand: (b: string) => void;
  brandSizeMap: Record<string, string>;
  currentBrand: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  if (q.type === "dropdown") {
    return (
      <div className="grid grid-cols-3 gap-2">
        {q.options!.map(opt => {
          const sel = tempValue === opt;
          return (
            <motion.button
              key={opt}
              onClick={() => setTempValue(opt)}
              whileTap={{ scale: 0.95 }}
              className="py-3 px-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: sel ? 'linear-gradient(135deg, rgba(45,74,138,0.7), rgba(45,74,138,0.4))' : 'rgba(255,255,255,0.04)',
                color: sel ? '#F0EBE1' : 'rgba(240,235,225,0.4)',
                border: sel ? '1px solid rgba(74,127,212,0.5)' : '1px solid rgba(255,255,255,0.06)',
                boxShadow: sel ? '0 0 12px rgba(45,74,138,0.3)' : 'none',
              }}
            >
              {opt}
            </motion.button>
          );
        })}
      </div>
    );
  }

  if (q.type === "number-optional") {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          value={tempValue}
          onChange={e => setTempValue(e.target.value)}
          placeholder="e.g. 135"
          className="w-full py-5 px-5 rounded-2xl text-xl font-semibold"
          style={{
            background: 'rgba(255,255,255,0.04)',
            color: '#F0EBE1',
            border: '1px solid rgba(255,255,255,0.1)',
            caretColor: '#C9A84C',
          }}
        />
        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm"
          style={{ color: 'rgba(240,235,225,0.3)' }}>lbs</span>
      </div>
    );
  }

  if (q.type === "single-select") {
    return (
      <div className="flex flex-col gap-2">
        {q.options!.map(opt => {
          const sel = tempValue === opt;
          return (
            <motion.button
              key={opt}
              onClick={() => setTempValue(opt)}
              whileTap={{ scale: 0.98 }}
              className="py-4 px-5 rounded-2xl text-sm font-medium text-left flex items-center gap-3 transition-all"
              style={{
                background: sel ? 'linear-gradient(135deg, rgba(45,74,138,0.5), rgba(45,74,138,0.25))' : 'rgba(255,255,255,0.035)',
                color: sel ? '#F0EBE1' : 'rgba(240,235,225,0.45)',
                border: sel ? '1px solid rgba(74,127,212,0.45)' : '1px solid rgba(255,255,255,0.06)',
                boxShadow: sel ? '0 0 16px rgba(45,74,138,0.2)' : 'none',
              }}
            >
              <div className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center transition-all"
                style={{
                  border: sel ? '2px solid #4A7FD4' : '2px solid rgba(255,255,255,0.15)',
                  background: sel ? '#4A7FD4' : 'transparent',
                }}>
                {sel && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              {opt}
            </motion.button>
          );
        })}
      </div>
    );
  }

  if (q.type === "multi-select") {
    return (
      <div className="flex flex-wrap gap-2">
        {BRANDS.map(brand => {
          const sel = selectedBrands.includes(brand);
          return (
            <motion.button
              key={brand}
              onClick={() => toggleBrand(brand)}
              whileTap={{ scale: 0.95 }}
              className="py-2 px-4 rounded-full text-xs font-medium transition-all"
              style={{
                background: sel ? 'rgba(45,74,138,0.45)' : 'rgba(255,255,255,0.04)',
                color: sel ? '#F0EBE1' : 'rgba(240,235,225,0.4)',
                border: sel ? '1px solid rgba(74,127,212,0.5)' : '1px solid rgba(255,255,255,0.07)',
                boxShadow: sel ? '0 0 10px rgba(45,74,138,0.25)' : 'none',
              }}
            >
              {sel && <span className="mr-1 text-[#4A7FD4]">✓ </span>}{brand}
            </motion.button>
          );
        })}
      </div>
    );
  }

  if (q.type === "per-brand") {
    return (
      <div className="grid grid-cols-4 gap-2">
        {SIZES.map(size => {
          const sel = tempValue === size;
          return (
            <motion.button
              key={size}
              onClick={() => setTempValue(size)}
              whileTap={{ scale: 0.93 }}
              className="py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: sel ? 'linear-gradient(135deg, rgba(201,168,76,0.3), rgba(201,168,76,0.12))' : 'rgba(255,255,255,0.04)',
                color: sel ? '#C9A84C' : 'rgba(240,235,225,0.35)',
                border: sel ? '1px solid rgba(201,168,76,0.5)' : '1px solid rgba(255,255,255,0.06)',
                boxShadow: sel ? '0 0 12px rgba(201,168,76,0.15)' : 'none',
              }}
            >
              {size}
            </motion.button>
          );
        })}
      </div>
    );
  }

  return null;
}

// ── Shell layout ──────────────────────────────────────────
function Shell({ children, onBack, progress, showProgress, label }: {
  children: React.ReactNode;
  onBack: () => void;
  progress: number;
  showProgress: boolean;
  label?: string;
}) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#07080D' }}>
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(45,74,138,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      {/* Header */}
      <div className="px-5 pt-6 pb-3 flex items-center justify-between flex-shrink-0 relative z-10">
        <button onClick={onBack} className="flex items-center gap-2 transition-all active:scale-95">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span style={{ color: 'rgba(240,235,225,0.5)', fontSize: 13 }}>←</span>
          </div>
        </button>
        <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: 'rgba(240,235,225,0.25)' }}>
          Jackie Jeans
        </span>
        {label ? (
          <span className="text-[11px]" style={{ color: 'rgba(240,235,225,0.3)' }}>{label}</span>
        ) : <div className="w-8" />}
      </div>

      {/* Progress */}
      {showProgress && (
        <div className="px-5 mb-5 flex-shrink-0">
          <div className="h-[2px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #1A2744, #4A7FD4, #C9A84C)' }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 180, damping: 22 }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 px-5 pb-8 flex flex-col overflow-hidden relative z-10">
        {children}
      </div>
    </div>
  );
}

// ── GoldButton ────────────────────────────────────────────
function GoldButton({ children, onClick, className = "" }: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={`relative py-4 px-6 rounded-2xl font-semibold text-sm tracking-wide overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(135deg, #2D4A8A 0%, #1A2744 100%)',
        color: '#F0EBE1',
        border: '1px solid rgba(74,127,212,0.35)',
        boxShadow: '0 4px 24px rgba(45,74,138,0.25)',
      }}
    >
      {/* Shimmer sweep */}
      <motion.div
        className="absolute inset-0 opacity-0 hover:opacity-100"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }}
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

// ── Summary Screen ─────────────────────────────────────────
function SummaryScreen({ profile, onContinue }: { profile: FitProfile; onContinue: () => void }) {
  const [redirecting, setRedirecting] = useState(false);
  const lines = summaryLine(profile);

  const handleContinue = () => {
    setRedirecting(true);
    setTimeout(onContinue, 600);
  };

  const tags = [
    profile.height && { label: "Height", value: profile.height, color: '#4A7FD4' },
    profile.waist  && { label: "Waist", value: profile.waist, color: '#4A7FD4' },
    profile.hip    && { label: "Hips", value: profile.hip, color: '#4A7FD4' },
    profile.rise   && { label: "Rise", value: profile.rise, color: '#C9A84C' },
    profile.thighFit && { label: "Thigh", value: profile.thighFit, color: '#C9A84C' },
    profile.waistFit && { label: "Waist Fit", value: profile.waistFit, color: '#C9A84C' },
  ].filter(Boolean) as { label: string; value: string; color: string }[];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#07080D' }}>
      {/* Top glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(201,168,76,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <div className="flex-1 flex flex-col px-5 pt-10 pb-8 relative z-10">
        {/* Check */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6"
          style={{
            background: 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.05))',
            border: '1px solid rgba(201,168,76,0.3)',
            boxShadow: '0 0 40px rgba(201,168,76,0.12)'
          }}
        >
          ✓
        </motion.div>

        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
          <div className="text-xs tracking-widest uppercase mb-2" style={{ color: 'rgba(201,168,76,0.7)' }}>
            All done
          </div>
          <h2 className="text-3xl font-bold leading-tight mb-2"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Your fit profile<br />
            <span style={{
              background: 'linear-gradient(135deg, #C9A84C, #F0D98A)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>is ready.</span>
          </h2>
          <p className="text-sm mb-8" style={{ color: 'rgba(240,235,225,0.35)' }}>
            Here&apos;s what we captured for you.
          </p>
        </motion.div>

        {/* Measurement tags */}
        {tags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-2 mb-6"
          >
            {tags.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
                style={{
                  background: `rgba(${t.color === '#4A7FD4' ? '45,74,138' : '201,168,76'},0.1)`,
                  border: `1px solid ${t.color}30`,
                }}
              >
                <span className="text-[10px] tracking-wide uppercase" style={{ color: `${t.color}99` }}>{t.label}</span>
                <span className="text-xs font-semibold" style={{ color: t.color }}>{t.value}</span>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Full profile card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="rounded-2xl p-4 mb-6 flex-1"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            {lines.map((line, i) => {
              const [label, ...rest] = line.split(': ');
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                >
                  <div className="text-[10px] tracking-wide uppercase mb-0.5" style={{ color: 'rgba(240,235,225,0.25)' }}>{label}</div>
                  <div className="text-sm font-medium" style={{ color: 'rgba(240,235,225,0.8)' }}>{rest.join(': ')}</div>
                </motion.div>
              );
            })}
            {profile.frustration && (
              <motion.div
                className="col-span-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <div className="text-[10px] tracking-wide uppercase mb-0.5" style={{ color: 'rgba(240,235,225,0.25)' }}>Pain point</div>
                <div className="text-sm font-medium" style={{ color: '#C9A84C' }}>{profile.frustration}</div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 }}>
          <motion.button
            onClick={handleContinue}
            whileTap={{ scale: 0.97 }}
            disabled={redirecting}
            className="w-full py-4 rounded-2xl font-semibold text-sm tracking-wide relative overflow-hidden"
            style={{
              background: redirecting
                ? 'rgba(45,74,138,0.3)'
                : 'linear-gradient(135deg, #2D4A8A, #1A2744)',
              color: '#F0EBE1',
              border: '1px solid rgba(74,127,212,0.35)',
              boxShadow: '0 4px 24px rgba(45,74,138,0.25)',
            }}
          >
            {redirecting ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span animate={{ opacity: [1,0.3,1] }} transition={{ duration: 0.8, repeat: Infinity }}>●</motion.span>
                Heading to Jackie Jeans...
              </span>
            ) : "Find My Perfect Jeans →"}
          </motion.button>

          <a
            href={`${JACKIE_URL}?fitProfile=${encodeURIComponent(JSON.stringify(profile))}`}
            className="block mt-3 text-center text-xs underline underline-offset-4"
            style={{ color: 'rgba(240,235,225,0.2)' }}
          >
            Click here if not redirected
          </a>
        </motion.div>
      </div>
    </div>
  );
}
