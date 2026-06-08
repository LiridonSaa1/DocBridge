import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  useGetAdminStats, getGetAdminStatsQueryKey,
  useListAds, getListAdsQueryKey,
  useCreateAd, useUpdateAd, useDeleteAd,
} from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  LayoutDashboard, Image, Users2, CheckCircle, XCircle,
  Loader2, Plus, Trash2, Pencil, BarChart3,
  FileText, Languages, ShieldCheck, AlertCircle, MessageSquare,
  Eye, ClipboardList, Activity, ChevronRight, Info, CheckCircle2, Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// ─── Ad Form ─────────────────────────────────────────────────────────────────
const adSchema = z.object({
  title: z.string().min(2, "Titulli duhet të ketë të paktën 2 karaktere"),
  description: z.string().min(5, "Pershkrimi duhet të plotësohet"),
  imageUrl: z.string().url("URL e imazhit i pavlefshëm").or(z.literal("")),
  linkUrl: z.string().url("URL e lidhjes i pavlefshëm"),
  businessType: z.enum(["notary", "translator", "course", "other"]),
  isActive: z.boolean().default(true),
  order: z.coerce.number().optional(),
});
type AdForm = z.infer<typeof adSchema>;

const businessTypeLabels: Record<string, string> = {
  notary: "Noter", translator: "Pérkthyes", course: "Kurs", other: "Tjetër",
};

function AdFormModal({ defaultValues, adId, onClose }: { defaultValues?: Partial<AdForm>; adId?: number; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createAd = useCreateAd();
  const updateAd = useUpdateAd();

  const form = useForm<AdForm>({
    resolver: zodResolver(adSchema),
    defaultValues: { title: "", description: "", imageUrl: "", linkUrl: "", businessType: "other", isActive: true, ...defaultValues },
  });

  const onSubmit = async (values: AdForm) => {
    try {
      if (adId) {
        await updateAd.mutateAsync({ id: adId, data: values });
        toast({ title: "Reklama u përditësua!" });
      } else {
        await createAd.mutateAsync({ data: values });
        toast({ title: "Reklama u krijua!" });
      }
      queryClient.invalidateQueries({ queryKey: getListAdsQueryKey() });
      onClose();
    } catch {
      toast({ title: "Gabim", description: "Ndodhi një gabim.", variant: "destructive" });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Titulli</FormLabel><FormControl><Input placeholder="Titulli i reklamës" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Pershkrimi</FormLabel><FormControl><Input placeholder="Pershkrim i shkurtër" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="imageUrl" render={({ field }) => (
            <FormItem><FormLabel>URL Imazhi</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="linkUrl" render={({ field }) => (
            <FormItem><FormLabel>URL Lidhja</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="businessType" render={({ field }) => (
            <FormItem><FormLabel>Kategoria</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {Object.entries(businessTypeLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="order" render={({ field }) => (
            <FormItem><FormLabel>Rendi</FormLabel><FormControl><Input type="number" placeholder="1" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <Button type="submit" className="w-full" disabled={createAd.isPending || updateAd.isPending}>
          {(createAd.isPending || updateAd.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {adId ? "Përditëso" : "Krijo"}
        </Button>
      </form>
    </Form>
  );
}

// ─── Approval Modal ────────────────────────────────────────────────────────────
function ApprovalModal({ user, type, onClose }: { user: any; type: "notary" | "translator"; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [requestInfoMsg, setRequestInfoMsg] = useState("");
  const [activeSection, setActiveSection] = useState<"approve" | "reject" | "info">("approve");
  const [arbkResult, setArbkResult] = useState<any>(null);
  const [arbkLoading, setArbkLoading] = useState(false);

  const doArbkVerify = async () => {
    setArbkLoading(true);
    setArbkResult(null);
    try {
      const res = await fetch("/api/admin/arbk-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessNumber: user.businessNumber || user.licenseNumber,
          taxNumber: user.taxNumber,
          fullName: user.fullName,
          city: user.city,
        }),
      });
      const data = await res.json();
      setArbkResult(data);
    } catch {
      setArbkResult({ verified: false, status: "error", message: "Gabim gjatë lidhjes me ARBK" });
    } finally {
      setArbkLoading(false);
    }
  };

  const doApprove = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/approve/${user.userId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes }),
      });
      if (!res.ok) throw new Error("Gabim");
    },
    onSuccess: () => {
      toast({ title: "Aprovuar!", description: `${user.fullName} u aprovua me sukses.` });
      queryClient.invalidateQueries({ queryKey: ["admin-pending"] });
      onClose();
    },
    onError: () => toast({ title: "Gabim", variant: "destructive" }),
  });

  const doReject = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/reject/${user.userId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason, adminNotes }),
      });
      if (!res.ok) throw new Error("Gabim");
    },
    onSuccess: () => {
      toast({ title: "Refuzuar", description: `${user.fullName} u refuzua.` });
      queryClient.invalidateQueries({ queryKey: ["admin-pending"] });
      onClose();
    },
    onError: () => toast({ title: "Gabim", variant: "destructive" }),
  });

  const doRequestInfo = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/request-info/${user.userId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: requestInfoMsg }),
      });
      if (!res.ok) throw new Error("Gabim");
    },
    onSuccess: () => {
      toast({ title: "Kërkesë dërguar", description: "Përdoruesi u njoftua." });
      queryClient.invalidateQueries({ queryKey: ["admin-pending"] });
      onClose();
    },
    onError: () => toast({ title: "Gabim", variant: "destructive" }),
  });

  const roleLabel = type === "notary" ? "Noteri" : "Pérkthyesi";

  return (
    <div className="space-y-5">
      {/* Profile info */}
      <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-lg">{user.fullName?.charAt(0)}</span>
          </div>
          <div>
            <p className="font-semibold">{user.fullName}</p>
            <p className="text-muted-foreground">{user.email}</p>
            <Badge variant="outline" className="mt-1 text-xs">{roleLabel}</Badge>
          </div>
        </div>
        {user.phone && <div className="flex justify-between"><span className="text-muted-foreground">Telefon</span><span>{user.phone}</span></div>}
        {user.city && <div className="flex justify-between"><span className="text-muted-foreground">Qyteti</span><span>{user.city}</span></div>}
        {type === "notary" && user.licenseNumber && <div className="flex justify-between"><span className="text-muted-foreground">Licensa</span><span className="font-mono text-xs">{user.licenseNumber}</span></div>}
        {type === "translator" && user.languages?.length > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Gjuhët</span><span>{user.languages.join(", ")}</span></div>}
        {user.bio && <div><span className="text-muted-foreground block">Bio</span><p className="text-xs mt-1">{user.bio}</p></div>}
        <div className="flex justify-between"><span className="text-muted-foreground">Regjistruar</span><span>{new Date(user.createdAt).toLocaleDateString("sq-AL")}</span></div>
      </div>

      {/* ARBK Verification */}
      {type === "notary" && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              Verifikimi ARBK
            </p>
            <Button size="sm" variant="outline" className="text-xs h-7 gap-1.5" onClick={doArbkVerify} disabled={arbkLoading}>
              {arbkLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
              {arbkLoading ? "Duke verifikuar..." : "Verifiko me ARBK"}
            </Button>
          </div>
          {arbkResult && (
            <div className={`rounded-lg p-3 text-xs space-y-1.5 ${arbkResult.verified ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
              <div className={`font-semibold flex items-center gap-1.5 ${arbkResult.verified ? "text-green-700" : "text-red-700"}`}>
                {arbkResult.verified ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                {arbkResult.message}
              </div>
              {arbkResult.verified && (
                <div className="space-y-1 mt-2 text-muted-foreground border-t border-green-100 pt-2">
                  {arbkResult.registrationNumber && <div className="flex justify-between"><span>NIPT:</span><span className="font-mono font-medium">{arbkResult.registrationNumber}</span></div>}
                  {arbkResult.businessType && <div className="flex justify-between"><span>Lloji:</span><span>{arbkResult.businessType}</span></div>}
                  {arbkResult.municipality && <div className="flex justify-between"><span>Komuna:</span><span>{arbkResult.municipality}</span></div>}
                  {arbkResult.taxStatus && <div className="flex justify-between"><span>Statusi:</span><span className="text-green-600 font-medium">{arbkResult.taxStatus}</span></div>}
                  {arbkResult.source && <div className="mt-1 text-[10px] opacity-50">{arbkResult.source}</div>}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Documents */}
      <div>
        <p className="text-sm font-semibold mb-2">Dokumentet</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "identityDocFrontUrl", label: "Kartë ID (para)" },
            { key: "identityDocBackUrl", label: "Kartë ID (prapa)" },
            { key: "selfieUrl", label: "Selfie me Dokument" },
            ...(type === "notary"
              ? [{ key: "professionalLicenseUrl", label: "Licensa Profesionale" }, { key: "govCertUrl", label: "Çertifikata Qeveritare" }]
              : [{ key: "diplomaUrl", label: "Diploma" }, { key: "certificationUrl", label: "Çertifikata" }, { key: "cvUrl", label: "CV" }]
            ),
          ].map(doc => (
            <div key={doc.key} className={`p-2 rounded-lg border text-xs flex items-center justify-between ${user[doc.key] ? "border-green-200 bg-green-50" : "border-border bg-muted/30 opacity-60"}`}>
              <span>{doc.label}</span>
              {user[doc.key]
                ? <a href={`https://your-supabase-url.supabase.co/storage/v1/object/public/${user[doc.key]}`} target="_blank" className="text-primary hover:underline flex items-center gap-1"><Eye className="h-3 w-3" />Shiko</a>
                : <span className="text-muted-foreground">Mungon</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <div className="flex gap-2">
          {(["approve", "reject", "info"] as const).map(action => (
            <button key={action} onClick={() => setActiveSection(action)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-colors ${activeSection === action
                ? action === "approve" ? "bg-green-100 text-green-700 border border-green-200"
                  : action === "reject" ? "bg-red-100 text-red-700 border border-red-200"
                  : "bg-amber-100 text-amber-700 border border-amber-200"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}>
              {action === "approve" ? "Aprovo" : action === "reject" ? "Refuzo" : "Kërko Info"}
            </button>
          ))}
        </div>

        {activeSection === "approve" && (
          <div className="space-y-2">
            <Textarea rows={2} placeholder="Shënime admin (opcional)" value={adminNotes} onChange={e => setAdminNotes(e.target.value)} />
            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => doApprove.mutate()} disabled={doApprove.isPending}>
              {doApprove.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Konfirmo Aprovimin
            </Button>
          </div>
        )}

        {activeSection === "reject" && (
          <div className="space-y-2">
            <Input placeholder="Arsyeja e refuzimit (shfaqet tek përdoruesi)" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} />
            <Textarea rows={2} placeholder="Shënime shtesë" value={adminNotes} onChange={e => setAdminNotes(e.target.value)} />
            <Button variant="destructive" className="w-full" onClick={() => doReject.mutate()} disabled={doReject.isPending}>
              {doReject.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              Konfirmo Refuzimin
            </Button>
          </div>
        )}

        {activeSection === "info" && (
          <div className="space-y-2">
            <Textarea rows={3} placeholder="Çfarë informacioni shtesë kërkohet?" value={requestInfoMsg} onChange={e => setRequestInfoMsg(e.target.value)} />
            <Button variant="outline" className="w-full" onClick={() => doRequestInfo.mutate()} disabled={doRequestInfo.isPending}>
              {doRequestInfo.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Info className="h-4 w-4 mr-2" />}
              Dërgo Kërkesën
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main AdminPanel ──────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { role, loading } = useAuth();
  const queryClient = useQueryClient();
  const [editAd, setEditAd] = useState<{ id: number; data: AdForm } | null>(null);
  const [adDialogOpen, setAdDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ user: any; type: "notary" | "translator" } | null>(null);

  const { data: stats, isLoading: statsLoading } = useGetAdminStats({ query: { queryKey: getGetAdminStatsQueryKey() } });
  const { data: ads, isLoading: adsLoading } = useListAds({ query: { queryKey: getListAdsQueryKey() } });
  const deleteAd = useDeleteAd();

  const { data: pending, isLoading: pendingLoading } = useQuery<{ notaries: any[]; translators: any[] }>({
    queryKey: ["admin-pending"],
    queryFn: async () => {
      const res = await fetch("/api/admin/pending");
      if (!res.ok) throw new Error("Gabim");
      return res.json();
    },
  });

  const { data: allUsers, isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Gabim");
      return res.json();
    },
  });

  const { data: allNotaries } = useQuery<any[]>({
    queryKey: ["admin-notaries"],
    queryFn: async () => {
      const res = await fetch("/api/admin/notaries");
      if (!res.ok) throw new Error("Gabim");
      return res.json();
    },
  });

  const { data: allTranslators } = useQuery<any[]>({
    queryKey: ["admin-translators"],
    queryFn: async () => {
      const res = await fetch("/api/admin/translators");
      if (!res.ok) throw new Error("Gabim");
      return res.json();
    },
  });

  const { data: auditLogs } = useQuery<any[]>({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/audit-logs");
      if (!res.ok) throw new Error("Gabim");
      return res.json();
    },
  });

  const { data: tickets } = useQuery<any[]>({
    queryKey: ["admin-tickets"],
    queryFn: async () => {
      const res = await fetch("/api/admin/support-tickets");
      if (!res.ok) throw new Error("Gabim");
      return res.json();
    },
  });

  const handleDeleteAd = async (id: number) => {
    try {
      await deleteAd.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListAdsQueryKey() });
      toast({ title: "Reklama u fshi!" });
    } catch {
      toast({ title: "Gabim", variant: "destructive" });
    }
  };

  const totalPending = (pending?.notaries?.length ?? 0) + (pending?.translators?.length ?? 0);
  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700", approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700", active: "bg-green-100 text-green-700",
      suspended: "bg-red-100 text-red-700", more_info_requested: "bg-blue-100 text-blue-700",
    };
    const labels: Record<string, string> = {
      pending: "Në Pritje", approved: "Aprovuar", rejected: "Refuzuar",
      active: "Aktiv", suspended: "Pezulluar", more_info_requested: "Info Kërkuar",
    };
    return <Badge className={`${map[status] ?? "bg-muted text-muted-foreground"} border-0 text-xs`}>{labels[status] ?? status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-3xl font-bold">Paneli i Administratorit</h1>
              <p className="text-muted-foreground text-sm mt-1">Menaxhoni platformën DocBridge</p>
            </div>
            {totalPending > 0 && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1.5 px-3 py-1.5">
                <AlertCircle className="h-3.5 w-3.5" />{totalPending} aprovime në pritje
              </Badge>
            )}
          </div>

          {/* Stats row */}
          {statsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : stats && (
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
              {[
                { label: "Përdorues", value: (stats as any).totalUsers ?? 0, icon: Users2, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Noterë", value: (stats as any).totalNotaries ?? 0, icon: FileText, color: "text-primary", bg: "bg-primary/10" },
                { label: "Pérkthyes", value: (stats as any).totalTranslators ?? 0, icon: Languages, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Porosi", value: (stats as any).totalOrders ?? 0, icon: ClipboardList, color: "text-orange-600", bg: "bg-orange-50" },
                { label: "Të Reja (7d)", value: (stats as any).recentRegistrations ?? 0, icon: Activity, color: "text-violet-600", bg: "bg-violet-50" },
                { label: "Aprovime", value: (stats as any).pendingApprovals ?? 0, icon: ShieldCheck, color: "text-amber-600", bg: "bg-amber-50" },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="bg-card border rounded-xl p-4">
                    <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-2`}>
                      <Icon className={`h-4 w-4 ${s.color}`} />
                    </div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Main tabs */}
          <Tabs defaultValue="approvals" className="w-full">
            <TabsList className="mb-6 flex flex-wrap gap-1 h-auto">
              <TabsTrigger value="approvals" className="gap-1.5">
                <ShieldCheck className="h-4 w-4" />Aprovime
                {totalPending > 0 && <span className="ml-1 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">{totalPending}</span>}
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-1.5"><Users2 className="h-4 w-4" />Përdorues</TabsTrigger>
              <TabsTrigger value="professionals" className="gap-1.5"><Languages className="h-4 w-4" />Profesionistë</TabsTrigger>
              <TabsTrigger value="ads" className="gap-1.5"><Image className="h-4 w-4" />Reklamat</TabsTrigger>
              <TabsTrigger value="audit" className="gap-1.5"><Activity className="h-4 w-4" />Audit Log</TabsTrigger>
              <TabsTrigger value="tickets" className="gap-1.5"><MessageSquare className="h-4 w-4" />Tickets</TabsTrigger>
            </TabsList>

            {/* APPROVALS TAB */}
            <TabsContent value="approvals">
              {pendingLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : totalPending === 0 ? (
                <div className="text-center py-16 bg-card border rounded-xl">
                  <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
                  <p className="font-semibold">Asnjë aprovim në pritje</p>
                  <p className="text-muted-foreground text-sm">Të gjitha profilet janë rishikuar.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Notaries */}
                  {(pending?.notaries?.length ?? 0) > 0 && (
                    <div>
                      <h2 className="font-semibold mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Noterë ({pending!.notaries.length})</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pending!.notaries.map(n => (
                          <div key={n.id} className="bg-card border rounded-xl p-5 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-primary font-bold">{n.fullName?.charAt(0)}</span>
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">{n.fullName}</p>
                                  <p className="text-xs text-muted-foreground">{n.email}</p>
                                </div>
                              </div>
                              {statusBadge(n.status)}
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1 mb-4">
                              {n.city && <p>📍 {n.city}{n.municipality ? `, ${n.municipality}` : ""}</p>}
                              {n.phone && <p>📞 {n.phone}</p>}
                              {n.licenseNumber && <p>🪪 Licensa: {n.licenseNumber}</p>}
                            </div>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" className="flex-1 gap-1" onClick={() => setSelectedUser({ user: n, type: "notary" })}>
                                    <Eye className="h-3.5 w-3.5" />Rishiko
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                                  <DialogHeader><DialogTitle>Rishiko Noterin — {n.fullName}</DialogTitle></DialogHeader>
                                  <ApprovalModal user={n} type="notary" onClose={() => setSelectedUser(null)} />
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Translators */}
                  {(pending?.translators?.length ?? 0) > 0 && (
                    <div>
                      <h2 className="font-semibold mb-3 flex items-center gap-2"><Languages className="h-4 w-4 text-emerald-600" />Pérkthyes ({pending!.translators.length})</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pending!.translators.map(t => (
                          <div key={t.id} className="bg-card border rounded-xl p-5 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                  <span className="text-emerald-700 font-bold">{t.fullName?.charAt(0)}</span>
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">{t.fullName}</p>
                                  <p className="text-xs text-muted-foreground">{t.email}</p>
                                </div>
                              </div>
                              {statusBadge(t.status)}
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1 mb-4">
                              {t.city && <p>📍 {t.city}</p>}
                              {t.phone && <p>📞 {t.phone}</p>}
                              {t.languages?.length > 0 && <p>🌐 {t.languages.slice(0, 4).join(", ")}{t.languages.length > 4 ? "..." : ""}</p>}
                              {t.yearsExperience && <p>⏱️ {t.yearsExperience} vjet eksperiencë</p>}
                            </div>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" className="w-full gap-1" onClick={() => setSelectedUser({ user: t, type: "translator" })}>
                                  <Eye className="h-3.5 w-3.5" />Rishiko
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                                <DialogHeader><DialogTitle>Rishiko Pérkthyesin — {t.fullName}</DialogTitle></DialogHeader>
                                <ApprovalModal user={t} type="translator" onClose={() => setSelectedUser(null)} />
                              </DialogContent>
                            </Dialog>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* USERS TAB */}
            <TabsContent value="users">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Të gjithë Pérdoruesit ({allUsers?.length ?? 0})</h2>
              </div>
              {usersLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> :
                <div className="bg-card border rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="text-left p-3 font-medium text-muted-foreground">Pérdoruesi</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Roli</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Statusi</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Regjistruar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(allUsers ?? []).map((u: any) => (
                          <tr key={u.id} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="p-3">
                              <div>
                                <p className="font-medium">{u.fullName || u.email}</p>
                                <p className="text-xs text-muted-foreground">{u.email}</p>
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className="text-xs">{u.role}</Badge>
                            </td>
                            <td className="p-3">{statusBadge(u.status)}</td>
                            <td className="p-3 text-muted-foreground text-xs">{new Date(u.createdAt).toLocaleDateString("sq-AL")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              }
            </TabsContent>

            {/* PROFESSIONALS TAB */}
            <TabsContent value="professionals">
              <Tabs defaultValue="notaries">
                <TabsList className="mb-4">
                  <TabsTrigger value="notaries">Noterë ({allNotaries?.length ?? 0})</TabsTrigger>
                  <TabsTrigger value="translators">Pérkthyes ({allTranslators?.length ?? 0})</TabsTrigger>
                </TabsList>
                <TabsContent value="notaries">
                  <div className="bg-card border rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                          <tr>
                            <th className="text-left p-3 font-medium text-muted-foreground">Noteri</th>
                            <th className="text-left p-3 font-medium text-muted-foreground">Qyteti</th>
                            <th className="text-left p-3 font-medium text-muted-foreground">Licensa</th>
                            <th className="text-left p-3 font-medium text-muted-foreground">Statusi</th>
                            <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(allNotaries ?? []).map((n: any) => (
                            <tr key={n.id} className="border-b hover:bg-muted/30">
                              <td className="p-3"><p className="font-medium">{n.fullName}</p><p className="text-xs text-muted-foreground">{n.email}</p></td>
                              <td className="p-3 text-muted-foreground text-xs">{n.city}</td>
                              <td className="p-3 font-mono text-xs">{n.licenseNumber || "—"}</td>
                              <td className="p-3">{statusBadge(n.status)}</td>
                              <td className="p-3 text-muted-foreground text-xs">{new Date(n.createdAt).toLocaleDateString("sq-AL")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="translators">
                  <div className="bg-card border rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                          <tr>
                            <th className="text-left p-3 font-medium text-muted-foreground">Pérkthyesi</th>
                            <th className="text-left p-3 font-medium text-muted-foreground">Gjuhët</th>
                            <th className="text-left p-3 font-medium text-muted-foreground">Eksperienca</th>
                            <th className="text-left p-3 font-medium text-muted-foreground">Statusi</th>
                            <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(allTranslators ?? []).map((t: any) => (
                            <tr key={t.id} className="border-b hover:bg-muted/30">
                              <td className="p-3"><p className="font-medium">{t.fullName}</p><p className="text-xs text-muted-foreground">{t.email}</p></td>
                              <td className="p-3 text-xs text-muted-foreground">{t.languages?.slice(0, 3).join(", ")}</td>
                              <td className="p-3 text-xs text-muted-foreground">{t.yearsExperience || "—"}</td>
                              <td className="p-3">{statusBadge(t.status)}</td>
                              <td className="p-3 text-muted-foreground text-xs">{new Date(t.createdAt).toLocaleDateString("sq-AL")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* ADS TAB */}
            <TabsContent value="ads">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Reklamat ({ads?.length ?? 0})</h2>
                <Dialog open={adDialogOpen} onOpenChange={setAdDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2" onClick={() => { setEditAd(null); setAdDialogOpen(true); }}>
                      <Plus className="h-4 w-4" />Reklama e re
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>{editAd ? "Edito Reklamën" : "Reklama e re"}</DialogTitle></DialogHeader>
                    <AdFormModal defaultValues={editAd?.data} adId={editAd?.id} onClose={() => { setAdDialogOpen(false); setEditAd(null); }} />
                  </DialogContent>
                </Dialog>
              </div>
              {adsLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div> :
                <div className="space-y-3">
                  {(ads ?? []).map((ad: any) => (
                    <div key={ad.id} className="bg-card border rounded-xl p-4 flex items-center gap-4">
                      {ad.imageUrl && <img src={ad.imageUrl} alt={ad.title} className="w-16 h-12 object-cover rounded-lg flex-shrink-0" onError={e => (e.currentTarget.style.display = "none")} />}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{ad.title}</p>
                          {ad.isActive ? <Badge className="bg-green-100 text-green-700 border-0 text-xs">Aktive</Badge> : <Badge className="bg-muted text-muted-foreground border-0 text-xs">Joaktive</Badge>}
                          <Badge variant="outline" className="text-xs">{businessTypeLabels[ad.businessType] ?? ad.businessType}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{ad.description}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button size="sm" variant="outline" className="gap-1"
                          onClick={() => { setEditAd({ id: ad.id, data: { title: ad.title, description: ad.description, imageUrl: ad.imageUrl || "", linkUrl: ad.linkUrl, businessType: ad.businessType, isActive: ad.isActive, order: ad.order ?? undefined } }); setAdDialogOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteAd(ad.id)} disabled={deleteAd.isPending}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </TabsContent>

            {/* AUDIT LOG TAB */}
            <TabsContent value="audit">
              <h2 className="font-semibold mb-4">Audit Log</h2>
              <div className="bg-card border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="text-left p-3 font-medium text-muted-foreground">Veprimi</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Tipi</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">IP</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(auditLogs ?? []).slice(0, 50).map((log: any) => (
                        <tr key={log.id} className="border-b hover:bg-muted/30">
                          <td className="p-3 font-mono text-xs">{log.action}</td>
                          <td className="p-3 text-xs text-muted-foreground">{log.entityType || "—"}</td>
                          <td className="p-3 font-mono text-xs text-muted-foreground">{log.ipAddress || "—"}</td>
                          <td className="p-3 text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString("sq-AL")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* TICKETS TAB */}
            <TabsContent value="tickets">
              <h2 className="font-semibold mb-4">Support Tickets ({tickets?.length ?? 0})</h2>
              {!tickets || tickets.length === 0 ? (
                <div className="bg-card border rounded-xl p-12 text-center">
                  <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium">Asnjë ticket ende.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.map((t: any) => (
                    <div key={t.id} className="bg-card border rounded-xl p-4 flex items-start gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{t.subject}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t.description?.slice(0, 120)}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">{t.category}</Badge>
                          <Badge variant="outline" className="text-xs">{t.priority}</Badge>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {statusBadge(t.status)}
                        <p className="text-xs text-muted-foreground mt-1">{new Date(t.createdAt).toLocaleDateString("sq-AL")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
