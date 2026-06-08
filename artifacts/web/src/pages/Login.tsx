import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Eye, EyeOff, ArrowRight, CheckCircle, Shield,
  Languages, BookOpen, Users, Star, Sparkles,
} from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email i pavlefshëm"),
  password: z.string().min(6, "Fjalëkalimi duhet të ketë të paktën 6 karaktere"),
});
type LoginForm = z.infer<typeof loginSchema>;

// ─── Floating orb component ────────────────────────────────────────────────────
function FloatingOrb({ x, y, size, delay, color }: { x: string; y: string; size: number; delay: number; color: string }) {
  return (
    <motion.div
      className="absolute rounded-full blur-3xl pointer-events-none"
      style={{ left: x, top: y, width: size, height: size, background: color }}
      animate={{ y: [0, -20, 0], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 6 + delay, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const step = target / 40;
    let cur = 0;
    const id = setInterval(() => {
      cur = Math.min(cur + step, target);
      setCount(Math.floor(cur));
      if (cur >= target) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, [target]);
  return <span>{count}{suffix}</span>;
}

const FEATURES = [
  { icon: Shield, label: "Noterë të Certifikuar", desc: "Verifikuar nga autoritetet shtetërore" },
  { icon: Languages, label: "Përkthyes Profesionistë", desc: "Çertifikuar dhe me eksperiencë" },
  { icon: BookOpen, label: "Kurse Cilësore", desc: "Trajnime profesionale dhe akademike" },
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
    <div className="min-h-screen flex overflow-hidden" style={{ background: "#0d0d1a" }}>

      {/* ── LEFT PANEL ─────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-14 overflow-hidden">

        {/* Background orbs */}
        <FloatingOrb x="10%" y="20%" size={300} delay={0} color="rgba(139,92,246,0.18)" />
        <FloatingOrb x="50%" y="60%" size={250} delay={2} color="rgba(190,24,93,0.12)" />
        <FloatingOrb x="-5%" y="70%" size={200} delay={1} color="rgba(79,70,229,0.15)" />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.25)", border: "1px solid rgba(139,92,246,0.4)" }}>
              <Languages className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="font-bold text-white text-sm tracking-wide">ShërbimePro</p>
              <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>Platforma Profesionale</p>
            </div>
          </div>
        </motion.div>

        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="relative z-10 my-auto"
        >
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-6 text-xs font-medium" style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa" }}>
            <Sparkles className="h-3 w-3" /> Platforma Nr.1 Shqiptare
          </div>

          <h1 className="font-serif text-5xl font-bold leading-tight text-white mb-2">
            Shërbime
          </h1>
          <h1 className="font-serif text-5xl font-bold leading-tight mb-6">
            <span style={{ color: "#8b5cf6" }}>profesionale</span>
            <span className="text-white"> shqiptare</span>
          </h1>
          <p className="text-lg leading-relaxed mb-10" style={{ color: "rgba(255,255,255,0.55)" }}>
            Noterë, përkthyes dhe kurse — të gjitha në një platformë të besuar dhe të certifikuar.
          </p>

          {/* Feature list */}
          <div className="space-y-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}>
                    <Icon className="h-4 w-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{f.label}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{f.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="relative z-10 flex items-center gap-8 border-t pt-8"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          {STATS.map(s => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-white">
                <Counter target={s.value} suffix={s.suffix} />
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</p>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Sistemi aktiv
          </div>
        </motion.div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative" style={{ background: "#111127" }}>

        {/* Subtle glow behind card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(139,92,246,0.07)" }} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Languages className="h-5 w-5 text-violet-400" />
            <span className="font-bold text-white">ShërbimePro</span>
          </div>

          {/* Welcome badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium mb-6"
            style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa" }}
          >
            <Star className="h-3 w-3 fill-current" />
            Mirë se ktheheni
          </motion.div>

          <h2 className="text-2xl font-bold text-white mb-1">Hyni për të vazhduar</h2>
          <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>
            Aksesoni panelin dhe shërbimet tuaja
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Email field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-wide uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="emri@shembull.com"
                  data-testid="input-email"
                  {...register("email")}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/25 outline-none transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: focusedField === "email" ? "1px solid rgba(139,92,246,0.7)" : "1px solid rgba(255,255,255,0.1)",
                    boxShadow: focusedField === "email" ? "0 0 0 3px rgba(139,92,246,0.12)" : "none",
                  }}
                />
              </div>
              <AnimatePresence>
                {errors.email && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-xs text-red-400">{errors.email.message}</motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-wide uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>
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
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm text-white placeholder:text-white/25 outline-none transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: focusedField === "password" ? "1px solid rgba(139,92,246,0.7)" : "1px solid rgba(255,255,255,0.1)",
                    boxShadow: focusedField === "password" ? "0 0 0 3px rgba(139,92,246,0.12)" : "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <AnimatePresence>
                {errors.password && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-xs text-red-400">{errors.password.message}</motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              data-testid="button-submit-login"
              className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 mt-2 transition-all duration-200"
              style={{
                background: isSubmitting
                  ? "rgba(139,92,246,0.5)"
                  : "linear-gradient(135deg, #7c3aed, #8b5cf6)",
                boxShadow: isSubmitting ? "none" : "0 4px 24px rgba(139,92,246,0.35)",
              }}
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Duke hyrë...</>
              ) : (
                <>Hyni <ArrowRight className="h-4 w-4" /></>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>ose</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
          </div>

          {/* Register link */}
          <p className="text-center text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Nuk keni llogari?{" "}
            <Link href="/register" data-testid="link-to-register"
              className="font-medium transition-colors hover:text-violet-300" style={{ color: "#a78bfa" }}>
              Regjistrohu falas
            </Link>
          </p>

          {/* Trust badges */}
          <div className="mt-10 flex items-center justify-center gap-4">
            {[
              { icon: Shield, text: "E sigurt" },
              { icon: CheckCircle, text: "E verifikuar" },
              { icon: Users, text: "340+ profesionistë" },
            ].map(b => {
              const Icon = b.icon;
              return (
                <div key={b.text} className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                  <Icon className="h-3 w-3" />
                  {b.text}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
