import { useState, useCallback, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { citiesByCountry, countries } from "@/data/citiesByCountry";
import {
  ChevronRight, ChevronLeft, Upload, X, FileText, CheckCircle2,
  Loader2, AlertCircle, Globe, Truck, Zap, Clock, Shield,
  Languages, User, Phone, Mail, MapPin, Package,
} from "lucide-react";

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const step1Schema = z.object({
  fullName: z.string().min(2, "Emri duhet të ketë të paktën 2 karaktere"),
  email: z.string().email("Email i pavlefshëm"),
  phone: z.string().min(6, "Numri i telefonit është i detyrueshëm"),
  documentType: z.string().min(1, "Zgjidhni llojin e dokumentit"),
  sourceLanguage: z.string().min(1, "Zgjidhni gjuhën burimore"),
  targetLanguage: z.string().min(1, "Zgjidhni gjuhën e synuar"),
  purpose: z.string().min(10, "Ju lutem shpjegoni qëllimin (min. 10 karaktere)"),
});

const step3Schema = z.object({
  country: z.string().min(1, "Zgjidhni shtetin"),
  city: z.string().min(1, "Zgjidhni qytetin"),
  deliveryMethod: z.enum(["digital", "physical", "both"], { message: "Zgjidhni mënyrën e dorëzimit" }),
  deliveryStreet: z.string().optional(),
  deliveryPostalCode: z.string().optional(),
});

const step4Schema = z.object({
  serviceType: z.string().min(1, "Zgjidhni llojin e shërbimit"),
  priority: z.enum(["normal", "urgent", "express"]),
  notes: z.string().optional(),
});

// ─── Constants ────────────────────────────────────────────────────────────────

const LANGUAGES = [
  "Shqip", "Anglisht", "Gjermanisht", "Turqisht", "Frëngjisht",
  "Italisht", "Arabisht", "Serbisht", "Greqisht", "Rusisht",
  "Spanjisht", "Kinezisht", "Japonisht", "Tjetër",
];

const DOCUMENT_TYPES = [
  { value: "personal", label: "Dokument Personal" },
  { value: "legal", label: "Dokument Juridik" },
  { value: "business", label: "Dokument Biznesi" },
  { value: "academic", label: "Dokument Akademik" },
  { value: "medical", label: "Dokument Mjekësor" },
  { value: "other", label: "Tjetër" },
];

const SERVICE_TYPES = [
  { value: "standard", label: "Përkthim Standard", price: 5, icon: Languages, desc: "Dokumente të zakonshme" },
  { value: "certified", label: "I Çertifikuar", price: 10, icon: Shield, desc: "Me vulë dhe nënshkrim" },
  { value: "legal", label: "Juridik", price: 15, icon: FileText, desc: "Për gjykata dhe institucione" },
  { value: "notarized", label: "Me Noterizim", price: 20, icon: Package, desc: "Noterizim i plotë" },
];

const PRIORITY_OPTIONS = [
  { value: "normal", label: "Normal", sublabel: "3–5 ditë pune", multiplier: 1, icon: Clock, color: "border-slate-200 bg-slate-50" },
  { value: "urgent", label: "Urgjent", sublabel: "24–48 orë", multiplier: 1.5, icon: Zap, color: "border-amber-200 bg-amber-50" },
  { value: "express", label: "Express", sublabel: "Po ditën", multiplier: 2, icon: Zap, color: "border-red-200 bg-red-50" },
];

const DELIVERY_OPTIONS = [
  { value: "digital", label: "Digital (Email)", icon: Mail, desc: "Dërgojmë me email" },
  { value: "physical", label: "Fizik (Postë)", icon: Truck, desc: "Dërgojmë me postë" },
  { value: "both", label: "Të dyja", icon: Package, desc: "Digital + Fizik" },
];

const STEPS = [
  { id: 1, label: "Informacioni" },
  { id: 2, label: "Dokumentet" },
  { id: 3, label: "Dorëzimi" },
  { id: 4, label: "Shërbimi" },
];

const DRAFT_KEY = "translation_request_draft";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 10;
const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  url?: string;
  error?: string;
  status: "pending" | "uploading" | "done" | "error";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileIcon(type: string) {
  if (type === "application/pdf") return "📄";
  if (type.startsWith("image/")) return "🖼️";
  if (type.includes("word")) return "📝";
  return "📎";
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 right-0 top-4 h-0.5 bg-muted -z-0" />
        <div
          className="absolute left-0 top-4 h-0.5 bg-primary transition-all duration-500 -z-0"
          style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
        />
        {STEPS.map(s => (
          <div key={s.id} className="flex flex-col items-center gap-1.5 z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300 ${
              step > s.id ? "bg-primary border-primary text-white"
              : step === s.id ? "bg-primary border-primary text-white shadow-lg shadow-primary/25"
              : "bg-card border-muted text-muted-foreground"
            }`}>
              {step > s.id ? <CheckCircle2 className="h-4 w-4" /> : s.id}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${step >= s.id ? "text-foreground" : "text-muted-foreground"}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 font-semibold text-sm uppercase tracking-wide text-muted-foreground">
      {icon}
      {title}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  );
}

function PriceCalculator({ serviceType, priority, pageCount }: { serviceType: string; priority: string; pageCount: number }) {
  const service = SERVICE_TYPES.find(s => s.value === serviceType);
  const prio = PRIORITY_OPTIONS.find(p => p.value === priority);
  if (!service || !prio) return null;
  const pages = Math.max(pageCount, 1);
  const base = service.price * pages;
  const total = Math.round(base * prio.multiplier);
  return (
    <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-5 mt-4">
      <p className="text-sm font-semibold text-primary mb-3 flex items-center gap-1.5">
        <span>💰</span> Çmimi i Parashikuar
      </p>
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>{service.label} × {pages} faqe</span>
          <span>€{base}</span>
        </div>
        {prio.multiplier > 1 && (
          <div className="flex justify-between text-amber-600">
            <span>Shtesa urgjence ({Math.round((prio.multiplier - 1) * 100)}%)</span>
            <span>+€{total - base}</span>
          </div>
        )}
        <div className="border-t border-primary/20 pt-2 flex justify-between font-bold text-foreground">
          <span>Total (est.)</span>
          <span className="text-primary text-lg">€{total}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">*Çmim orientues. Çmimi final vendoset nga përkthyesi.</p>
    </div>
  );
}

// ─── Native drag-and-drop file zone ──────────────────────────────────────────

function FileDropZone({ onFiles, disabled }: { onFiles: (files: File[]) => void; disabled?: boolean }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); if (!disabled) setDragging(true); };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files);
    onFiles(files);
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onFiles(files);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
        dragging ? "border-primary bg-primary/5 scale-[1.01]"
        : disabled ? "border-muted bg-muted/30 cursor-not-allowed opacity-60"
        : "border-muted hover:border-primary/50 hover:bg-muted/30"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.docx"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />
      <div className="flex flex-col items-center gap-3">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${dragging ? "bg-primary/15" : "bg-muted"}`}>
          <Upload className={`h-6 w-6 ${dragging ? "text-primary" : "text-muted-foreground"}`} />
        </div>
        {dragging ? (
          <p className="font-medium text-primary">Lëshoni skedarët këtu...</p>
        ) : (
          <>
            <p className="font-medium">Tërhiqni skedarët këtu ose</p>
            <Button type="button" size="sm" variant="outline" onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>
              Zgjidhni nga kompjuteri
            </Button>
            <p className="text-xs text-muted-foreground">PDF, JPG, PNG, DOCX • Max 10MB • Max {MAX_FILES} skedarë</p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function TranslationRequestForm() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pageCount, setPageCount] = useState(1);

  // ── Forms ───────────────────────────────────────────────────────────────────
  const form1 = useForm<z.infer<typeof step1Schema>>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      fullName: user?.user_metadata?.full_name || "",
      email: user?.email || "",
      phone: "",
      documentType: "",
      sourceLanguage: "",
      targetLanguage: "",
      purpose: "",
    },
  });

  const form3 = useForm<z.infer<typeof step3Schema>>({
    resolver: zodResolver(step3Schema),
    defaultValues: { country: "", city: "", deliveryMethod: "digital", deliveryStreet: "", deliveryPostalCode: "" },
  });

  const form4 = useForm<z.infer<typeof step4Schema>>({
    resolver: zodResolver(step4Schema),
    defaultValues: { serviceType: "", priority: "normal", notes: "" },
  });

  const watchCountry = form3.watch("country");
  const watchDelivery = form3.watch("deliveryMethod");
  const watchService = form4.watch("serviceType");
  const watchPriority = form4.watch("priority");

  // ── Draft persistence ───────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const d = JSON.parse(draft);
        if (d.step1) form1.reset({ ...d.step1, email: user?.email || d.step1.email, fullName: user?.user_metadata?.full_name || d.step1.fullName });
        if (d.step3) form3.reset(d.step3);
        if (d.step4) form4.reset(d.step4);
        if (d.pageCount) setPageCount(d.pageCount);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        step1: form1.getValues(),
        step3: form3.getValues(),
        step4: form4.getValues(),
        pageCount,
      }));
    } catch { /* ignore */ }
  }, [step, pageCount]);

  // ── Add files ───────────────────────────────────────────────────────────────
  const addFiles = useCallback((incoming: File[]) => {
    const valid: File[] = [];
    const errors: string[] = [];
    for (const f of incoming) {
      if (!ALLOWED_MIME.includes(f.type)) { errors.push(`"${f.name}" — format i palejueshëm`); continue; }
      if (f.size > MAX_FILE_SIZE) { errors.push(`"${f.name}" — shumë i madh (max 10MB)`); continue; }
      valid.push(f);
    }
    if (errors.length) toast({ title: "Skedarë të refuzuar", description: errors.join("\n"), variant: "destructive" });
    const remaining = MAX_FILES - uploadFiles.length;
    const toAdd = valid.slice(0, remaining);
    const newFiles: UploadFile[] = toAdd.map(f => ({
      file: f, id: Math.random().toString(36).slice(2),
      progress: 0, status: "pending",
    }));
    setUploadFiles(prev => [...prev, ...newFiles]);
  }, [uploadFiles.length]);

  const removeFile = (id: string) => setUploadFiles(prev => prev.filter(f => f.id !== id));

  // ── Upload files via API ──────────────────────────────────────────────
  const uploadToStorage = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const uf of uploadFiles) {
      if (uf.status === "done" && uf.url) { urls.push(uf.url); continue; }
      setUploadFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status: "uploading", progress: 30 } : f));
      try {
        const formData = new FormData();
        formData.append("file", uf.file);
        const res = await fetch("/api/uploads/translation-documents", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        if (!res.ok) {
          setUploadFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status: "error", error: "Gabim në ngarkim", progress: 0 } : f));
          continue;
        }
        const { url } = await res.json();
        setUploadFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status: "done", progress: 100, url } : f));
        urls.push(url);
      } catch {
        setUploadFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status: "error", progress: 0, error: "Gabim në ngarkim" } : f));
      }
    }
    return urls;
  };

  // ── Navigation ──────────────────────────────────────────────────────────────
  const goNext = async () => {
    if (step === 1) { const ok = await form1.trigger(); if (!ok) return; }
    if (step === 2 && uploadFiles.length === 0) {
      toast({ title: "Dokumente të detyrueshme", description: "Ngarkoni të paktën një dokument.", variant: "destructive" });
      return;
    }
    if (step === 3) { const ok = await form3.trigger(); if (!ok) return; }
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => { setStep(s => s - 1); window.scrollTo({ top: 0, behavior: "smooth" }); };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const ok = await form4.trigger();
    if (!ok) return;
    setIsSubmitting(true);
    try {
      const documentUrls = await uploadToStorage();
      const s1 = form1.getValues();
      const s3 = form3.getValues();
      const s4 = form4.getValues();
      const title = `${DOCUMENT_TYPES.find(d => d.value === s1.documentType)?.label || s1.documentType} — ${s1.sourceLanguage} → ${s1.targetLanguage}`;

      const res = await fetch("/api/translation-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          fullName: s1.fullName,
          phone: s1.phone,
          documentType: s1.documentType,
          sourceLanguage: s1.sourceLanguage,
          targetLanguage: s1.targetLanguage,
          purpose: s1.purpose,
          country: s3.country,
          city: s3.city,
          deliveryMethod: s3.deliveryMethod,
          deliveryStreet: s3.deliveryStreet || null,
          deliveryPostalCode: s3.deliveryPostalCode || null,
          serviceType: s4.serviceType,
          priority: s4.priority,
          notes: s4.notes || null,
          documentUrls,
        }),
      });

      if (!res.ok) throw new Error("Server error");
      localStorage.removeItem(DRAFT_KEY);
      setSubmitted(true);
    } catch {
      toast({ title: "Gabim", description: "Ndodhi një gabim gjatë dërgimit. Provoni sërish.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="font-serif text-3xl font-bold mb-3">Kërkesa u dërgua!</h1>
            <p className="text-muted-foreground mb-2">
              Kërkesa juaj e përkthimit u regjistrua me sukses. Një përkthyes do t'ju kontaktojë brenda afatit të zgjedhur.
            </p>
            <p className="text-sm text-muted-foreground mb-8">Mund të ndiqni statusin nga paneli juaj.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setLocation("/dashboard")} className="gap-2">
                <User className="h-4 w-4" /> Shko te Paneli
              </Button>
              <Button variant="outline" onClick={() => {
                setSubmitted(false); setStep(1); setUploadFiles([]);
                form1.reset(); form3.reset(); form4.reset();
              }}>
                Kërkesë e re
              </Button>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-8 lg:py-12">

          {/* Page header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <Languages className="h-4 w-4" />
              Kërkesë Përkthimi
            </div>
            <h1 className="font-serif text-3xl font-bold mb-2">Dorëzoni Dokumentin Tuaj</h1>
            <p className="text-muted-foreground">
              Plotësoni formularin — përkthyesit tanë do t'ju kontaktojnë brenda afatit.
            </p>
          </div>

          <ProgressBar step={step} />

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.22 }}
            >

              {/* ── STEP 1: Basic Info + Translation Details ─────────────────── */}
              {step === 1 && (
                <div className="space-y-6">
                  <SectionTitle icon={<User className="h-4 w-4" />} title="Informacioni Bazë" />
                  <div className="grid gap-4">
                    <Field label="Emri i Plotë *" error={form1.formState.errors.fullName?.message}>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" placeholder="p.sh. Artan Krasniqi" {...form1.register("fullName")} />
                      </div>
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Email *" error={form1.formState.errors.email?.message}>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9 bg-muted/40" readOnly {...form1.register("email")} />
                        </div>
                      </Field>
                      <Field label="Telefoni *" error={form1.formState.errors.phone?.message}>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" placeholder="+383 44 123 456" {...form1.register("phone")} />
                        </div>
                      </Field>
                    </div>
                  </div>

                  <SectionTitle icon={<Languages className="h-4 w-4" />} title="Detajet e Përkthimit" />
                  <div className="grid gap-4">
                    <Field label="Lloji i Dokumentit *" error={form1.formState.errors.documentType?.message}>
                      <Controller control={form1.control} name="documentType" render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue placeholder="Zgjidhni llojin..." /></SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_TYPES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )} />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Gjuha Burimore *" error={form1.formState.errors.sourceLanguage?.message}>
                        <Controller control={form1.control} name="sourceLanguage" render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><SelectValue placeholder="Nga..." /></SelectTrigger>
                            <SelectContent>{LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                          </Select>
                        )} />
                      </Field>
                      <Field label="Gjuha e Synuar *" error={form1.formState.errors.targetLanguage?.message}>
                        <Controller control={form1.control} name="targetLanguage" render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><SelectValue placeholder="Në..." /></SelectTrigger>
                            <SelectContent>{LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                          </Select>
                        )} />
                      </Field>
                    </div>
                    <Field label="Qëllimi i Përkthimit *" error={form1.formState.errors.purpose?.message}>
                      <Textarea
                        rows={3}
                        placeholder="p.sh. Për aplikim vizë, për gjykatë, për kontratë biznesi, për studime..."
                        {...form1.register("purpose")}
                      />
                    </Field>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Document Upload ──────────────────────────────────── */}
              {step === 2 && (
                <div className="space-y-5">
                  <SectionTitle icon={<Upload className="h-4 w-4" />} title="Ngarkoni Dokumentet" />

                  <FileDropZone onFiles={addFiles} disabled={uploadFiles.length >= MAX_FILES} />

                  {uploadFiles.length > 0 && (
                    <div className="space-y-2">
                      {uploadFiles.map(uf => (
                        <motion.div
                          key={uf.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 bg-card border rounded-xl p-3"
                        >
                          <span className="text-2xl flex-shrink-0">{fileIcon(uf.file.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{uf.file.name}</p>
                            <p className="text-xs text-muted-foreground">{formatBytes(uf.file.size)}</p>
                            {uf.status === "uploading" && (
                              <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full w-1/3 animate-pulse" />
                              </div>
                            )}
                            {uf.status === "error" && (
                              <p className="text-xs text-destructive flex items-center gap-1 mt-0.5">
                                <AlertCircle className="h-3 w-3" /> {uf.error}
                              </p>
                            )}
                            {uf.status === "done" && (
                              <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                                <CheckCircle2 className="h-3 w-3" /> Ngarkuar
                              </p>
                            )}
                          </div>
                          <button type="button" onClick={() => removeFile(uf.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                            <X className="h-4 w-4" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {uploadFiles.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center">Ende nuk keni shtuar asnjë dokument.</p>
                  )}

                  {/* Page count */}
                  <div className="bg-muted/30 rounded-xl p-4">
                    <Field label="Sa faqe ka dokumenti? (orientues)">
                      <div className="flex items-center gap-3 mt-1">
                        <Button type="button" size="sm" variant="outline" onClick={() => setPageCount(p => Math.max(1, p - 1))}>−</Button>
                        <span className="w-10 text-center font-semibold">{pageCount}</span>
                        <Button type="button" size="sm" variant="outline" onClick={() => setPageCount(p => p + 1)}>+</Button>
                        <span className="text-sm text-muted-foreground">faqe</span>
                      </div>
                    </Field>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Location + Delivery ──────────────────────────────── */}
              {step === 3 && (
                <div className="space-y-6">
                  <SectionTitle icon={<Globe className="h-4 w-4" />} title="Vendndodhja" />
                  <div className="grid gap-4">
                    <Field label="Shteti *" error={form3.formState.errors.country?.message}>
                      <Controller control={form3.control} name="country" render={({ field }) => (
                        <Select onValueChange={(v) => { field.onChange(v); form3.setValue("city", ""); }} value={field.value}>
                          <SelectTrigger>
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              <SelectValue placeholder="Zgjidhni shtetin..." />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )} />
                    </Field>
                    <Field label="Qyteti *" error={form3.formState.errors.city?.message}>
                      <Controller control={form3.control} name="city" render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} disabled={!watchCountry}>
                          <SelectTrigger>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <SelectValue placeholder={watchCountry ? "Zgjidhni qytetin..." : "Zgjidhni shtetin fillimisht"} />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {(citiesByCountry[watchCountry] || []).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )} />
                    </Field>
                  </div>

                  <SectionTitle icon={<Truck className="h-4 w-4" />} title="Mënyra e Dorëzimit" />
                  <div className="grid gap-3">
                    {DELIVERY_OPTIONS.map(opt => {
                      const Icon = opt.icon;
                      return (
                        <Controller key={opt.value} control={form3.control} name="deliveryMethod" render={({ field }) => (
                          <button type="button" onClick={() => field.onChange(opt.value)}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                              field.value === opt.value ? "border-primary bg-primary/5" : "border-muted hover:border-primary/30"
                            }`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${field.value === opt.value ? "bg-primary text-white" : "bg-muted"}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{opt.label}</p>
                              <p className="text-xs text-muted-foreground">{opt.desc}</p>
                            </div>
                            {field.value === opt.value && <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />}
                          </button>
                        )} />
                      );
                    })}
                    {form3.formState.errors.deliveryMethod && (
                      <p className="text-sm text-destructive">{form3.formState.errors.deliveryMethod.message}</p>
                    )}
                  </div>

                  <AnimatePresence>
                    {(watchDelivery === "physical" || watchDelivery === "both") && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 overflow-hidden"
                      >
                        <SectionTitle icon={<MapPin className="h-4 w-4" />} title="Adresa e Dorëzimit" />
                        <Field label="Rruga / Adresa">
                          <Input placeholder="p.sh. Rr. Nëna Terezë, Nr. 12" {...form3.register("deliveryStreet")} />
                        </Field>
                        <div className="grid grid-cols-2 gap-4">
                          <Field label="Kodi Postar">
                            <Input placeholder="10000" {...form3.register("deliveryPostalCode")} />
                          </Field>
                          <Field label="Qyteti">
                            <Input value={form3.watch("city")} readOnly className="bg-muted/40" />
                          </Field>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* ── STEP 4: Service + Priority + Notes + Price ──────────────── */}
              {step === 4 && (
                <div className="space-y-6">
                  <SectionTitle icon={<Shield className="h-4 w-4" />} title="Lloji i Shërbimit" />
                  <div className="grid gap-3">
                    {SERVICE_TYPES.map(st => {
                      const Icon = st.icon;
                      return (
                        <Controller key={st.value} control={form4.control} name="serviceType" render={({ field }) => (
                          <button type="button" onClick={() => field.onChange(st.value)}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                              field.value === st.value ? "border-primary bg-primary/5" : "border-muted hover:border-primary/30"
                            }`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${field.value === st.value ? "bg-primary text-white" : "bg-muted"}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{st.label}</p>
                              <p className="text-xs text-muted-foreground">{st.desc}</p>
                            </div>
                            <span className="text-sm font-semibold text-muted-foreground">€{st.price}/fq</span>
                            {field.value === st.value && <CheckCircle2 className="h-5 w-5 text-primary" />}
                          </button>
                        )} />
                      );
                    })}
                    {form4.formState.errors.serviceType && (
                      <p className="text-sm text-destructive">{form4.formState.errors.serviceType.message}</p>
                    )}
                  </div>

                  <SectionTitle icon={<Clock className="h-4 w-4" />} title="Prioriteti" />
                  <div className="grid grid-cols-3 gap-3">
                    {PRIORITY_OPTIONS.map(p => {
                      const Icon = p.icon;
                      return (
                        <Controller key={p.value} control={form4.control} name="priority" render={({ field }) => (
                          <button type="button" onClick={() => field.onChange(p.value)}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all ${
                              field.value === p.value ? "border-primary bg-primary/5" : `${p.color} border-transparent hover:border-primary/30`
                            }`}>
                            <Icon className={`h-5 w-5 ${field.value === p.value ? "text-primary" : "text-muted-foreground"}`} />
                            <p className="font-semibold text-sm">{p.label}</p>
                            <p className="text-xs text-muted-foreground">{p.sublabel}</p>
                            {p.multiplier > 1 && (
                              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                +{Math.round((p.multiplier - 1) * 100)}%
                              </span>
                            )}
                          </button>
                        )} />
                      );
                    })}
                  </div>

                  {watchService && (
                    <PriceCalculator serviceType={watchService} priority={watchPriority} pageCount={pageCount} />
                  )}

                  <Field label="Udhëzime shtesë për përkthyesin">
                    <Textarea rows={3}
                      placeholder="p.sh. Mos e përktheni kreun 3, ruani termat ligjorë në origjinal..."
                      {...form4.register("notes")} />
                  </Field>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button variant="outline" onClick={step === 1 ? () => setLocation("/dashboard") : goBack} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              {step === 1 ? "Kthehu" : "Prapa"}
            </Button>
            {step < 4 ? (
              <Button onClick={goNext} className="gap-2">
                Vazhdo <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2 min-w-[160px]">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {isSubmitting ? "Po dërgon..." : "Dërgo Kërkesën"}
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Drafti ruhet automatikisht — mund të ktheheni më vonë.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
