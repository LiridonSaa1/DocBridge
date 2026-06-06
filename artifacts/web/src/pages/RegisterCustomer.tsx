import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, User, MapPin, ShieldCheck, ChevronRight, ChevronLeft, Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
  confirmAccuracy: z.boolean().refine(v => v, "Duhet të konfirmoni saktësinë e informacionit"),
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

  const getSchema = () => {
    if (step === 1) return step1Schema;
    if (step === 2) return step2Schema;
    return step3Schema;
  };

  const form = useForm<any>({
    resolver: zodResolver(getSchema()),
    defaultValues: formData,
  });

  const onNext = (values: any) => {
    setFormData(prev => ({ ...prev, ...values }));
    setStep(s => s + 1);
    form.reset();
  };

  const onSubmit = async (values: any) => {
    const allData = { ...formData, ...values };
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: allData.email,
        password: allData.password,
        options: {
          data: {
            role: "customer",
            full_name: `${allData.firstName} ${allData.lastName}`,
            first_name: allData.firstName,
            last_name: allData.lastName,
          },
        },
      });
      if (authError) {
        toast({ title: "Gabim", description: authError.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      const userId = authData.user?.id;
      if (!userId) { setLoading(false); return; }

      // Create user record via API
      await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({
          id: userId,
          email: allData.email,
          role: "customer",
          firstName: allData.firstName,
          lastName: allData.lastName,
          fullName: `${allData.firstName} ${allData.lastName}`,
          phone: allData.phone,
          personalNumber: allData.personalNumber ?? null,
          dateOfBirth: allData.dateOfBirth,
          gender: allData.gender,
          country: allData.country,
          city: allData.city,
          address: allData.address,
          verificationStatus: "pending_email",
          status: "pending",
        }),
      });

      // Upload identity documents to Supabase Storage
      if (frontFile || selfieFile) {
        const bucket = "identity-documents";
        const uploads: Promise<any>[] = [];
        if (frontFile) uploads.push(supabase.storage.from(bucket).upload(`${userId}/front_${Date.now()}`, frontFile, { upsert: true }));
        if (backFile) uploads.push(supabase.storage.from(bucket).upload(`${userId}/back_${Date.now()}`, backFile, { upsert: true }));
        if (selfieFile) uploads.push(supabase.storage.from(bucket).upload(`${userId}/selfie_${Date.now()}`, selfieFile, { upsert: true }));
        await Promise.allSettled(uploads);
      }

      toast({
        title: "Llogaria u krijua!",
        description: "Ju lutemi verifikoni emailin tuaj para se të vazhdoni.",
      });
      setLocation("/verify-email");
    } catch (err: any) {
      toast({ title: "Gabim", description: err.message ?? "Ndodhi një gabim.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const progress = (step / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-secondary to-secondary/90 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/25 via-transparent to-transparent" />
        <div className="relative text-white max-w-sm w-full">
          <img src="/logo.png" alt="DocBridge" className="h-12 mb-8 brightness-0 invert object-contain" />
          <h2 className="font-serif text-2xl font-bold mb-6">Regjistrohu si Klient</h2>
          <div className="space-y-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = step > i + 1;
              const active = step === i + 1;
              return (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${active ? "bg-white/15" : done ? "opacity-60" : "opacity-30"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-green-400" : active ? "bg-primary" : "bg-white/20"}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-white/60">Hapi {i + 1}</div>
                    <div className="text-sm font-medium text-white">{s.title}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-8">
            <Progress value={progress} className="h-1.5 bg-white/20" />
            <p className="text-white/50 text-xs mt-2">{Math.round(progress)}% i plotësuar</p>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl">
          <div className="mb-6">
            <button onClick={() => setLocation("/register")} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
              <ChevronLeft className="h-4 w-4" /> Kthehu
            </button>
            <h1 className="font-serif text-2xl font-bold">Hapi {step}: {STEPS[step - 1].title}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {step === 1 && "Plotësoni informacionin tuaj personal"}
              {step === 2 && "Ku ndodheni?"}
              {step === 3 && "Konfirmoni identitetin tuaj"}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(step < 3 ? onNext : onSubmit)} className="space-y-4">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="firstName" render={({ field }) => (
                        <FormItem><FormLabel>Emri *</FormLabel><FormControl><Input placeholder="Agim" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="lastName" render={({ field }) => (
                        <FormItem><FormLabel>Mbiemri *</FormLabel><FormControl><Input placeholder="Berisha" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                        <FormItem><FormLabel>Data e Lindjes *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="gender" render={({ field }) => (
                        <FormItem><FormLabel>Gjinia *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Zgjidhni" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="male">Mashkull</SelectItem>
                              <SelectItem value="female">Femër</SelectItem>
                              <SelectItem value="other">Tjetër</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="personalNumber" render={({ field }) => (
                      <FormItem><FormLabel>Numri Personal (opcional)</FormLabel><FormControl><Input placeholder="A12345678B" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel>Email *</FormLabel><FormControl><Input type="email" placeholder="emri@shembull.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem><FormLabel>Telefon *</FormLabel><FormControl><Input placeholder="+355 69 123 4567" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="password" render={({ field }) => (
                        <FormItem><FormLabel>Fjalëkalimi *</FormLabel><FormControl><Input type="password" placeholder="Min. 8 karaktere" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                        <FormItem><FormLabel>Konfirmo Fjalëkalimin *</FormLabel><FormControl><Input type="password" placeholder="Përsërit" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <FormField control={form.control} name="country" render={({ field }) => (
                      <FormItem><FormLabel>Shteti *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Zgjidhni shtetin" /></SelectTrigger></FormControl>
                          <SelectContent>{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem><FormLabel>Qyteti *</FormLabel><FormControl><Input placeholder="Tiranë" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="address" render={({ field }) => (
                      <FormItem><FormLabel>Adresa *</FormLabel><FormControl><Input placeholder="Rruga Myslym Shyri, Nr. 12, Ap. 3" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm text-primary">
                      Kërkohet të ngarkoni një dokument identiteti valid. Dokumentet ruhen në mënyrë të sigurt dhe shihen vetëm nga administratorët e platformës.
                    </div>
                    <FormField control={form.control} name="documentType" render={({ field }) => (
                      <FormItem><FormLabel>Lloji i Dokumentit *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Zgjidhni dokumentin" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="passport">Pasaportë</SelectItem>
                            <SelectItem value="national_id">Kartë Identiteti</SelectItem>
                            <SelectItem value="driver_license">Patentë Shoferi</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { label: "Pjesa e Përparme *", setter: setFrontFile, state: frontFile, key: "front" },
                        { label: "Pjesa e Pasme", setter: setBackFile, state: backFile, key: "back" },
                        { label: "Selfie duke mbajtur dokumentin *", setter: setSelfieFile, state: selfieFile, key: "selfie" },
                      ].map(({ label, setter, state, key }) => (
                        <div key={key} className="border-2 border-dashed border-border rounded-xl p-4 hover:border-primary/50 transition-colors">
                          <label className="flex flex-col items-center gap-2 cursor-pointer">
                            <Upload className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{label}</span>
                            {state && <span className="text-xs text-primary truncate max-w-full">{state.name}</span>}
                            {!state && <span className="text-xs text-muted-foreground">Klikoni për të ngarkuar</span>}
                            <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => setter(e.target.files?.[0] ?? null)} />
                          </label>
                        </div>
                      ))}
                    </div>

                    <FormField control={form.control} name="confirmAccuracy" render={({ field }) => (
                      <FormItem className="flex items-start gap-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div>
                          <FormLabel className="text-sm font-normal leading-snug">
                            Konfirmoj që të gjitha informacionet e dhëna janë të sakta dhe autentike. Jam i vetëdijshëm që informacione false mund të çojnë në pezullim të llogarisë.
                          </FormLabel>
                          <FormMessage />
                        </div>
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
                  {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Duke regjistruar...</> :
                    step < 3 ? <><span>Vazhdo</span><ChevronRight className="h-4 w-4 ml-1" /></> :
                    "Krijo Llogarinë"}
                </Button>
              </div>
            </form>
          </Form>
        </motion.div>
      </div>
    </div>
  );
}
