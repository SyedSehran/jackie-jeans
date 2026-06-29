"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FitProfile, QUIZ_QUESTIONS, BRANDS, SIZES } from "../lib/quiz";

const JACKIE_URL = "https://jackie-jeans.vercel.app/";

type VoiceState = "idle" | "speaking" | "listening" | "processing" | "complete" | "error";
interface Turn { role: "ai" | "user"; text: string; }

// ── Parsers ──────────────────────────────────────────────────────
const WORD_NUMS: Record<string, number> = {
  zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,
  ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,
  seventeen:17,eighteen:18,nineteen:19,twenty:20,"twenty-one":21,
  thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90,hundred:100
};

function extractNumber(text: string): number | null {
  const lower = text.toLowerCase().replace(/,/g, "");
  const m = lower.match(/\b(\d+)\b/);
  if (m) return parseInt(m[1]);
  let total = 0;
  for (const p of lower.split(/\s+/)) {
    if (WORD_NUMS[p] !== undefined) total += WORD_NUMS[p];
  }
  return total > 0 ? total : null;
}

function findClosestHeight(spoken: string): string | null {
  const lower = spoken.toLowerCase();
  const HEIGHTS = ["4'10\"","4'11\"","5'0\"","5'1\"","5'2\"","5'3\"","5'4\"","5'5\"","5'6\"","5'7\"","5'8\"","5'9\"","5'10\"","5'11\"","6'0\"","6'1\"","6'2\""];
  const ft = lower.match(/(\d+)\s*(?:foot|feet|ft|')/);
  const inch = lower.match(/(\d+)\s*(?:inch|inches|in|")/);
  if (ft) {
    const f = parseInt(ft[1]), i = inch ? parseInt(inch[1]) : 0;
    return HEIGHTS.find(h => h === `${f}'${i}"`) || HEIGHTS.find(h => h.startsWith(`${f}'`)) || null;
  }
  const parts = lower.split(/\s+/);
  const nums = parts.map(p => WORD_NUMS[p] ?? parseInt(p)).filter(n => !isNaN(n));
  if (nums.length >= 2) return HEIGHTS.find(h => h === `${nums[0]}'${nums[1]}"`) || null;
  return null;
}

function findClosestInList(spoken: string, list: string[]): string | null {
  const n = extractNumber(spoken);
  if (n === null) return null;
  const exact = list.find(o => parseInt(o) === n);
  if (exact) return exact;
  return list.reduce((prev, curr) => Math.abs(parseInt(curr) - n) < Math.abs(parseInt(prev) - n) ? curr : prev);
}

function matchOption(spoken: string, options: string[]): string | null {
  const lower = spoken.toLowerCase();
  for (const opt of options) if (lower.includes(opt.toLowerCase())) return opt;
  const words = lower.split(/\s+/);
  for (const opt of options) {
    if (opt.toLowerCase().split(/\s+/).some(w => words.includes(w))) return opt;
  }
  return null;
}

function matchBrands(spoken: string): string[] {
  const lower = spoken.toLowerCase().replace(/['']/g, "");
  // "none" / "no brands" — explicit skip
  if (/\b(none|no brands?|don't have|havent|haven't|nothing|neither)\b/.test(lower)) return [];
  const found: string[] = [];
  for (const b of BRANDS) {
    if (lower.includes(b.toLowerCase().replace(/['']/g, "").replace("&", "and"))) found.push(b);
  }
  if (lower.includes("levi") || lower.includes("levy")) found.push("Levi's");
  if (lower.includes("abercrombie") || lower.includes("abercombie")) found.push("Abercrombie & Fitch");
  if (lower.includes("american eagle") || lower.includes("ae ")) found.push("American Eagle");
  return [...new Set(found)];
}

// ── Component ─────────────────────────────────────────────────────
export default function VoicePage() {
  const router = useRouter();
  const [state, setState] = useState<VoiceState>("idle");
  const [profile, setProfile] = useState<FitProfile>({});
  const [conversation, setConversation] = useState<Turn[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [brandIndex, setBrandIndex] = useState(0);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [brandSizes, setBrandSizes] = useState<Record<string, string>>({});
  const [caption, setCaption] = useState("");
  const [supported, setSupported] = useState(true);
  const [started, setStarted] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [finalProfile, setFinalProfile] = useState<FitProfile>({});

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const recognitionRef = useRef<any>(null);
  const captionRef = useRef("");
  const convoEndRef = useRef<HTMLDivElement>(null);

  // keep captionRef in sync so recognition.onend closure sees latest value
  useEffect(() => { captionRef.current = caption; }, [caption]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    synthRef.current = window.speechSynthesis;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR || !synthRef.current) setSupported(false);
  }, []);

  useEffect(() => { convoEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conversation]);

  // ── speak ──────────────────────────────────────────────────────
  const addTurn = useCallback((role: "ai" | "user", text: string) => {
    setConversation(p => [...p, { role, text }]);
  }, []);

  const speak = useCallback((text: string, onDone?: () => void) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    setState("speaking");
    addTurn("ai", text);

    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.93; u.pitch = 1.0; u.volume = 1;
    const voices = synthRef.current.getVoices();
    const preferred = voices.find(v =>
      v.name.includes("Samantha") || v.name.includes("Google US English") || v.name.includes("Karen")
    ) || voices.find(v => v.lang.startsWith("en-US")) || voices.find(v => v.lang.startsWith("en"));
    if (preferred) u.voice = preferred;
    u.onend = () => { setState("listening"); onDone?.(); };
    u.onerror = () => { setState("listening"); onDone?.(); };
    synthRef.current.speak(u);
  }, [addTurn]);

  // ── listen ─────────────────────────────────────────────────────
  const listen = useCallback((onResult: (text: string) => void) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = "en-US"; rec.interimResults = true; rec.maxAlternatives = 3; rec.continuous = false;
    setState("listening"); setCaption("");

    rec.onresult = (e: any) => {
      let interim = "", final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t; else interim += t;
      }
      const latest = final || interim;
      setCaption(latest);
      captionRef.current = latest;
    };

    rec.onend = () => {
      const cap = captionRef.current.trim();
      if (cap) { addTurn("user", cap); setState("processing"); onResult(cap); }
      else setState("listening");
    };
    rec.onerror = () => setState("error");
    rec.start();
  }, [addTurn]);

  // ── processAnswer ──────────────────────────────────────────────
  const askQuestion = useCallback((qIdx: number, bIdx: number, brands: string[], bSizes: Record<string, string>) => {
    // forward declare, defined below
  }, []); // placeholder — overridden below

  const retryOrSkip = useCallback((
    qIdx: number, bIdx: number, brands: string[], bSizes: Record<string, string>,
    retries: number, processAns: (s: string) => void
  ) => {
    if (retries >= 2) {
      speak("No worries, let's move on.", () => {
        // skip this question
        askRef.current(qIdx + 1, bIdx, brands, bSizes);
      });
    } else {
      speak("I didn't quite catch that — could you say it again?", () => {
        listen(ans => processAns(ans));
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speak, listen]);

  // use ref pattern to avoid circular deps
  const askRef = useRef<(qIdx: number, bIdx: number, brands: string[], bSizes: Record<string, string>) => void>(() => {});
  const retryRef = useRef(0);

  const processAnswer = useCallback((
    qIdx: number, bIdx: number, brands: string[], bSizes: Record<string, string>, spoken: string
  ) => {
    const q = QUIZ_QUESTIONS[qIdx];
    const lower = spoken.toLowerCase();
    retryRef.current = retryRef.current || 0;

    // Optional skip
    if (q.optional && /\b(skip|pass|prefer not|no thanks|rather not|nope)\b/.test(lower)) {
      setProfile(p => ({ ...p, weight: null }));
      speak("No problem at all!", () => askRef.current(qIdx + 1, bIdx, brands, bSizes));
      return;
    }

    if (q.type === "dropdown") {
      const matched = q.id === "height" ? findClosestHeight(spoken) : findClosestInList(spoken, q.options!);
      if (matched) {
        setProfile(p => ({ ...p, [q.id]: matched }));
        retryRef.current = 0;
        speak(`Got it — ${matched}.`, () => askRef.current(qIdx + 1, bIdx, brands, bSizes));
      } else {
        retryRef.current++;
        retryOrSkip(qIdx, bIdx, brands, bSizes, retryRef.current, ans => processAnswer(qIdx, bIdx, brands, bSizes, ans));
      }
      return;
    }

    if (q.type === "number-optional") {
      const n = extractNumber(spoken);
      if (n && n > 50 && n < 500) {
        setProfile(p => ({ ...p, weight: `${n}` }));
        retryRef.current = 0;
        speak(`Got it — ${n}.`, () => askRef.current(qIdx + 1, bIdx, brands, bSizes));
      } else {
        retryRef.current++;
        retryOrSkip(qIdx, bIdx, brands, bSizes, retryRef.current, ans => processAnswer(qIdx, bIdx, brands, bSizes, ans));
      }
      return;
    }

    if (q.type === "single-select") {
      const matched = matchOption(spoken, q.options!);
      if (matched) {
        setProfile(p => ({ ...p, [q.id]: matched }));
        retryRef.current = 0;
        speak(`${matched} — noted.`, () => askRef.current(qIdx + 1, bIdx, brands, bSizes));
      } else {
        retryRef.current++;
        retryOrSkip(qIdx, bIdx, brands, bSizes, retryRef.current, ans => processAnswer(qIdx, bIdx, brands, bSizes, ans));
      }
      return;
    }

    if (q.type === "multi-select") {
      const found = matchBrands(spoken);

      // Explicit "none" case — skip Q9 entirely
      if (found.length === 0 && /\b(none|no brands?|don't have|havent|haven't|nothing|neither|nope)\b/.test(lower)) {
        setSelectedBrands([]);
        setProfile(p => ({ ...p, brands: [], brandSizes: {} }));
        retryRef.current = 0;
        speak("No worries! Last question.", () => askRef.current(9, 0, [], bSizes)); // skip Q9 (index 8), go to Q10 (index 9)
        return;
      }

      if (found.length > 0) {
        setSelectedBrands(found);
        setProfile(p => ({ ...p, brands: found }));
        retryRef.current = 0;
        const list = found.length === 1 ? found[0] : `${found.slice(0, -1).join(", ")} and ${found[found.length - 1]}`;
        speak(`${list}. Now let's get your sizes.`, () => askRef.current(qIdx + 1, 0, found, bSizes));
      } else {
        retryRef.current++;
        if (retryRef.current >= 2) {
          speak("Let me move on. You can always update this later.", () => askRef.current(9, 0, [], bSizes));
        } else {
          speak("Name the brands you wear — like Levi's, Zara, or Madewell. Or say 'none'.", () => {
            listen(ans => processAnswer(qIdx, bIdx, brands, bSizes, ans));
          });
        }
      }
      return;
    }

    if (q.type === "per-brand") {
      // If no brands, skip to next real question (frustration = index 9)
      if (brands.length === 0) { askRef.current(9, 0, brands, bSizes); return; }

      const currentBrand = brands[bIdx];
      const sizeMatch = matchOption(spoken, SIZES) || findClosestInList(spoken, SIZES);
      if (sizeMatch) {
        const updated = { ...bSizes, [currentBrand]: sizeMatch };
        setBrandSizes(updated);
        retryRef.current = 0;
        if (bIdx < brands.length - 1) {
          speak(`${sizeMatch} in ${currentBrand}. `, () => {
            setBrandIndex(bIdx + 1);
            askRef.current(qIdx, bIdx + 1, brands, updated);
          });
        } else {
          setProfile(p => ({ ...p, brandSizes: updated }));
          speak(`Got all your sizes!`, () => askRef.current(qIdx + 1, 0, brands, updated));
        }
      } else {
        retryRef.current++;
        retryOrSkip(qIdx, bIdx, brands, bSizes, retryRef.current, ans => processAnswer(qIdx, bIdx, brands, bSizes, ans));
      }
      return;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speak, listen, retryOrSkip]);

  // Assign askQuestion to ref
  const askQuestion2 = useCallback((qIdx: number, bIdx: number, brands: string[], bSizes: Record<string, string>) => {
    retryRef.current = 0;
    if (qIdx >= QUIZ_QUESTIONS.length) {
      setState("complete");
      const finalP = { ...profile, brandSizes: bSizes, brands };
      setFinalProfile(finalP);
      speak("That's everything! Your fit profile looks great.", () => {
        setTimeout(() => setShowSummary(true), 800);
      });
      return;
    }

    const q = QUIZ_QUESTIONS[qIdx];
    setQuestionIndex(qIdx);
    setBrandIndex(bIdx);

    let text = q.voiceQuestion;
    if (q.type === "per-brand") {
      if (brands.length === 0) { askRef.current(9, 0, brands, bSizes); return; }
      text = `What size do you usually wear in ${brands[bIdx]}?`;
    }

    speak(text, () => listen(ans => processAnswer(qIdx, bIdx, brands, bSizes, ans)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speak, listen, processAnswer, profile]);

  useEffect(() => { askRef.current = askQuestion2; }, [askQuestion2]);

  // ── Start ──────────────────────────────────────────────────────
  const startVoice = useCallback(() => {
    setStarted(true);
    setConversation([]);
    setProfile({});
    setBrandSizes({});
    setSelectedBrands([]);
    setQuestionIndex(0);
    setBrandIndex(0);
    retryRef.current = 0;
    speak(
      "Hi! I'm your Jackie Jeans fit stylist. I'll ask you ten quick questions to find jeans that actually fit. Let's begin.",
      () => askRef.current(0, 0, [], {})
    );
  }, [speak]);

  const stopAll = () => { recognitionRef.current?.stop(); synthRef.current?.cancel(); };

  // ── Not supported ──────────────────────────────────────────────
  if (!supported) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#07080D' }}>
        <div className="text-5xl mb-5">🎤</div>
        <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Voice not available
        </h2>
        <p className="text-sm mb-8" style={{ color: 'rgba(240,235,225,0.4)' }}>
          Try Chrome on Android or Safari on iOS.
        </p>
        <button onClick={() => router.push('/quiz')}
          className="py-4 px-8 rounded-2xl font-semibold text-sm"
          style={{ background: 'linear-gradient(135deg, #2D4A8A, #1A2744)', color: '#F0EBE1', border: '1px solid rgba(74,127,212,0.3)' }}>
          Switch to Manual Quiz
        </button>
      </div>
    );
  }

  // ── Summary ────────────────────────────────────────────────────
  if (showSummary) {
    return <VoiceSummary profile={finalProfile.height ? finalProfile : profile} />;
  }

  const isListening = state === "listening";
  const isSpeaking = state === "speaking";
  const progress = ((questionIndex + 1) / QUIZ_QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#07080D' }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full"
          animate={{ opacity: isListening ? 0.12 : isSpeaking ? 0.08 : 0.05 }}
          transition={{ duration: 1 }}
          style={{ background: 'radial-gradient(circle, #C9A84C 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full"
          animate={{ opacity: isSpeaking ? 0.08 : 0.04 }}
          style={{ background: 'radial-gradient(circle, #2D4A8A 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
      </div>

      {/* Header */}
      <div className="px-5 pt-6 pb-3 flex items-center justify-between flex-shrink-0 relative z-10">
        <button onClick={() => { stopAll(); router.push('/'); }}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <span style={{ color: 'rgba(240,235,225,0.4)', fontSize: 13 }}>←</span>
        </button>
        <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: 'rgba(240,235,225,0.25)' }}>
          Jackie Jeans
        </span>
        <button onClick={() => { stopAll(); router.push('/quiz'); }}
          className="text-[10px] px-2.5 py-1.5 rounded-full tracking-wide"
          style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(240,235,225,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}>
          Manual →
        </button>
      </div>

      {!started ? (
        <IntroScreen onStart={startVoice} />
      ) : (
        <div className="flex-1 flex flex-col px-4 pb-6 overflow-hidden relative z-10">
          {/* Progress */}
          {started && (
            <div className="mb-4 flex-shrink-0">
              <div className="flex justify-between text-[11px] mb-1.5" style={{ color: 'rgba(240,235,225,0.25)' }}>
                <span>Question {Math.min(questionIndex + 1, 10)} of 10</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-[2px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <motion.div className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #1A2744, #4A7FD4, #C9A84C)' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ type: "spring", stiffness: 180, damping: 22 }} />
              </div>
            </div>
          )}

          {/* Conversation */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pb-3 min-h-0">
            <AnimatePresence initial={false}>
              {conversation.map((turn, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"} items-end gap-2`}
                >
                  {turn.role === "ai" && (
                    <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-[9px] font-bold mb-0.5"
                      style={{ background: 'rgba(45,74,138,0.4)', border: '1px solid rgba(74,127,212,0.25)', color: '#4A7FD4' }}>
                      JJ
                    </div>
                  )}
                  <div className="max-w-[78%] px-3.5 py-2.5 text-sm leading-relaxed"
                    style={{
                      background: turn.role === "ai" ? 'rgba(45,74,138,0.18)' : 'rgba(201,168,76,0.12)',
                      color: turn.role === "ai" ? 'rgba(240,235,225,0.8)' : '#C9A84C',
                      border: turn.role === "ai" ? '1px solid rgba(74,127,212,0.12)' : '1px solid rgba(201,168,76,0.18)',
                      borderRadius: turn.role === "ai" ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                    }}>
                    {turn.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={convoEndRef} />
          </div>

          {/* Caption */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                className="px-4 py-3 rounded-2xl text-sm text-center mb-3 min-h-[44px] flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}>
                {caption
                  ? <span style={{ color: '#C9A84C' }}>{caption}</span>
                  : <span style={{ color: 'rgba(240,235,225,0.2)' }}>Listening...</span>}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mic orb */}
          <div className="flex flex-col items-center gap-3 flex-shrink-0">
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Pulse rings when listening */}
              {isListening && [1, 1.6, 2.2].map((scale, i) => (
                <motion.div key={i}
                  className="absolute inset-0 rounded-full"
                  style={{ border: `1.5px solid rgba(201,168,76,${0.4 - i * 0.1})` }}
                  animate={{ scale: [1, scale], opacity: [0.5, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.35, ease: "easeOut" }}
                />
              ))}

              {/* Wave rings when speaking */}
              {isSpeaking && [1.2, 1.6].map((scale, i) => (
                <motion.div key={i}
                  className="absolute inset-0 rounded-full"
                  style={{ border: `1.5px solid rgba(74,127,212,${0.4 - i * 0.15})` }}
                  animate={{ scale: [1, scale], opacity: [0.5, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                />
              ))}

              <motion.button
                onClick={() => {
                  if (isListening) recognitionRef.current?.stop();
                  else if (!isSpeaking && state !== "processing")
                    listen(ans => {
                      const q = QUIZ_QUESTIONS[questionIndex];
                      processAnswer(questionIndex, brandIndex, selectedBrands, brandSizes, ans);
                    });
                }}
                whileTap={{ scale: 0.92 }}
                animate={isListening ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                transition={isListening ? { duration: 1.5, repeat: Infinity } : {}}
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl relative z-10"
                style={{
                  background: isListening
                    ? 'linear-gradient(135deg, rgba(201,168,76,0.25), rgba(201,168,76,0.08))'
                    : isSpeaking
                    ? 'linear-gradient(135deg, rgba(45,74,138,0.4), rgba(45,74,138,0.15))'
                    : 'rgba(255,255,255,0.05)',
                  border: isListening
                    ? '2px solid rgba(201,168,76,0.5)'
                    : isSpeaking
                    ? '2px solid rgba(74,127,212,0.4)'
                    : '2px solid rgba(255,255,255,0.1)',
                  boxShadow: isListening
                    ? '0 0 30px rgba(201,168,76,0.15)'
                    : isSpeaking
                    ? '0 0 30px rgba(45,74,138,0.2)'
                    : 'none'
                }}
              >
                {state === "complete" ? "✓" : state === "processing" ? "⌛" : isSpeaking ? "🔊" : "🎤"}
              </motion.button>
            </div>

            {/* Wave bars when speaking */}
            <div className="h-6 flex items-center gap-1">
              {isSpeaking
                ? [...Array(9)].map((_, i) => (
                    <motion.div key={i}
                      className="w-1 rounded-full"
                      style={{ background: `rgba(74,127,212,${0.4 + (i % 3) * 0.2})`, minHeight: 4 }}
                      animate={{ height: ['4px', `${8 + Math.sin(i) * 12}px`, '4px'] }}
                      transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.09, ease: "easeInOut" }}
                    />
                  ))
                : null}
            </div>

            {/* State label */}
            <p className="text-xs text-center" style={{ color: 'rgba(240,235,225,0.25)' }}>
              {isSpeaking && "Your stylist is speaking..."}
              {isListening && "Tap mic when done · or just pause"}
              {state === "processing" && "Processing your answer..."}
              {state === "error" && "Mic unavailable — check browser permissions"}
            </p>

            {/* Manual tap to speak */}
            {!isListening && !isSpeaking && state !== "processing" && state !== "complete" && started && (
              <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onClick={() => listen(ans => processAnswer(questionIndex, brandIndex, selectedBrands, brandSizes, ans))}
                className="py-2.5 px-5 rounded-full text-xs font-medium"
                style={{ background: 'rgba(201,168,76,0.08)', color: 'rgba(201,168,76,0.7)', border: '1px solid rgba(201,168,76,0.2)' }}
              >
                Tap to Speak
              </motion.button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Intro ──────────────────────────────────────────────────────
function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10"
    >
      {/* Animated orb */}
      <div className="relative mb-8">
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 rounded-full flex items-center justify-center text-4xl"
          style={{
            background: 'linear-gradient(135deg, rgba(45,74,138,0.3), rgba(201,168,76,0.1))',
            border: '1px solid rgba(201,168,76,0.25)',
            boxShadow: '0 0 60px rgba(201,168,76,0.1), 0 0 120px rgba(45,74,138,0.08)'
          }}
        >
          🎙️
        </motion.div>
        {[1.4, 1.9].map((s, i) => (
          <motion.div key={i}
            className="absolute inset-0 rounded-full"
            style={{ border: '1px solid rgba(201,168,76,0.1)' }}
            animate={{ scale: [1, s], opacity: [0.4, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.8 }}
          />
        ))}
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
        style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.18)' }}>
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#C9A84C' }} />
        <span className="text-[10px] tracking-widest uppercase" style={{ color: '#C9A84C' }}>AI Voice</span>
      </div>

      <h1 className="text-2xl font-bold mb-3 leading-tight"
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
        Voice Fit Quiz
      </h1>
      <p className="text-sm leading-relaxed mb-8 max-w-xs" style={{ color: 'rgba(240,235,225,0.4)' }}>
        Just talk naturally. Your AI stylist asks ten questions and finds jeans that fit — no typing needed.
      </p>

      <div className="w-full max-w-xs space-y-2 mb-10 text-left">
        {[
          ["🎤", "Speak naturally — no commands"],
          ["🔊", "Your stylist talks back & confirms"],
          ["⏭️", `Say "skip" for optional questions`],
          ["🚫", `Say "none" if you skip brands`],
        ].map(([icon, text], i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className="flex items-center gap-3 text-sm py-2 px-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.025)', color: 'rgba(240,235,225,0.45)' }}>
            <span>{icon}</span><span>{text}</span>
          </motion.div>
        ))}
      </div>

      <motion.button
        onClick={onStart}
        whileTap={{ scale: 0.97 }}
        className="w-full max-w-xs py-4 rounded-2xl font-semibold text-sm tracking-wide"
        style={{
          background: 'linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.05))',
          color: '#C9A84C',
          border: '1px solid rgba(201,168,76,0.3)',
          boxShadow: '0 4px 24px rgba(201,168,76,0.1)',
        }}
      >
        Start Voice Quiz →
      </motion.button>
      <p className="mt-4 text-[11px]" style={{ color: 'rgba(240,235,225,0.2)' }}>Requires microphone access</p>
    </motion.div>
  );
}

// ── Voice Summary ──────────────────────────────────────────────
function VoiceSummary({ profile }: { profile: FitProfile }) {
  const tags = [
    profile.height    && { l: "Height",    v: profile.height,    c: '#4A7FD4' },
    profile.waist     && { l: "Waist",     v: profile.waist,     c: '#4A7FD4' },
    profile.hip       && { l: "Hips",      v: profile.hip,       c: '#4A7FD4' },
    profile.rise      && { l: "Rise",      v: profile.rise,      c: '#C9A84C' },
    profile.thighFit  && { l: "Thigh",     v: profile.thighFit,  c: '#C9A84C' },
    profile.waistFit  && { l: "Waist Fit", v: profile.waistFit,  c: '#C9A84C' },
    profile.frustration && { l: "Pain Point", v: profile.frustration, c: '#F87171' },
  ].filter(Boolean) as { l: string; v: string; c: string }[];

  const doRedirect = () => {
    window.location.href = `${JACKIE_URL}?fitProfile=${encodeURIComponent(JSON.stringify(profile))}`;
  };

  useEffect(() => { const t = setTimeout(doRedirect, 4000); return () => clearTimeout(t); }, []);

  return (
    <div className="min-h-screen flex flex-col px-5 pt-10 pb-8" style={{ background: '#07080D' }}>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(201,168,76,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
        transition={{ type:"spring", stiffness:240, damping:20 }}
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6"
        style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)', boxShadow: '0 0 40px rgba(201,168,76,0.1)' }}>
        ✓
      </motion.div>

      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}>
        <div className="text-[10px] tracking-widest uppercase mb-2" style={{ color: 'rgba(201,168,76,0.6)' }}>All done</div>
        <h2 className="text-3xl font-bold mb-2 leading-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Your fit profile<br />
          <span style={{ background:'linear-gradient(135deg,#C9A84C,#F0D98A)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            is ready.
          </span>
        </h2>
        <p className="text-sm mb-6" style={{ color: 'rgba(240,235,225,0.3)' }}>Heading to Jackie Jeans in a moment...</p>
      </motion.div>

      {tags.length > 0 && (
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
          className="flex flex-wrap gap-2 mb-6">
          {tags.map((t, i) => (
            <motion.div key={i}
              initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.3 + i*0.06 }}
              className="px-3 py-2 rounded-xl flex items-center gap-1.5"
              style={{ background:`rgba(${t.c==='#4A7FD4'?'45,74,138':t.c==='#C9A84C'?'201,168,76':'248,113,113'},0.1)`, border:`1px solid ${t.c}25` }}>
              <span className="text-[9px] tracking-wide uppercase" style={{ color:`${t.c}80` }}>{t.l}</span>
              <span className="text-xs font-semibold" style={{ color: t.c }}>{t.v}</span>
            </motion.div>
          ))}
        </motion.div>
      )}

      <motion.button
        onClick={doRedirect}
        whileTap={{ scale:0.97 }}
        initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}
        className="w-full py-4 rounded-2xl font-semibold text-sm mt-auto"
        style={{ background:'linear-gradient(135deg,#2D4A8A,#1A2744)', color:'#F0EBE1', border:'1px solid rgba(74,127,212,0.35)', boxShadow:'0 4px 24px rgba(45,74,138,0.25)' }}>
        Find My Perfect Jeans →
      </motion.button>
      <a href={`${JACKIE_URL}?fitProfile=${encodeURIComponent(JSON.stringify(profile))}`}
        className="mt-3 block text-center text-xs underline-offset-4 underline"
        style={{ color:'rgba(240,235,225,0.18)' }}>
        Click here if not redirected
      </a>
    </div>
  );
}
