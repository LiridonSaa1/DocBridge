import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import {
  Loader2, Eye, EyeOff, ArrowRight, CheckCircle, Shield,
  Languages, BookOpen, Users, Star, Sparkles, Zap,
} from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email i pavlefshëm"),
  password: z.string().min(6, "Fjalëkalimi duhet të ketë të paktën 6 karaktere"),
});
type LoginForm = z.infer<typeof loginSchema>;

/* ─── Particle dot ─────────────────────────────────────────────── */
function Particle({ x, y, delay, size, duration }: { x: string; y: string; delay: number; size: number; duration: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: x, top: y, width: size, height: size, background: "rgba(139,92,246,0.6)" }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: [0, 0.8, 0], scale: [0, 1, 0], y: [0, -60, -120] }}
      transition={{ duration, repeat: Infinity, delay, ease: "easeOut" }}
    />
  );
}

/* ─── Floating orb ─────────────────────────────────────────────── */
function FloatingOrb({ x, y, size, delay, color, blur = 80 }: { x: string; y: string; size: number; delay: number; color: string; blur?: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: x, top: y, width: size, height: size, background: color, filter: `blur(${blur}px)` }}
      animate={{ y: [0, -28, 0], x: [0, 10, 0], scale: [1, 1.05, 1] }}
      transition={{ duration: 8 + delay, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

/* ─── Animated number counter ──────────────────────────────────── */
function Counter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const step = target / 50;
    let cur = 0;
    const id = setInterval(() => {
      cur = Math.min(cur + step, target);
      setCount(Math.floor(cur));
      if (cur >= target) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [target]);
  return <>{count}{suffix}</>;
}

/* ─── Typewriter cycling words ─────────────────────────────────── */
const WORDS = ["profesionale", "të besuara", "shqiptare", "cilësore"];
function TypewriterWord() {
  const [wordIdx, setWordIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"typing" | "pausing" | "erasing">("typing");

  useEffect(() => {
    const word = WORDS[wordIdx];
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (displayed.length < word.length) {
        timeout = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 80);
      } else {
        timeout = setTimeout(() => setPhase("pausing"), 1800);
      }
    } else if (phase === "pausing") {
      timeout = setTimeout(() => setPhase("erasing"), 200);
    } else {
      if (displayed.length > 0) {
        timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 45);
      } else {
        setWordIdx((wordIdx + 1) % WORDS.length);
        setPhase("typing");
      }
    }
    return () => clearTimeout(timeout);
  }, [displayed, phase, wordIdx]);

  return (
    <span style={{ color: "#a78bfa" }}>
      {displayed}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.6, repeat: Infinity }}
        className="inline-block w-0.5 h-10 bg-violet-400 ml-1 align-middle"
      />
    </span>
  );
}

/* ─── Glowing ring ─────────────────────────────────────────────── */
function GlowRing() {
  return (
    <motion.div
      className="absolute inset-0 rounded-2xl pointer-events-none"
      style={{ border: "1px solid rgba(139,92,246,0.0)" }}
      whileHover={{ borderColor: "rgba(139,92,246,0.4)" }}
      transition={{ duration: 0.3 }}
    />
  );
}

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  x: `${Math.random() * 100}%`,
  y: `${Math.random() * 100}%`,
  delay: Math.random() * 5,
  size: Math.random() * 3 + 1,
  duration: Math.random() * 3 + 3,
}));

const FEATURES = [
  { icon: Shield, label: "Noterë të Certifikuar", desc: "Verifikuar nga autoritetet shtetërore", color: "#8b5cf6" },
  { icon: Languages, label: "Përkthyes Profesionistë", desc: "Çertifikuar dhe me eksperiencë", color: "#6366f1" },
  { icon: BookOpen, label: "Kurse Cilësore", desc: "Trajnime profesionale dhe akademike", color: "#7c3aed" },
];

const STATS = [
  { value: 1200, suffix: "+", label: "Klientë" },
  { value: 98, suffix: "%", label: "Kënaqësi" },
  { value: 340, suffix: "+", label: "Profesionistë" },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const leftRef = useRef<HTMLDivElement>(null);

  // Mouse parallax for left panel
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 });
  const orbX = useTransform(springX, [-400, 400], [-20, 20]);
  const orbY = useTransform(springY, [-300, 300], [-15, 15]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = leftRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginForm) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) {
      toast({ title: "Gabim", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Mirë se vini!", description: "Hytet me sukses." });
      setLocation("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: "#080816" }}>

      {/* ══════════════════ LEFT PANEL ══════════════════════════════ */}
      <motion.div
        ref={leftRef}
        onMouseMove={handleMouseMove}
        className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-14 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0a0a1f 0%, #0d0d2e 60%, #0f0a1e 100%)" }}
      >
        {/* ── Deep ambient orbs ── */}
        <motion.div style={{ x: orbX, y: orbY }} className="absolute inset-0 pointer-events-none">
          <FloatingOrb x="5%"  y="10%" size={420} delay={0} color="rgba(109,40,217,0.22)" blur={100} />
          <FloatingOrb x="55%" y="55%" size={320} delay={2} color="rgba(190,24,93,0.10)" blur={80}  />
          <FloatingOrb x="-8%" y="65%" size={260} delay={1} color="rgba(67,56,202,0.18)"  blur={90}  />
          <FloatingOrb x="70%" y="5%"  size={200} delay={3} color="rgba(139,92,246,0.14)" blur={70}  />
        </motion.div>

        {/* ── Rising particles ── */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {PARTICLES.map((p, i) => <Particle key={i} {...p} />)}
        </div>

        {/* ── Fine grid ── */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />

        {/* ── Diagonal shimmer sweep ── */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(105deg, transparent 30%, rgba(139,92,246,0.04) 50%, transparent 70%)" }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear", repeatDelay: 4 }}
        />

        {/* ── Logo ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden"
              style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.4)" }}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                className="absolute inset-0"
                style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.4), transparent)" }}
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
              <Languages className="h-5 w-5 text-violet-300 relative z-10" />
            </motion.div>
            <div>
              <p className="font-bold text-white text-sm tracking-wide">ShërbimePro</p>
              <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.35)" }}>Platforma Profesionale</p>
            </div>
          </div>
        </motion.div>

        {/* ── Hero text ── */}
        <div className="relative z-10 my-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-7 text-xs font-medium"
              style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.28)", color: "#a78bfa" }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
                <Sparkles className="h-3 w-3" />
              </motion.div>
              Platforma Nr.1 Shqiptare
            </motion.div>

            <div className="mb-3">
              <motion.h1
                className="font-serif text-[52px] font-bold leading-none text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                Shërbime
              </motion.h1>
              <motion.h1
                className="font-serif text-[52px] font-bold leading-none min-h-[64px]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <TypewriterWord />
              </motion.h1>
            </div>

            <motion.p
              className="text-base leading-relaxed mb-10 max-w-sm"
              style={{ color: "rgba(255,255,255,0.45)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
            >
              Noterë, përkthyes dhe kurse — të gjitha në një platformë të besuar dhe të certifikuar.
            </motion.p>
          </motion.div>

          {/* Feature list */}
          <div className="space-y-3">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.55 + i * 0.12 }}
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-3 cursor-default"
                >
                  <motion.div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden"
                    style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.22)" }}
                    whileHover={{ scale: 1.12, borderColor: "rgba(139,92,246,0.5)" }}
                  >
                    <Icon className="h-4 w-4 text-violet-400 relative z-10" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.label}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>{f.desc}</p>
                  </div>
                  <motion.div
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: f.color, boxShadow: `0 0 6px ${f.color}` }}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── Stats row ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.85 }}
          className="relative z-10 flex items-center gap-8 pt-8 border-t"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          {STATS.map((s, i) => (
            <motion.div key={s.label} whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 400 }}>
              <p className="text-[26px] font-bold text-white leading-none tabular-nums">
                <Counter target={s.value} suffix={s.suffix} />
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</p>
            </motion.div>
          ))}
          <div className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            <motion.span
              className="w-2 h-2 rounded-full bg-emerald-400"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            Sistemi aktiv
          </div>
        </motion.div>
      </motion.div>

      {/* ══════════════════ RIGHT PANEL ══════════════════════════════ */}
      <div
        className="w-full lg:w-[48%] flex items-center justify-center p-6 relative overflow-hidden"
        style={{ background: "#0c0c22" }}
      >
        {/* Background glow blobs on right */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute top-[-20%] right-[-20%] rounded-full"
            style={{ width: 500, height: 500, background: "radial-gradient(circle, rgba(109,40,217,0.12) 0%, transparent 70%)" }}
            animate={{ scale: [1, 1.15, 1], rotate: [0, 20, 0] }}
            transition={{ duration: 12, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-[-10%] left-[-10%] rounded-full"
            style={{ width: 350, height: 350, background: "radial-gradient(circle, rgba(67,56,202,0.10) 0%, transparent 70%)" }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 10, repeat: Infinity, delay: 3 }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.1, type: "spring", stiffness: 120 }}
          className="relative w-full max-w-[360px]"
        >
          {/* Glass card */}
          <div
            className="relative rounded-2xl p-8"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Corner glow accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent)" }} />

            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2 mb-7">
              <Languages className="h-5 w-5 text-violet-400" />
              <span className="font-bold text-white">ShërbimePro</span>
            </div>

            {/* Welcome badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.75, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.35, type: "spring" }}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium mb-6"
              style={{ background: "rgba(139,92,246,0.13)", border: "1px solid rgba(139,92,246,0.28)", color: "#a78bfa" }}
            >
              <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 5 }}>
                <Star className="h-3 w-3 fill-current" />
              </motion.div>
              Mirë se ktheheni
            </motion.div>

            <motion.h2
              className="text-[26px] font-bold text-white mb-1 leading-tight"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              Hyni për të vazhduar
            </motion.h2>
            <motion.p
              className="text-sm mb-8"
              style={{ color: "rgba(255,255,255,0.38)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              Aksesoni panelin dhe shërbimet tuaja
            </motion.p>

            {/* ── Form ── */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* Email */}
              <motion.div
                className="space-y-1.5"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="text-[11px] font-semibold tracking-[0.12em] uppercase flex items-center gap-2" style={{ color: "rgba(255,255,255,0.42)" }}>
                  Email
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    placeholder="emri@shembull.com"
                    data-testid="input-email"
                    {...register("email")}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 outline-none transition-all duration-300"
                    style={{
                      background: focusedField === "email" ? "rgba(139,92,246,0.07)" : "rgba(255,255,255,0.04)",
                      border: focusedField === "email" ? "1px solid rgba(139,92,246,0.65)" : "1px solid rgba(255,255,255,0.08)",
                      boxShadow: focusedField === "email" ? "0 0 0 3px rgba(139,92,246,0.1), 0 0 20px rgba(139,92,246,0.08)" : "none",
                    }}
                  />
                  <AnimatePresence>
                    {focusedField === "email" && (
                      <motion.div
                        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} exit={{ scaleX: 0 }}
                        className="absolute bottom-0 left-4 right-4 h-px rounded-full"
                        style={{ background: "linear-gradient(90deg, transparent, #8b5cf6, transparent)", transformOrigin: "center" }}
                      />
                    )}
                  </AnimatePresence>
                </div>
                <AnimatePresence>
                  {errors.email && (
                    <motion.p initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-red-400 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-red-400 inline-block" />
                      {errors.email.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Password */}
              <motion.div
                className="space-y-1.5"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.57 }}
              >
                <label className="text-[11px] font-semibold tracking-[0.12em] uppercase" style={{ color: "rgba(255,255,255,0.42)" }}>
                  Fjalëkalimi
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    data-testid="input-password"
                    {...register("password")}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-4 py-3 pr-12 rounded-xl text-sm text-white placeholder:text-white/20 outline-none transition-all duration-300"
                    style={{
                      background: focusedField === "password" ? "rgba(139,92,246,0.07)" : "rgba(255,255,255,0.04)",
                      border: focusedField === "password" ? "1px solid rgba(139,92,246,0.65)" : "1px solid rgba(255,255,255,0.08)",
                      boxShadow: focusedField === "password" ? "0 0 0 3px rgba(139,92,246,0.1), 0 0 20px rgba(139,92,246,0.08)" : "none",
                    }}
                  />
                  <AnimatePresence>
                    {focusedField === "password" && (
                      <motion.div
                        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} exit={{ scaleX: 0 }}
                        className="absolute bottom-0 left-4 right-12 h-px rounded-full"
                        style={{ background: "linear-gradient(90deg, transparent, #8b5cf6, transparent)", transformOrigin: "center" }}
                      />
                    )}
                  </AnimatePresence>
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors rounded-lg p-1"
                    style={{ color: "rgba(255,255,255,0.28)" }}
                    whileHover={{ color: "rgba(255,255,255,0.7)", scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <AnimatePresence mode="wait">
                      <motion.div key={showPassword ? "off" : "on"} initial={{ opacity: 0, rotate: -10 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 10 }} transition={{ duration: 0.15 }}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </motion.div>
                    </AnimatePresence>
                  </motion.button>
                </div>
                <AnimatePresence>
                  {errors.password && (
                    <motion.p initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-red-400 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-red-400 inline-block" />
                      {errors.password.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Submit button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.63 }}
              >
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={isSubmitting ? {} : { scale: 1.015, boxShadow: "0 8px 32px rgba(139,92,246,0.5)" }}
                  whileTap={isSubmitting ? {} : { scale: 0.975 }}
                  data-testid="button-submit-login"
                  className="w-full py-3.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 mt-1 relative overflow-hidden"
                  style={{
                    background: isSubmitting
                      ? "rgba(109,40,217,0.45)"
                      : "linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #8b5cf6 100%)",
                    boxShadow: isSubmitting ? "none" : "0 4px 20px rgba(109,40,217,0.4)",
                  }}
                >
                  {/* Shimmer overlay on button */}
                  {!isSubmitting && (
                    <motion.div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.12) 50%, transparent 65%)" }}
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {isSubmitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Duke hyrë...</>
                    ) : (
                      <>Hyni <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.2, repeat: Infinity }}><ArrowRight className="h-4 w-4" /></motion.div></>
                    )}
                  </span>
                </motion.button>
              </motion.div>
            </form>

            {/* Divider */}
            <motion.div
              className="flex items-center gap-3 my-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
              <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.22)" }}>ose</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            </motion.div>

            {/* Register link */}
            <motion.p
              className="text-center text-sm"
              style={{ color: "rgba(255,255,255,0.38)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.72 }}
            >
              Nuk keni llogari?{" "}
              <Link href="/register" data-testid="link-to-register"
                className="font-semibold transition-all duration-200 relative"
                style={{ color: "#a78bfa" }}
              >
                <motion.span whileHover={{ textShadow: "0 0 12px rgba(167,139,250,0.6)" }}>
                  Regjistrohu falas
                </motion.span>
              </Link>
            </motion.p>

            {/* Trust badges */}
            <motion.div
              className="mt-8 pt-6 border-t flex items-center justify-center gap-5"
              style={{ borderColor: "rgba(255,255,255,0.05)" }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.78 }}
            >
              {[
                { icon: Shield, text: "E sigurt" },
                { icon: CheckCircle, text: "E verifikuar" },
                { icon: Users, text: "340+ pro" },
              ].map((b, i) => {
                const Icon = b.icon;
                return (
                  <motion.div
                    key={b.text}
                    className="flex items-center gap-1.5 text-[11px]"
                    style={{ color: "rgba(255,255,255,0.22)" }}
                    whileHover={{ color: "rgba(255,255,255,0.55)", y: -2 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Icon className="h-3 w-3" />
                    {b.text}
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Glow beneath card */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-60 h-16 rounded-full pointer-events-none"
            style={{ background: "rgba(109,40,217,0.2)", filter: "blur(24px)" }} />
        </motion.div>
      </div>
    </div>
  );
}
