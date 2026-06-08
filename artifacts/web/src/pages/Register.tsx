import { useState } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Languages, FileText, ChevronRight, CheckCircle,
  Sparkles, ArrowLeft, Shield, Zap, Star,
} from "lucide-react";

/* ─── Floating orb ─────────────────────────────────────────────── */
function FloatingOrb({ x, y, size, delay, color, blur = 80 }: {
  x: string; y: string; size: number; delay: number; color: string; blur?: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: x, top: y, width: size, height: size, background: color, filter: `blur(${blur}px)` }}
      animate={{ y: [0, -24, 0], x: [0, 8, 0], scale: [1, 1.06, 1] }}
      transition={{ duration: 9 + delay, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

/* ─── Particle ──────────────────────────────────────────────────── */
function Particle({ x, y, delay, size, duration }: { x: string; y: string; delay: number; size: number; duration: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: x, top: y, width: size, height: size, background: "rgba(139,92,246,0.55)" }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: [0, 0.7, 0], scale: [0, 1, 0], y: [0, -50, -100] }}
      transition={{ duration, repeat: Infinity, delay, ease: "easeOut" }}
    />
  );
}

const PARTICLES = Array.from({ length: 20 }, () => ({
  x: `${Math.random() * 100}%`,
  y: `${Math.random() * 100}%`,
  delay: Math.random() * 6,
  size: Math.random() * 3 + 1,
  duration: Math.random() * 3 + 3,
}));

const ROLES = [
  {
    id: "customer",
    label: "Klient",
    description: "Kërkon shërbime noteriale ose përkthimi profesional",
    icon: User,
    accent: "#3b82f6",
    accentBg: "rgba(59,130,246,0.12)",
    accentBorder: "rgba(59,130,246,0.35)",
    accentGlow: "rgba(59,130,246,0.25)",
    features: ["Krijo kërkesa", "Gjej profesionistë", "Śhtrak progresin", "Paguaj online"],
    badge: "Më i popullarizuar",
    path: "/register/customer",
  },
  {
    id: "translator",
    label: "Përkthyes",
    description: "Ofron shërbime të përkthimit profesional dhe të çertifikuar",
    icon: Languages,
    accent: "#10b981",
    accentBg: "rgba(16,185,129,0.12)",
    accentBorder: "rgba(16,185,129,0.35)",
    accentGlow: "rgba(16,185,129,0.25)",
    features: ["Prano punë", "Ngarko dokumente", "Menaxho çmimet", "Merr pagesa"],
    badge: null,
    path: "/register/translator",
  },
  {
    id: "notary",
    label: "Noter",
    description: "Ofron shërbime noteriale të licensuara dhe zyrtare",
    icon: FileText,
    accent: "#f59e0b",
    accentBg: "rgba(245,158,11,0.12)",
    accentBorder: "rgba(245,158,11,0.35)",
    accentGlow: "rgba(245,158,11,0.25)",
    features: ["Aprovo klientë", "Menaxho takimet", "Ngarko dokumente", "Gjenero fatura"],
    badge: null,
    path: "/register/notary",
  },
];

export default function Register() {
  const [, setLocation] = useLocation();
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (role: typeof ROLES[0]) => {
    setSelected(role.id);
    setTimeout(() => setLocation(role.path), 300);
  };

  return (
    <div className="min-h-screen flex flex-col overflow-hidden" style={{ background: "#080816" }}>

      {/* ── Background layers ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <FloatingOrb x="5%"   y="10%" size={500} delay={0} color="rgba(109,40,217,0.15)" blur={120} />
        <FloatingOrb x="60%"  y="55%" size={380} delay={2} color="rgba(16,185,129,0.08)"  blur={100} />
        <FloatingOrb x="-5%"  y="70%" size={300} delay={1} color="rgba(67,56,202,0.12)"   blur={90}  />
        <FloatingOrb x="80%"  y="5%"  size={250} delay={3} color="rgba(245,158,11,0.07)"  blur={80}  />
        {PARTICLES.map((p, i) => <Particle key={i} {...p} />)}
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
        {/* Diagonal shimmer */}
        <motion.div
          className="absolute inset-0"
          style={{ background: "linear-gradient(105deg, transparent 30%, rgba(139,92,246,0.03) 50%, transparent 70%)" }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear", repeatDelay: 5 }}
        />
      </div>

      {/* ── Header ── */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center justify-between px-8 py-5 border-b"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(8,8,22,0.8)", backdropFilter: "blur(20px)" }}
      >
        <Link href="/">
          <motion.div whileHover={{ x: -3 }} className="flex items-center gap-2 cursor-pointer">
            <motion.div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(139,92,246,0.18)", border: "1px solid rgba(139,92,246,0.35)" }}
              whileHover={{ scale: 1.1, rotate: -5 }}
            >
              <Languages className="h-4 w-4 text-violet-400" />
            </motion.div>
            <span className="font-bold text-white text-sm">DocBridge</span>
          </motion.div>
        </Link>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.38)" }}>
          Keni llogari?{" "}
          <Link href="/login">
            <motion.span
              className="font-semibold cursor-pointer"
              style={{ color: "#a78bfa" }}
              whileHover={{ textShadow: "0 0 12px rgba(167,139,250,0.6)" }}
            >
              Hyni
            </motion.span>
          </Link>
        </p>
      </motion.header>

      {/* ── Main ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16">

        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1 }}
          className="text-center mb-14"
        >
          <motion.div
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-6 text-xs font-medium"
            style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.28)", color: "#a78bfa" }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
          >
            <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}>
              <Sparkles className="h-3 w-3" />
            </motion.div>
            Regjistrim falas
          </motion.div>

          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Çfarë lloji llogarie
            <br />
            <span style={{ color: "#a78bfa" }}>dëshironi?</span>
          </h1>
          <p className="text-base max-w-lg mx-auto" style={{ color: "rgba(255,255,255,0.42)" }}>
            Zgjidhni rolin tuaj në platformën DocBridge. Çdo lloj llogarie ka veçori të posaçme.
          </p>
        </motion.div>

        {/* Role cards */}
        <div className="grid md:grid-cols-3 gap-5 w-full max-w-4xl">
          {ROLES.map((role, i) => {
            const Icon = role.icon;
            const isHovered = hovered === role.id;
            const isSelected = selected === role.id;

            return (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.3 + i * 0.12, type: "spring", stiffness: 100 }}
              >
                <motion.button
                  onClick={() => handleSelect(role)}
                  onHoverStart={() => setHovered(role.id)}
                  onHoverEnd={() => setHovered(null)}
                  animate={isSelected ? { scale: 0.96, opacity: 0.7 } : { scale: 1, opacity: 1 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 280, damping: 20 }}
                  className="w-full text-left relative rounded-2xl p-6 overflow-hidden"
                  style={{
                    background: isHovered
                      ? `linear-gradient(135deg, ${role.accentBg}, rgba(255,255,255,0.02))`
                      : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isHovered ? role.accentBorder : "rgba(255,255,255,0.07)"}`,
                    boxShadow: isHovered
                      ? `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px ${role.accentBorder}, 0 8px 32px ${role.accentGlow}`
                      : "0 8px 32px rgba(0,0,0,0.3)",
                    backdropFilter: "blur(12px)",
                    transition: "background 0.3s, border 0.3s, box-shadow 0.3s",
                  }}
                >
                  {/* Top edge highlight */}
                  <motion.div
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-px"
                    style={{ background: `linear-gradient(90deg, transparent, ${role.accent}, transparent)` }}
                    animate={{ width: isHovered ? "80%" : "0%" }}
                    transition={{ duration: 0.35 }}
                  />

                  {/* Glow blob inside card */}
                  <motion.div
                    className="absolute top-0 right-0 rounded-full pointer-events-none"
                    style={{ width: 200, height: 200, background: `radial-gradient(circle, ${role.accentBg} 0%, transparent 70%)`, filter: "blur(30px)" }}
                    animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1.3 : 0.8 }}
                    transition={{ duration: 0.4 }}
                  />

                  {/* Popular badge */}
                  {role.badge && (
                    <motion.div
                      className="absolute top-4 right-4 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold"
                      style={{ background: "rgba(139,92,246,0.18)", border: "1px solid rgba(139,92,246,0.35)", color: "#a78bfa" }}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Star className="h-2.5 w-2.5 fill-current" />
                      {role.badge}
                    </motion.div>
                  )}

                  {/* Icon */}
                  <motion.div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 relative overflow-hidden"
                    style={{ background: role.accentBg, border: `1px solid ${role.accentBorder}` }}
                    animate={{ boxShadow: isHovered ? `0 0 20px ${role.accentGlow}` : "none" }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      className="absolute inset-0 rounded-xl"
                      style={{ background: `linear-gradient(135deg, ${role.accentBg}, transparent)` }}
                      animate={{ rotate: isHovered ? 180 : 0 }}
                      transition={{ duration: 0.5 }}
                    />
                    <Icon className="h-5 w-5 relative z-10" style={{ color: role.accent }} />
                  </motion.div>

                  {/* Text */}
                  <h3 className="font-serif text-xl font-bold text-white mb-1">{role.label}</h3>
                  <p className="text-sm mb-5 leading-relaxed" style={{ color: "rgba(255,255,255,0.42)" }}>
                    {role.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2 mb-6">
                    {role.features.map((f, fi) => (
                      <motion.li
                        key={f}
                        className="flex items-center gap-2.5 text-sm"
                        style={{ color: "rgba(255,255,255,0.65)" }}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.12 + fi * 0.06 }}
                      >
                        <motion.div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: role.accent, boxShadow: isHovered ? `0 0 6px ${role.accent}` : "none" }}
                          animate={{ scale: isHovered ? [1, 1.4, 1] : 1 }}
                          transition={{ duration: 0.8, repeat: isHovered ? Infinity : 0, delay: fi * 0.15 }}
                        />
                        {f}
                      </motion.li>
                    ))}
                  </ul>

                  {/* CTA row */}
                  <motion.div
                    className="flex items-center gap-1.5 text-sm font-semibold relative z-10"
                    style={{ color: role.accent }}
                    animate={{ gap: isHovered ? "10px" : "6px" }}
                    transition={{ duration: 0.2 }}
                  >
                    Regjistrohu si {role.label}
                    <motion.div animate={{ x: isHovered ? 4 : 0 }} transition={{ type: "spring", stiffness: 400 }}>
                      <ChevronRight className="h-4 w-4" />
                    </motion.div>
                  </motion.div>
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        {/* Legal footnote */}
        <motion.p
          className="text-center text-xs mt-10"
          style={{ color: "rgba(255,255,255,0.22)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          Duke u regjistruar, pranoni{" "}
          <span className="underline cursor-pointer hover:text-white/50 transition-colors">Kushtet e Shërbimit</span>{" "}
          dhe{" "}
          <span className="underline cursor-pointer hover:text-white/50 transition-colors">Politikën e Privatësisë</span>{" "}
          të DocBridge.
        </motion.p>
      </main>
    </div>
  );
}
