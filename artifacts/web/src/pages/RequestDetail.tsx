import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  ArrowLeft, FileText, Clock, CheckCircle2, User, Globe,
  Truck, Shield, Languages, Phone, Mail, MapPin, Download,
  AlertCircle, Loader2, Zap, Package,
} from "lucide-react";

const STATUS_STEPS = [
  { key: "open", label: "E hapur", desc: "Kërkesa u regjistrua" },
  { key: "assigned", label: "Caktuar", desc: "Përkthyes i caktuar" },
  { key: "in_progress", label: "Në Progres", desc: "Po përkthehet" },
  { key: "review", label: "Rishikim", desc: "Kontrolli final" },
  { key: "completed", label: "Përfunduar", desc: "Gati për shkarkim" },
];

const STATUS_ORDER = ["open", "assigned", "in_progress", "review", "completed"];

const SERVICE_LABELS: Record<string, string> = {
  standard: "Përkthim Standard",
  certified: "I Çertifikuar",
  legal: "Juridik",
  notarized: "Me Noterizim",
};

const DOC_LABELS: Record<string, string> = {
  personal: "Dokument Personal",
  legal: "Dokument Juridik",
  business: "Dokument Biznesi",
  academic: "Dokument Akademik",
  medical: "Dokument Mjekësor",
  other: "Tjetër",
};

const DELIVERY_LABELS: Record<string, string> = {
  digital: "Digital (Email)",
  physical: "Fizik (Postë)",
  both: "Digital + Fizik",
};

const PRIORITY_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  normal: { label: "Normal", color: "text-slate-600 bg-slate-100", icon: <Clock className="h-3 w-3" /> },
  urgent: { label: "Urgjent", color: "text-amber-700 bg-amber-100", icon: <Zap className="h-3 w-3" /> },
  express: { label: "Express", color: "text-red-700 bg-red-100", icon: <Zap className="h-3 w-3" /> },
};

function StatusTimeline({ status }: { status: string }) {
  const currentIdx = STATUS_ORDER.indexOf(status);
  const isCancelled = status === "cancelled";

  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
        <div>
          <p className="font-medium text-red-700">Kërkesa u anulua</p>
          <p className="text-xs text-red-500">Kontaktoni mbështetjen për më shumë informacion.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-muted" />
      <div
        className="absolute left-4 top-8 w-0.5 bg-primary transition-all duration-700"
        style={{ height: `${(currentIdx / (STATUS_STEPS.length - 1)) * 100}%` }}
      />
      <div className="space-y-0">
        {STATUS_STEPS.map((step, i) => {
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className="flex items-start gap-4 py-3 relative z-10"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                isDone ? "bg-primary border-primary text-white"
                : isCurrent ? "bg-primary border-primary text-white shadow-lg shadow-primary/30"
                : "bg-card border-muted text-muted-foreground"
              }`}>
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : (
                  <span className="text-xs font-bold">{i + 1}</span>
                )}
              </div>
              <div className="pt-1">
                <p className={`text-sm font-semibold ${isCurrent ? "text-foreground" : isDone ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                  {isCurrent && <span className="ml-2 text-xs text-primary font-medium">← Tani</span>}
                </p>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: req, isLoading, error } = useQuery<any>({
    queryKey: ["translation-request", id],
    queryFn: async () => {
      const res = await fetch(`/api/translation-requests/${id}`);
      if (!res.ok) throw new Error("Nuk u gjet");
      return res.json();
    },
    enabled: !!user && !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !req) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center flex-col gap-4">
          <AlertCircle className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Kërkesa nuk u gjet</p>
          <Button variant="outline" onClick={() => setLocation("/dashboard")}>Kthehu</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    open: "bg-blue-100 text-blue-700",
    assigned: "bg-amber-100 text-amber-700",
    in_progress: "bg-orange-100 text-orange-700",
    review: "bg-violet-100 text-violet-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const priority = PRIORITY_LABELS[req.priority || "normal"] || PRIORITY_LABELS.normal;
  const completedFiles: string[] = req.completedFileUrls || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8 lg:py-12">

          {/* Back button */}
          <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")} className="gap-2 mb-6 -ml-2">
            <ArrowLeft className="h-4 w-4" /> Kthehu te paneli
          </Button>

          {/* Page header */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
              <div>
                <h1 className="font-serif text-2xl font-bold mb-1">{req.title}</h1>
                <p className="text-muted-foreground text-sm">
                  Kërkesa #{req.id} · Dorëzuar {new Date(req.createdAt).toLocaleDateString("sq-AL", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`${statusColors[req.status]} border-0 text-sm px-3 py-1`}>
                  {STATUS_STEPS.find(s => s.key === req.status)?.label || req.status}
                </Badge>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${priority.color}`}>
                  {priority.icon} {priority.label}
                </span>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">

              {/* ── Left: status timeline ──────────────────────────────────── */}
              <div className="lg:col-span-1 space-y-5">
                <div className="bg-card border rounded-2xl p-5">
                  <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" /> Statusi i Kërkesës
                  </h2>
                  <StatusTimeline status={req.status} />
                </div>

                {/* Completed files download */}
                {completedFiles.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-green-50 border border-green-200 rounded-2xl p-5"
                  >
                    <h2 className="font-semibold text-sm text-green-800 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Skedarët e Përfunduar
                    </h2>
                    <div className="space-y-2">
                      {completedFiles.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-green-700 hover:text-green-800 font-medium"
                        >
                          <Download className="h-4 w-4" />
                          Shkarko Skedarin {i + 1}
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* ── Right: details ─────────────────────────────────────────── */}
              <div className="lg:col-span-2 space-y-5">

                {/* Translation details */}
                <div className="bg-card border rounded-2xl p-5">
                  <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
                    <Languages className="h-4 w-4 text-primary" /> Detajet e Përkthimit
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow icon={<FileText className="h-4 w-4 text-muted-foreground" />} label="Lloji i Dokumentit" value={DOC_LABELS[req.documentType] || req.documentType} />
                    <InfoRow icon={<Languages className="h-4 w-4 text-muted-foreground" />} label="Gjuha Burimore" value={req.sourceLanguage} />
                    <InfoRow icon={<Languages className="h-4 w-4 text-muted-foreground" />} label="Gjuha e Synuar" value={req.targetLanguage} />
                    <InfoRow icon={<Shield className="h-4 w-4 text-muted-foreground" />} label="Lloji i Shërbimit" value={SERVICE_LABELS[req.serviceType] || req.serviceType} />
                  </div>
                  {req.purpose && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Qëllimi</p>
                      <p className="text-sm">{req.purpose}</p>
                    </div>
                  )}
                </div>

                {/* Contact info */}
                <div className="bg-card border rounded-2xl p-5">
                  <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> Informacioni i Kontaktit
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow icon={<User className="h-4 w-4 text-muted-foreground" />} label="Emri i Plotë" value={req.fullName} />
                    <InfoRow icon={<Phone className="h-4 w-4 text-muted-foreground" />} label="Telefoni" value={req.phone} />
                  </div>
                </div>

                {/* Location & delivery */}
                {(req.country || req.deliveryMethod) && (
                  <div className="bg-card border rounded-2xl p-5">
                    <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
                      <Truck className="h-4 w-4 text-primary" /> Vendndodhja & Dorëzimi
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      <InfoRow icon={<Globe className="h-4 w-4 text-muted-foreground" />} label="Shteti" value={req.country} />
                      <InfoRow icon={<MapPin className="h-4 w-4 text-muted-foreground" />} label="Qyteti" value={req.city} />
                      <InfoRow icon={<Package className="h-4 w-4 text-muted-foreground" />} label="Mënyra e Dorëzimit" value={DELIVERY_LABELS[req.deliveryMethod] || req.deliveryMethod} />
                      {req.deliveryStreet && (
                        <InfoRow icon={<MapPin className="h-4 w-4 text-muted-foreground" />} label="Adresa" value={`${req.deliveryStreet}${req.deliveryPostalCode ? ", " + req.deliveryPostalCode : ""}`} />
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {req.notes && (
                  <div className="bg-card border rounded-2xl p-5">
                    <h2 className="font-semibold text-sm mb-2">Shënime Shtesë</h2>
                    <p className="text-sm text-muted-foreground">{req.notes}</p>
                  </div>
                )}

                {/* Uploaded documents */}
                {req.documentUrls && req.documentUrls.length > 0 && (
                  <div className="bg-card border rounded-2xl p-5">
                    <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" /> Dokumentet e Ngarkuara
                    </h2>
                    <div className="space-y-2">
                      {req.documentUrls.map((url: string, i: number) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <Download className="h-4 w-4" />
                          Dokument {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
