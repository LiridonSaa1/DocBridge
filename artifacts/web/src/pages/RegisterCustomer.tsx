import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, User, MapPin, ShieldCheck, ChevronRight, ChevronLeft, Upload, CheckCircle2, Languages } from "lucide-react";

/* ─── Shared dark helpers ─── */
function FloatingOrb({ x, y, size, delay, color }: { x: string; y: string; size: number; delay: number; color: string }) {
  return (
    <motion.div className="absolute rounded-full pointer-events-none"
      style={{ left: x, top: y, width: size, height: size, background: color, filter: "blur(90px)" }}
      animate={{ y: [0, -22, 0], x: [0, 8, 0] }}
      transition={{ duration: 9 + delay, repeat: Infinity, ease: "easeInOut", delay }} />
  );
}

function DarkInput({ placeholder, type = "text", value, onChange, onBlur, name }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <input name={name} type={type} placeholder={placeholder} value={value} onChange={onChange}
      onBlur={() => { setFocused(false); onBlur?.(); }} onFocus={() => setFocused(true)}
      className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder:text-white/25 outline-none transition-all duration-200"
      style={{
        background: focused ? "rgba(59,130,246,0.07)" : "rgba(255,255,255,0.04)",
        border: focused ? "1px solid rgba(59,130,246,0.6)" : "1px solid rgba(255,255,255,0.08)",
        boxShadow: focused ? "0 0 0 3px rgba(59,130,246,0.1)" : "none",
      }} />
  );
}

function DarkLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-semibold tracking-wide uppercase mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>{children}</label>;
}

const ACCENT = "#3b82f6";
const ACCENT_BG = "rgba(59,130,246,0.12)";
const ACCENT_BORDER = "rgba(59,130,246,0.35)";

const step1Schema = z.object({
  firstName: z.string().min(2, "Emri duhet të ketë të paktën 2 karaktere"),
  lastName: z.string().min(2, "Mbiemri duhet të ketë të paktën 2 karaktere"),
  dateOfBirth: z.string().min(1, "Data e lindjes është e detyrueshme"),
  gender: z.string().min(1, "Gjinia është e detyrueshme"),
  personalNumber: z.string().optional(),
  email: z.string().email("Email i pavlefshëm"),
  phone: z.string().min(6, "Numri i telefonit i pavlefshëm"),
  password: z.string().min(8, "Fjalëkalimi duhet të ketë të paktën 8 karaktere"),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: "Fjalëkalimet nuk përputhen", path: ["confirmPassword"] });

const step2Schema = z.object({
  country: z.string().min(1, "Shteti është i detyrueshëm"),
  city: z.string().min(2, "Qyteti është i detyrueshëm"),
  address: z.string().min(5, "Adresa është e detyrueshme"),
});

const step3Schema = z.object({
  documentType: z.string().min(1, "Lloji i dokumentit është i detyrueshëm"),
  confirmAccuracy: z.boolean().refine(v => v, "Duhet të konfirmoni saktësinë"),
});

const STEPS = [
  { title: "Informacioni Personal", icon: User },
  { title: "Adresa", icon: MapPin },
  { title: "Verifikimi i Identitetit", icon: ShieldCheck },
];
const COUNTRIES = ["Shqipëri", "Kosovë", "Maqedoni e Veriut", "Mal i Zi", "Serbi", "Greqi", "Itali", "Gjermani", "Mbretëria e Bashkuar", "SHBA", "Tjetër"];

export default function RegisterCustomer() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  const getSchema = () => step === 1 ? step1Schema : step === 2 ? step2Schema : step3Schema;
  const form = useForm<any>({ resolver: zodResolver(getSchema()), defaultValues: formData });

  const onNext = (values: any) => { setFormData(p => ({ ...p, ...values })); setStep(s => s + 1); form.reset(); };

  const onSubmit = async (values: any) => {
    const allData = { ...formData, ...values };
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: allData.email, password: allData.password,
        options: { data: { role: "customer", full_name: `${allData.firstName} ${allData.lastName}`, first_name: allData.firstName, last_name: allData.lastName } },
      });
      if (authError) { toast({ title: "Gabim", description: authError.message, variant: "destructive" }); setLoading(false); return; }
      const userId = authData.user?.id;
      if (!userId) { setLoading(false); return; }
      await fetch("/api/users/register", {
        method: "POST", headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ id: userId, email: allData.email, role: "customer", firstName: allData.firstName, lastName: allData.lastName, fullName: `${allData.firstName} ${allData.lastName}`, phone: allData.phone, personalNumber: allData.personalNumber ?? null, dateOfBirth: allData.dateOfBirth, gender: allData.gender, country: allData.country, city: allData.city, address: allData.address, verificationStatus: "pending_email", status: "pending" }),
      });
      if (frontFile || selfieFile) {
        const bucket = "identity-documents";
        const uploads: Promise<any>[] = [];
        if (frontFile) uploads.push(supabase.storage.from(bucket).upload(`${userId}/front_${Date.now()}`, frontFile, { upsert: true }));
        if (backFile) uploads.push(supabase.storage.from(bucket).upload(`${userId}/back_${Date.now()}`, backFile, { upsert: true }));
        if (selfieFile) uploads.push(supabase.storage.from(bucket).upload(`${userId}/selfie_${Date.now()}`, selfieFile, { upsert: true }));
        await Promise.allSettled(uploads);
      }
      toast({ title: "Llogaria u krijua!", description: "Ju lutemi verifikoni emailin tuaj." });
      setLocation("/verify-email");
    } catch (err: any) {
      toast({ title: "Gabim", description: err.message ?? "Ndodhi një gabim.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const progress = (step / STEPS.length) * 100;

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: "#080816" }}>

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-[38%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0a0a1f 0%, #0d0b28 100%)" }}>
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        <FloatingOrb x="10%" y="15%" size={300} delay={0} color={`rgba(59,130,246,0.2)`} />
        <FloatingOrb x="50%" y="60%" size={220} delay={2} color="rgba(109,40,217,0.15)" />
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(105deg, transparent 30%, rgba(59,130,246,0.03) 50%, transparent 70%)" }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 9, repeat: Infinity, ease: "linear", repeatDelay: 5 }} />

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: ACCENT_BG, border: `1px solid ${ACCENT_BORDER}` }}>
            <Languages className="h-4 w-4" style={{ color: ACCENT }} />
          </div>
          <span className="font-bold text-white text-sm">DocBridge</span>
        </motion.div>

        {/* Steps */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="relative z-10 my-auto">
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>Regjistrim Klient</p>
          <h2 className="font-serif text-2xl font-bold text-white mb-8">Krijo llogarinë tënde</h2>
          <div className="relative">
            {/* Connecting line track */}
            <div className="absolute left-5 top-5 bottom-5 w-0.5" style={{ background: "rgba(255,255,255,0.08)" }} />
            {/* Fill line */}
            <motion.div
              className="absolute left-5 top-5 w-0.5"
              style={{ background: `linear-gradient(to bottom, ${ACCENT}, rgba(59,130,246,0.3))` }}
              animate={{ height: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
            <div className="space-y-0">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const done = step > i + 1;
                const active = step === i + 1;
                return (
                  <motion.div key={i} className="flex items-center gap-4 py-4 relative z-10"
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
                    <motion.div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative"
                      animate={active ? { boxShadow: [`0 0 0 0 ${ACCENT}40`, `0 0 0 8px ${ACCENT}00`] } : {}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      style={{
                        background: done ? "#22c55e" : active ? ACCENT : "rgba(255,255,255,0.07)",
                        border: `2px solid ${done ? "#22c55e" : active ? ACCENT : "rgba(255,255,255,0.12)"}`,
                      }}
                    >
                      {done ? <CheckCircle2 className="h-4 w-4 text-white" /> : <Icon className="h-4 w-4 text-white" />}
                    </motion.div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>Hapi {i + 1}</p>
                      <p className={`text-sm font-semibold ${active ? "text-white" : done ? "text-white/70" : "text-white/35"}`}>{s.title}</p>
                    </div>
                    {active && (
                      <motion.div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }}
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Progress */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="relative z-10">
          <div className="flex justify-between text-xs mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>
            <span>Progresi</span><span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
            <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${ACCENT}, #60a5fa)` }}
              animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
          </div>
        </motion.div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="w-full lg:w-[62%] flex items-center justify-center p-6 lg:p-12 overflow-y-auto" style={{ background: "#0c0c22" }}>
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${ACCENT_BG} 0%, transparent 70%)`, filter: "blur(60px)" }} />

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-xl relative z-10">

          {/* Back button */}
          <motion.button
            onClick={() => step > 1 ? (setStep(s => s - 1), form.reset(formData)) : setLocation("/register")}
            className="flex items-center gap-1.5 text-sm mb-6 transition-colors"
            style={{ color: "rgba(255,255,255,0.38)" }}
            whileHover={{ color: "rgba(255,255,255,0.8)", x: -3 }}
          >
            <ChevronLeft className="h-4 w-4" /> Kthehu
          </motion.button>

          {/* Step heading */}
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="mb-7">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: ACCENT }}>Hapi {step} / {STEPS.length}</span>
              </div>
              <h1 className="font-serif text-2xl font-bold text-white">{STEPS[step - 1].title}</h1>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.38)" }}>
                {step === 1 && "Plotësoni informacionin tuaj personal"}{step === 2 && "Ku ndodheni?"}{step === 3 && "Konfirmoni identitetin tuaj"}
              </p>
            </motion.div>
          </AnimatePresence>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(step < 3 ? onNext : onSubmit)} className="space-y-4">
              <AnimatePresence mode="wait">

                {/* STEP 1 */}
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <DarkLabel>Emri *</DarkLabel>
                        <FormField control={form.control} name="firstName" render={({ field }) => (<><DarkInput placeholder="Agim" {...field} /><FormMessage className="text-red-400 text-xs mt-1" /></>)} />
                      </div>
                      <div>
                        <DarkLabel>Mbiemri *</DarkLabel>
                        <FormField control={form.control} name="lastName" render={({ field }) => (<><DarkInput placeholder="Berisha" {...field} /><FormMessage className="text-red-400 text-xs mt-1" /></>)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <DarkLabel>Data e Lindjes *</DarkLabel>
                        <FormField control={form.control} name="dateOfBirth" render={({ field }) => (<><DarkInput type="date" {...field} /><FormMessage className="text-red-400 text-xs mt-1" /></>)} />
                      </div>
                      <FormField control={form.control} name="gender" render={({ field }) => (
                        <div>
                          <DarkLabel>Gjinia *</DarkLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="dark-select"><SelectValue placeholder="Zgjidhni" /></SelectTrigger>
                            <SelectContent><SelectItem value="male">Mashkull</SelectItem><SelectItem value="female">Femër</SelectItem><SelectItem value="other">Tjetër</SelectItem></SelectContent>
                          </Select>
                          <FormMessage className="text-red-400 text-xs mt-1" />
                        </div>
                      )} />
                    </div>
                    <div>
                      <DarkLabel>Numri Personal (opcional)</DarkLabel>
                      <FormField control={form.control} name="personalNumber" render={({ field }) => (<DarkInput placeholder="A12345678B" {...field} />)} />
                    </div>
                    <div>
                      <DarkLabel>Email *</DarkLabel>
                      <FormField control={form.control} name="email" render={({ field }) => (<><DarkInput type="email" placeholder="emri@shembull.com" {...field} /><FormMessage className="text-red-400 text-xs mt-1" /></>)} />
                    </div>
                    <div>
                      <DarkLabel>Telefon *</DarkLabel>
                      <FormField control={form.control} name="phone" render={({ field }) => (<><DarkInput placeholder="+355 69 123 4567" {...field} /><FormMessage className="text-red-400 text-xs mt-1" /></>)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <DarkLabel>Fjalëkalimi *</DarkLabel>
                        <FormField control={form.control} name="password" render={({ field }) => (<><DarkInput type="password" placeholder="Min. 8 karaktere" {...field} /><FormMessage className="text-red-400 text-xs mt-1" /></>)} />
                      </div>
                      <div>
                        <DarkLabel>Konfirmo Fjalëkalimin *</DarkLabel>
                        <FormField control={form.control} name="confirmPassword" render={({ field }) => (<><DarkInput type="password" placeholder="Përsërit" {...field} /><FormMessage className="text-red-400 text-xs mt-1" /></>)} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="space-y-4">
                    <FormField control={form.control} name="country" render={({ field }) => (
                      <div>
                        <DarkLabel>Shteti *</DarkLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="dark-select"><SelectValue placeholder="Zgjidhni shtetin" /></SelectTrigger>
                          <SelectContent>{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage className="text-red-400 text-xs mt-1" />
                      </div>
                    )} />
                    <div>
                      <DarkLabel>Qyteti *</DarkLabel>
                      <FormField control={form.control} name="city" render={({ field }) => (<><DarkInput placeholder="Tiranë" {...field} /><FormMessage className="text-red-400 text-xs mt-1" /></>)} />
                    </div>
                    <div>
                      <DarkLabel>Adresa *</DarkLabel>
                      <FormField control={form.control} name="address" render={({ field }) => (<><DarkInput placeholder="Rruga Myslym Shyri, Nr. 12, Ap. 3" {...field} /><FormMessage className="text-red-400 text-xs mt-1" /></>)} />
                    </div>
                  </motion.div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="space-y-4">
                    <div className="p-4 rounded-xl text-sm" style={{ background: `${ACCENT_BG}`, border: `1px solid ${ACCENT_BORDER}`, color: "#93c5fd" }}>
                      Kërkohet të ngarkoni një dokument identiteti valid. Ruhet i sigurt dhe shihet vetëm nga administratorët.
                    </div>
                    <FormField control={form.control} name="documentType" render={({ field }) => (
                      <div>
                        <DarkLabel>Lloji i Dokumentit *</DarkLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="dark-select"><SelectValue placeholder="Zgjidhni dokumentin" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="passport">Pasaportë</SelectItem>
                            <SelectItem value="national_id">Kartë Identiteti</SelectItem>
                            <SelectItem value="driver_license">Patentë Shoferi</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400 text-xs mt-1" />
                      </div>
                    )} />
                    <div className="space-y-3">
                      {[
                        { label: "Pjesa e Përparme *", setter: setFrontFile, state: frontFile, key: "front" },
                        { label: "Pjesa e Pasme", setter: setBackFile, state: backFile, key: "back" },
                        { label: "Selfie duke mbajtur dokumentin *", setter: setSelfieFile, state: selfieFile, key: "selfie" },
                      ].map(({ label, setter, state, key }) => (
                        <motion.div key={key} whileHover={{ borderColor: ACCENT }} className="rounded-xl p-4 transition-all"
                          style={{ background: "rgba(255,255,255,0.03)", border: state ? `1px solid ${ACCENT}` : "1px solid rgba(255,255,255,0.08)" }}>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: state ? ACCENT_BG : "rgba(255,255,255,0.05)", border: `1px solid ${state ? ACCENT_BORDER : "rgba(255,255,255,0.08)"}` }}>
                              {state ? <CheckCircle2 className="h-4 w-4" style={{ color: ACCENT }} /> : <Upload className="h-4 w-4" style={{ color: "rgba(255,255,255,0.35)" }} />}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">{label}</p>
                              <p className="text-xs mt-0.5" style={{ color: state ? "#93c5fd" : "rgba(255,255,255,0.3)" }}>{state ? state.name : "Klikoni për të ngarkuar"}</p>
                            </div>
                            <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => setter(e.target.files?.[0] ?? null)} />
                          </label>
                        </motion.div>
                      ))}
                    </div>
                    <FormField control={form.control} name="confirmAccuracy" render={({ field }) => (
                      <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />
                        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                          Konfirmoj që të gjitha informacionet e dhëna janë të sakta dhe autentike.
                        </p>
                        <FormMessage className="text-red-400 text-xs" />
                      </div>
                    )} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex gap-3 pt-3">
                {step > 1 && (
                  <motion.button type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={() => { setStep(s => s - 1); form.reset(formData); }}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                    <ChevronLeft className="h-4 w-4" /> Kthehu
                  </motion.button>
                )}
                <motion.button type="submit" disabled={loading} whileHover={loading ? {} : { scale: 1.015 }} whileTap={loading ? {} : { scale: 0.975 }}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 relative overflow-hidden"
                  style={{ background: loading ? `rgba(59,130,246,0.4)` : `linear-gradient(135deg, #1d4ed8, #3b82f6)`, boxShadow: loading ? "none" : "0 4px 20px rgba(59,130,246,0.35)" }}>
                  {!loading && <motion.div className="absolute inset-0" style={{ background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.1) 50%, transparent 65%)" }} animate={{ x: ["-100%", "200%"] }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear", repeatDelay: 2 }} />}
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Duke regjistruar...</> :
                      step < 3 ? <>Vazhdo <ChevronRight className="h-4 w-4" /></> : "Krijo Llogarinë"}
                  </span>
                </motion.button>
              </div>
            </form>
          </Form>
        </motion.div>
      </div>
    </div>
  );
}
