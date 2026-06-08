import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, User, Building2, FileText, ShieldCheck, ChevronRight, ChevronLeft, Upload, CheckCircle2, Languages } from "lucide-react";

const ACCENT = "#f59e0b";
const ACCENT_BG = "rgba(245,158,11,0.1)";
const ACCENT_BORDER = "rgba(245,158,11,0.35)";

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
        background: focused ? "rgba(245,158,11,0.07)" : "rgba(255,255,255,0.04)",
        border: focused ? "1px solid rgba(245,158,11,0.6)" : "1px solid rgba(255,255,255,0.08)",
        boxShadow: focused ? "0 0 0 3px rgba(245,158,11,0.1)" : "none",
      }} />
  );
}

function DarkLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-semibold tracking-wide uppercase mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>{children}</label>;
}

const STEPS = [
  { title: "Informacioni Personal", icon: User },
  { title: "Informacioni i Zyrës", icon: Building2 },
  { title: "Dokumentet Profesionale", icon: FileText },
  { title: "Verifikimi i Identitetit", icon: ShieldCheck },
];
const MUNICIPALITIES = ["Tiranë", "Durrës", "Vlorë", "Shkodër", "Elbasan", "Korçë", "Fier", "Berat", "Lushnjë", "Kavajë", "Gjirokastër", "Pogradec", "Lezhë", "Kukës", "Tropojë", "Peshkopi", "Tjetër"];

export default function RegisterNotary() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({ professionalLicense: null, govCert: null, front: null, back: null, selfie: null, officePhoto1: null });

  const getSchema = () => {
    if (step === 1) return z.object({ firstName: z.string().min(2), lastName: z.string().min(2), email: z.string().email(), phone: z.string().min(6), password: z.string().min(8), confirmPassword: z.string() }).refine(d => d.password === d.confirmPassword, { message: "Fjalëkalimet nuk përputhen", path: ["confirmPassword"] });
    if (step === 2) return z.object({ officeName: z.string().min(2), officeAddress: z.string().min(5), licenseNumber: z.string().min(2), taxNumber: z.string().min(2), municipality: z.string().min(1), workingHours: z.string().min(2), website: z.string().url().optional().or(z.literal("")), iban: z.string().optional(), bio: z.string().optional() });
    if (step === 3) return z.object({});
    return z.object({ documentType: z.string().min(1), confirmAccuracy: z.boolean().refine(v => v) });
  };

  const form = useForm<any>({ resolver: zodResolver(getSchema()), defaultValues: formData });
  const onNext = (values: any) => { setFormData(p => ({ ...p, ...values })); setStep(s => s + 1); form.reset(); };
  const setFile = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => setFiles(prev => ({ ...prev, [key]: e.target.files?.[0] ?? null }));

  const onSubmit = async (values: any) => {
    const allData = { ...formData, ...values };
    setLoading(true);
    try {
      const res = await fetch("/api/notaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fullName: `${allData.firstName} ${allData.lastName}`, businessName: allData.officeName, businessNumber: allData.licenseNumber, officeName: allData.officeName, officeAddress: allData.officeAddress, licenseNumber: allData.licenseNumber, taxNumber: allData.taxNumber, municipality: allData.municipality, workingHours: allData.workingHours, city: allData.municipality, address: allData.officeAddress, phone: allData.phone, email: allData.email, website: allData.website || null, iban: allData.iban || null, bio: allData.bio || null, certificationNumber: allData.licenseNumber }),
      });
      if (res.status === 401) {
        toast({ title: "Duhet të hyni", description: "Ju lutemi hyni me llogari Replit.", variant: "destructive" });
        window.location.href = "/api/login";
        return;
      }
      toast({ title: "Aplikimi u dërgua!", description: "Profili juaj do të rishikohet brenda 48-72 orëve." });
      setLocation("/pending-approval");
    } catch (err: any) { toast({ title: "Gabim", description: err.message ?? "Ndodhi një gabim.", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const progress = (step / STEPS.length) * 100;

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: "#080816" }}>

      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-[38%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a1200 0%, #1f1500 100%)" }}>
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        <FloatingOrb x="10%" y="15%" size={300} delay={0} color="rgba(245,158,11,0.2)" />
        <FloatingOrb x="50%" y="60%" size={220} delay={2} color="rgba(217,119,6,0.12)" />
        <motion.div className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(105deg, transparent 30%, rgba(245,158,11,0.025) 50%, transparent 70%)" }}
          animate={{ x: ["-100%", "200%"] }} transition={{ duration: 9, repeat: Infinity, ease: "linear", repeatDelay: 5 }} />

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: ACCENT_BG, border: `1px solid ${ACCENT_BORDER}` }}>
            <Languages className="h-4 w-4" style={{ color: ACCENT }} />
          </div>
          <span className="font-bold text-white text-sm">DocBridge</span>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="relative z-10 my-auto">
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>Regjistrim Noter</p>
          <h2 className="font-serif text-2xl font-bold text-white mb-8">Regjistro zyrën tënde</h2>
          <div className="relative">
            <div className="absolute left-5 top-5 bottom-5 w-0.5" style={{ background: "rgba(255,255,255,0.08)" }} />
            <motion.div className="absolute left-5 top-5 w-0.5"
              style={{ background: `linear-gradient(to bottom, ${ACCENT}, rgba(245,158,11,0.3))` }}
              animate={{ height: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }} />
            <div className="space-y-0">
              {STEPS.map((s, i) => {
                const Icon = s.icon; const done = step > i + 1; const active = step === i + 1;
                return (
                  <motion.div key={i} className="flex items-center gap-4 py-3.5 relative z-10"
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
                    <motion.div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      animate={active ? { boxShadow: [`0 0 0 0 ${ACCENT}40`, `0 0 0 8px ${ACCENT}00`] } : {}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      style={{ background: done ? "#22c55e" : active ? ACCENT : "rgba(255,255,255,0.07)", border: `2px solid ${done ? "#22c55e" : active ? ACCENT : "rgba(255,255,255,0.12)"}` }}>
                      {done ? <CheckCircle2 className="h-4 w-4 text-white" /> : <Icon className="h-4 w-4 text-white" />}
                    </motion.div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>Hapi {i + 1}</p>
                      <p className={`text-sm font-semibold ${active ? "text-white" : done ? "text-white/70" : "text-white/35"}`}>{s.title}</p>
                    </div>
                    {active && <motion.div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="relative z-10">
          <div className="flex justify-between text-xs mb-2" style={{ color: "rgba(255,255,255,0.35)" }}><span>Progresi</span><span>{Math.round(progress)}%</span></div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
            <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${ACCENT}, #fcd34d)` }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
          </div>
        </motion.div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[62%] flex items-center justify-center p-6 lg:p-12 overflow-y-auto" style={{ background: "#0c0c22" }}>
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${ACCENT_BG} 0%, transparent 70%)`, filter: "blur(60px)" }} />

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-xl relative z-10">
          <motion.button onClick={() => step > 1 ? (setStep(s => s - 1), form.reset(formData)) : setLocation("/register")}
            className="flex items-center gap-1.5 text-sm mb-6 transition-colors" style={{ color: "rgba(255,255,255,0.38)" }}
            whileHover={{ color: "rgba(255,255,255,0.8)", x: -3 }}>
            <ChevronLeft className="h-4 w-4" /> Kthehu
          </motion.button>

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="mb-7">
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: ACCENT }}>Hapi {step} / {STEPS.length}</span>
              <h1 className="font-serif text-2xl font-bold text-white mt-1">{STEPS[step - 1].title}</h1>
            </motion.div>
          </AnimatePresence>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(step < 4 ? onNext : onSubmit)} className="space-y-4">
              <AnimatePresence mode="wait">

                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><DarkLabel>Emri *</DarkLabel><FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormControl><DarkInput placeholder="Agim" {...field} /></FormControl><FormMessage className="text-red-400 text-xs mt-1" /></FormItem>)} /></div>
                      <div><DarkLabel>Mbiemri *</DarkLabel><FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormControl><DarkInput placeholder="Berisha" {...field} /></FormControl><FormMessage className="text-red-400 text-xs mt-1" /></FormItem>)} /></div>
                    </div>
                    <div><DarkLabel>Email *</DarkLabel><FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormControl><DarkInput type="email" placeholder="emri@shembull.com" {...field} /></FormControl><FormMessage className="text-red-400 text-xs mt-1" /></FormItem>)} /></div>
                    <div><DarkLabel>Telefon *</DarkLabel><FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormControl><DarkInput placeholder="+355 69..." {...field} /></FormControl><FormMessage className="text-red-400 text-xs mt-1" /></FormItem>)} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><DarkLabel>Fjalëkalimi *</DarkLabel><FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormControl><DarkInput type="password" placeholder="Min. 8 karaktere" {...field} /></FormControl><FormMessage className="text-red-400 text-xs mt-1" /></FormItem>)} /></div>
                      <div><DarkLabel>Konfirmo *</DarkLabel><FormField control={form.control} name="confirmPassword" render={({ field }) => (<FormItem><FormControl><DarkInput type="password" placeholder="Përsërit" {...field} /></FormControl><FormMessage className="text-red-400 text-xs mt-1" /></FormItem>)} /></div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="space-y-4">
                    <div><DarkLabel>Emri i Zyrës Noteriale *</DarkLabel><FormField control={form.control} name="officeName" render={({ field }) => (<FormItem><FormControl><DarkInput placeholder="Noteri Berisha" {...field} /></FormControl><FormMessage className="text-red-400 text-xs mt-1" /></FormItem>)} /></div>
                    <div><DarkLabel>Adresa e Zyrës *</DarkLabel><FormField control={form.control} name="officeAddress" render={({ field }) => (<FormItem><FormControl><DarkInput placeholder="Rruga, Nr, Qyteti" {...field} /></FormControl><FormMessage className="text-red-400 text-xs mt-1" /></FormItem>)} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><DarkLabel>Numri i Licencës *</DarkLabel><FormField control={form.control} name="licenseNumber" render={({ field }) => (<FormItem><FormControl><DarkInput placeholder="NOT-12345" {...field} /></FormControl><FormMessage className="text-red-400 text-xs mt-1" /></FormItem>)} /></div>
                      <div><DarkLabel>Numri Fiskal *</DarkLabel><FormField control={form.control} name="taxNumber" render={({ field }) => (<FormItem><FormControl><DarkInput {...field} /></FormControl><FormMessage className="text-red-400 text-xs mt-1" /></FormItem>)} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="municipality" render={({ field }) => (<FormItem><DarkLabel>Bashkia *</DarkLabel><FormControl><Select onValueChange={field.onChange} value={field.value}><SelectTrigger className="dark-select"><SelectValue placeholder="Zgjidhni" /></SelectTrigger><SelectContent>{MUNICIPALITIES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></FormControl><FormMessage className="text-red-400 text-xs mt-1" /></FormItem>)} />
                      <div><DarkLabel>Orari i Punës *</DarkLabel><FormField control={form.control} name="workingHours" render={({ field }) => (<FormItem><FormControl><DarkInput placeholder="E Hënë-E Premte 08:00-17:00" {...field} /></FormControl><FormMessage className="text-red-400 text-xs mt-1" /></FormItem>)} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><DarkLabel>IBAN</DarkLabel><FormField control={form.control} name="iban" render={({ field }) => (<DarkInput placeholder="AL47 2121..." {...field} />)} /></div>
                      <div><DarkLabel>Website (opcional)</DarkLabel><FormField control={form.control} name="website" render={({ field }) => (<DarkInput placeholder="https://noteri-berisha.al" {...field} />)} /></div>
                    </div>
                    <div>
                      <DarkLabel>Përshkrim (opcional)</DarkLabel>
                      <FormField control={form.control} name="bio" render={({ field }) => (
                        <textarea rows={3} placeholder="Pak fjalë për zyrën tuaj..." {...field}
                          className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder:text-white/25 outline-none transition-all duration-200 resize-none"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
                      )} />
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="space-y-4">
                    <div className="p-4 rounded-xl text-sm" style={{ background: ACCENT_BG, border: `1px solid ${ACCENT_BORDER}`, color: "#fcd34d" }}>
                      Ngarkoni dokumentet profesionale të zyrës suaj noteriale.
                    </div>
                    {[{ key: "professionalLicense", label: "Licensa Profesionale *" }, { key: "govCert", label: "Çertifikata Qeveritare *" }, { key: "officePhoto1", label: "Foto e Zyrës (opcional)" }].map(({ key, label }) => (
                      <motion.div key={key} whileHover={{ borderColor: ACCENT }} className="rounded-xl p-4 transition-all"
                        style={{ background: "rgba(255,255,255,0.03)", border: files[key] ? `1px solid ${ACCENT}` : "1px solid rgba(255,255,255,0.08)" }}>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: files[key] ? ACCENT_BG : "rgba(255,255,255,0.05)", border: `1px solid ${files[key] ? ACCENT_BORDER : "rgba(255,255,255,0.08)"}` }}>
                            {files[key] ? <CheckCircle2 className="h-4 w-4" style={{ color: ACCENT }} /> : <Upload className="h-4 w-4" style={{ color: "rgba(255,255,255,0.35)" }} />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{label}</p>
                            <p className="text-xs mt-0.5" style={{ color: files[key] ? "#fcd34d" : "rgba(255,255,255,0.3)" }}>{files[key] ? (files[key] as File).name : "PDF, JPG, PNG"}</p>
                          </div>
                          <input type="file" accept=".pdf,image/*" className="hidden" onChange={setFile(key)} />
                        </label>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div key="s4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="space-y-4">
                    <div className="p-4 rounded-xl text-sm" style={{ background: ACCENT_BG, border: `1px solid ${ACCENT_BORDER}`, color: "#fcd34d" }}>
                      Duhet të verifikojmë identitetin tuaj personal.
                    </div>
                    <FormField control={form.control} name="documentType" render={({ field }) => (
                      <FormItem><DarkLabel>Lloji i Dokumentit *</DarkLabel><FormControl><Select onValueChange={field.onChange} value={field.value}><SelectTrigger className="dark-select"><SelectValue placeholder="Zgjidhni" /></SelectTrigger><SelectContent><SelectItem value="passport">Pasaportë</SelectItem><SelectItem value="national_id">Kartë Identiteti</SelectItem></SelectContent></Select></FormControl><FormMessage className="text-red-400 text-xs mt-1" /></FormItem>
                    )} />
                    <div className="space-y-3">
                      {[{ key: "front", label: "Faqja Përpara *" }, { key: "back", label: "Faqja Prapa" }, { key: "selfie", label: "Selfie me Dokument *" }].map(({ key, label }) => (
                        <motion.div key={key} whileHover={{ borderColor: ACCENT }} className="rounded-xl p-4 transition-all"
                          style={{ background: "rgba(255,255,255,0.03)", border: files[key] ? `1px solid ${ACCENT}` : "1px solid rgba(255,255,255,0.08)" }}>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: files[key] ? ACCENT_BG : "rgba(255,255,255,0.05)", border: `1px solid ${files[key] ? ACCENT_BORDER : "rgba(255,255,255,0.08)"}` }}>
                              {files[key] ? <CheckCircle2 className="h-4 w-4" style={{ color: ACCENT }} /> : <Upload className="h-4 w-4" style={{ color: "rgba(255,255,255,0.35)" }} />}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">{label}</p>
                              <p className="text-xs mt-0.5" style={{ color: files[key] ? "#fcd34d" : "rgba(255,255,255,0.3)" }}>{files[key] ? (files[key] as File).name : "Klikoni për të ngarkuar"}</p>
                            </div>
                            <input type="file" accept="image/*" className="hidden" onChange={setFile(key)} />
                          </label>
                        </motion.div>
                      ))}
                    </div>
                    <FormField control={form.control} name="confirmAccuracy" render={({ field }) => (
                      <FormItem className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" /></FormControl>
                        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>Konfirmoj që të gjitha informacionet dhe dokumentet janë autentike dhe të sakta.</p>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )} />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3 pt-3">
                {step > 1 && (
                  <motion.button type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={() => { setStep(s => s - 1); form.reset(formData); }}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                    <ChevronLeft className="h-4 w-4" /> Kthehu
                  </motion.button>
                )}
                <motion.button type="submit" disabled={loading} whileHover={loading ? {} : { scale: 1.015 }} whileTap={loading ? {} : { scale: 0.975 }}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 relative overflow-hidden"
                  style={{ background: loading ? "rgba(245,158,11,0.4)" : "linear-gradient(135deg, #b45309, #f59e0b)", boxShadow: loading ? "none" : "0 4px 20px rgba(245,158,11,0.3)" }}>
                  {!loading && <motion.div className="absolute inset-0" style={{ background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.12) 50%, transparent 65%)" }} animate={{ x: ["-100%", "200%"] }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear", repeatDelay: 2 }} />}
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Duke dërguar...</> : step < 4 ? <>Vazhdo <ChevronRight className="h-4 w-4" /></> : "Dërgo Aplikimin"}
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
