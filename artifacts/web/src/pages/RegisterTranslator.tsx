import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, User, Languages, FileText, ShieldCheck, ChevronRight, ChevronLeft, Upload, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const STEPS = [
  { title: "Informacioni Personal", icon: User },
  { title: "Gjuhët & Eksperienca", icon: Languages },
  { title: "Dokumentet Profesionale", icon: FileText },
  { title: "Verifikimi i Identitetit", icon: ShieldCheck },
];

const LANGUAGES = ["Anglisht", "Italisht", "Gjermanisht", "Frëngjisht", "Spanjisht", "Arabisht", "Turqisht", "Rusisht", "Kinezisht", "Japonisht", "Portugalisht", "Holandisht", "Polonisht", "Suedisht", "Greqisht", "Serbisht", "Kroatisht", "Bullgarisht", "Rumunisht"];
const COUNTRIES = ["Shqipëri", "Kosovë", "Maqedoni e Veriut", "Mal i Zi", "Serbi", "Greqi", "Itali", "Gjermani", "Mbretëria e Bashkuar", "SHBA", "Tjetër"];

export default function RegisterTranslator() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [files, setFiles] = useState<Record<string, File | null>>({ diploma: null, certification: null, license: null, cv: null, front: null, back: null, selfie: null });

  const getSchema = () => {
    if (step === 1) return z.object({
      firstName: z.string().min(2), lastName: z.string().min(2),
      email: z.string().email(), phone: z.string().min(6),
      country: z.string().min(1), city: z.string().min(2),
      password: z.string().min(8), confirmPassword: z.string(),
    }).refine(d => d.password === d.confirmPassword, { message: "Fjalëkalimet nuk përputhen", path: ["confirmPassword"] });
    if (step === 2) return z.object({
      yearsExperience: z.string().min(1),
      education: z.string().min(2),
      pricePerPage: z.string().optional(),
      pricePerWord: z.string().optional(),
      averageDeliveryTime: z.string().optional(),
      availability: z.string().min(1),
      taxNumber: z.string().optional(),
      iban: z.string().optional(),
      bio: z.string().optional(),
    });
    if (step === 3) return z.object({ portfolioUrl: z.string().url().optional().or(z.literal("")) });
    return z.object({ documentType: z.string().min(1), confirmAccuracy: z.boolean().refine(v => v) });
  };

  const form = useForm<any>({ resolver: zodResolver(getSchema()), defaultValues: formData });

  const onNext = (values: any) => {
    setFormData(prev => ({ ...prev, ...values }));
    setStep(s => s + 1);
    form.reset();
  };

  const onSubmit = async (values: any) => {
    if (selectedLanguages.length === 0) { toast({ title: "Gabim", description: "Zgjidhni të paktën një gjuhë.", variant: "destructive" }); return; }
    const allData = { ...formData, ...values };
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: allData.email,
        password: allData.password,
        options: { data: { role: "translator", full_name: `${allData.firstName} ${allData.lastName}` } },
      });
      if (authError) { toast({ title: "Gabim", description: authError.message, variant: "destructive" }); setLoading(false); return; }
      const userId = authData.user?.id;
      if (!userId) { setLoading(false); return; }

      // Upload documents
      const bucket = "professional-documents";
      const uploadedUrls: Record<string, string> = {};
      for (const [key, file] of Object.entries(files)) {
        if (file) {
          const path = `${userId}/${key}_${Date.now()}`;
          const { data } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
          if (data) uploadedUrls[key] = data.path;
        }
      }

      // Create translator profile via API
      await fetch("/api/translators", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({
          fullName: `${allData.firstName} ${allData.lastName}`,
          languages: selectedLanguages,
          city: allData.city,
          phone: allData.phone,
          email: allData.email,
          yearsExperience: allData.yearsExperience,
          education: allData.education,
          pricePerPage: allData.pricePerPage || null,
          pricePerWord: allData.pricePerWord || null,
          averageDeliveryTime: allData.averageDeliveryTime || null,
          availability: allData.availability,
          taxNumber: allData.taxNumber || null,
          iban: allData.iban || null,
          bio: allData.bio || null,
          portfolioUrl: allData.portfolioUrl || null,
          diplomaUrl: uploadedUrls.diploma || null,
          certificationUrl: uploadedUrls.certification || null,
          licenseUrl: uploadedUrls.license || null,
          cvUrl: uploadedUrls.cv || null,
          identityDocFrontUrl: uploadedUrls.front || null,
          identityDocBackUrl: uploadedUrls.back || null,
          selfieUrl: uploadedUrls.selfie || null,
        }),
      });

      toast({ title: "Aplikimi u dërgua!", description: "Profili juaj do të rishikohet nga administratori. Do të njoftoheni me email." });
      setLocation("/verify-email");
    } catch (err: any) {
      toast({ title: "Gabim", description: err.message ?? "Ndodhi një gabim.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const toggleLang = (lang: string) => setSelectedLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]);
  const setFile = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => setFiles(prev => ({ ...prev, [key]: e.target.files?.[0] ?? null }));
  const progress = (step / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-secondary to-secondary/90 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/25 via-transparent to-transparent" />
        <div className="relative text-white max-w-sm w-full">
          <img src="/logo.png" alt="DocBridge" className="h-12 mb-8 brightness-0 invert object-contain" />
          <h2 className="font-serif text-2xl font-bold mb-6">Regjistrohu si Përkthyes</h2>
          <div className="space-y-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = step > i + 1;
              const active = step === i + 1;
              return (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${active ? "bg-white/15" : done ? "opacity-60" : "opacity-25"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-green-400" : active ? "bg-primary" : "bg-white/20"}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white">{s.title}</span>
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="mt-6 h-1.5 bg-white/20" />
        </div>
      </div>

      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl">
          <div className="mb-6">
            <button onClick={() => step > 1 ? (setStep(s => s - 1), form.reset(formData)) : setLocation("/register")} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
              <ChevronLeft className="h-4 w-4" /> Kthehu
            </button>
            <h1 className="font-serif text-2xl font-bold">Hapi {step}: {STEPS[step - 1].title}</h1>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(step < 4 ? onNext : onSubmit)} className="space-y-4">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>Emri *</FormLabel><FormControl><Input placeholder="Agim" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Mbiemri *</FormLabel><FormControl><Input placeholder="Berisha" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email *</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Telefon *</FormLabel><FormControl><Input placeholder="+355 69..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="country" render={({ field }) => (
                        <FormItem><FormLabel>Shteti *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Zgjidhni" /></SelectTrigger></FormControl>
                            <SelectContent>{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                          </Select><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>Qyteti *</FormLabel><FormControl><Input placeholder="Tiranë" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>Fjalëkalimi *</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="confirmPassword" render={({ field }) => (<FormItem><FormLabel>Konfirmo *</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div>
                      <FormLabel>Gjuhët e Punës *</FormLabel>
                      <div className="flex flex-wrap gap-2 mt-2 mb-1">
                        {selectedLanguages.map(l => (
                          <Badge key={l} className="gap-1">{l}<button type="button" onClick={() => toggleLang(l)}><X className="h-3 w-3" /></button></Badge>
                        ))}
                      </div>
                      <div className="border rounded-xl p-3 max-h-40 overflow-y-auto grid grid-cols-3 gap-1">
                        {LANGUAGES.map(l => (
                          <button key={l} type="button" onClick={() => toggleLang(l)} className={`text-xs p-1.5 rounded-lg text-left transition-colors ${selectedLanguages.includes(l) ? "bg-primary text-white" : "hover:bg-muted"}`}>{l}</button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="yearsExperience" render={({ field }) => (
                        <FormItem><FormLabel>Vite Eksperience *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Zgjidhni" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {["0-1", "1-3", "3-5", "5-10", "10+"].map(v => <SelectItem key={v} value={v}>{v} vjet</SelectItem>)}
                            </SelectContent>
                          </Select><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="availability" render={({ field }) => (
                        <FormItem><FormLabel>Disponueshmëria *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Zgjidhni" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="full_time">Kohë e plotë</SelectItem>
                              <SelectItem value="part_time">Kohë e pjesshme</SelectItem>
                              <SelectItem value="weekends">Fundjavë</SelectItem>
                            </SelectContent>
                          </Select><FormMessage /></FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="education" render={({ field }) => (<FormItem><FormLabel>Arsimimi *</FormLabel><FormControl><Input placeholder="Universiteti i Tiranës, Filologji" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="grid grid-cols-3 gap-3">
                      <FormField control={form.control} name="pricePerPage" render={({ field }) => (<FormItem><FormLabel>Çmimi/Faqe</FormLabel><FormControl><Input placeholder="500 ALL" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="pricePerWord" render={({ field }) => (<FormItem><FormLabel>Çmimi/Fjalë</FormLabel><FormControl><Input placeholder="5 ALL" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="averageDeliveryTime" render={({ field }) => (<FormItem><FormLabel>Koha Mesatare</FormLabel><FormControl><Input placeholder="24 orë" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="iban" render={({ field }) => (<FormItem><FormLabel>IBAN</FormLabel><FormControl><Input placeholder="AL47 2121..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="taxNumber" render={({ field }) => (<FormItem><FormLabel>Numri Fiskal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <FormField control={form.control} name="bio" render={({ field }) => (<FormItem><FormLabel>Bio (opcional)</FormLabel><FormControl><Textarea rows={3} placeholder="Pak fjalë për veten tuaj..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                      Ngarkoni dokumentet tuaja profesionale. Të gjitha janë private dhe shihen vetëm nga administratori.
                    </div>
                    {[
                      { key: "diploma", label: "Diploma e Arsimit *" },
                      { key: "certification", label: "Certifikata e Përkthyesit" },
                      { key: "license", label: "Licensa Qeveritare (opcional)" },
                      { key: "cv", label: "CV / Curriculum Vitae" },
                    ].map(({ key, label }) => (
                      <div key={key} className="border-2 border-dashed border-border rounded-xl p-3 hover:border-primary/50 transition-colors">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <Upload className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-sm font-medium">{label}</span>
                            {files[key] && <p className="text-xs text-primary">{files[key]!.name}</p>}
                            {!files[key] && <p className="text-xs text-muted-foreground">PDF, JPG, PNG — maks. 10MB</p>}
                          </div>
                          <input type="file" accept=".pdf,image/*" className="hidden" onChange={setFile(key)} />
                        </label>
                      </div>
                    ))}
                    <FormField control={form.control} name="portfolioUrl" render={({ field }) => (<FormItem><FormLabel>Portfolio URL (opcional)</FormLabel><FormControl><Input placeholder="https://portfolio.im" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm text-primary">
                      Identiteti juaj personal duhet të verifikohet para aprovimit të profilit.
                    </div>
                    <FormField control={form.control} name="documentType" render={({ field }) => (
                      <FormItem><FormLabel>Lloji i Dokumentit *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Zgjidhni" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="passport">Pasaportë</SelectItem>
                            <SelectItem value="national_id">Kartë Identiteti</SelectItem>
                          </SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                    {[
                      { key: "front", label: "Faqja Përpara *" },
                      { key: "back", label: "Faqja Prapa" },
                      { key: "selfie", label: "Selfie me Dokument *" },
                    ].map(({ key, label }) => (
                      <div key={key} className="border-2 border-dashed border-border rounded-xl p-3 hover:border-primary/50 transition-colors">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <Upload className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-sm font-medium">{label}</span>
                            {files[key] && <p className="text-xs text-primary">{files[key]!.name}</p>}
                            {!files[key] && <p className="text-xs text-muted-foreground">Klikoni për të ngarkuar</p>}
                          </div>
                          <input type="file" accept="image/*" className="hidden" onChange={setFile(key)} />
                        </label>
                      </div>
                    ))}
                    <FormField control={form.control} name="confirmAccuracy" render={({ field }) => (
                      <FormItem className="flex items-start gap-3 space-y-0">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="font-normal text-sm leading-snug">Konfirmoj që të gjitha informacionet janë të sakta dhe dokumentet autentike.</FormLabel>
                      </FormItem>
                    )} />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3 pt-2">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={() => { setStep(s => s - 1); form.reset(formData); }} className="flex-1">
                    <ChevronLeft className="h-4 w-4 mr-1" /> Kthehu
                  </Button>
                )}
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Duke dërguar...</> :
                    step < 4 ? <><span>Vazhdo</span><ChevronRight className="h-4 w-4 ml-1" /></> : "Dërgo Aplikimin"}
                </Button>
              </div>
            </form>
          </Form>
        </motion.div>
      </div>
    </div>
  );
}
