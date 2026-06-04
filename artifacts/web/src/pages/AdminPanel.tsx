import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  useGetAdminStats, getGetAdminStatsQueryKey,
  useListAds, getListAdsQueryKey,
  useCreateAd, useUpdateAd, useDeleteAd,
  useListPendingApprovals, getListPendingApprovalsQueryKey,
  useApproveUser, useRejectUser,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  FileText, Languages, MonitorPlay,
} from "lucide-react";

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
    defaultValues: {
      title: "", description: "", imageUrl: "", linkUrl: "", businessType: "other", isActive: true,
      ...defaultValues,
    },
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
          <FormItem>
            <FormLabel>Titulli</FormLabel>
            <FormControl><Input placeholder="Titulli i reklamës" data-testid="input-ad-title" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Pershkrimi</FormLabel>
            <FormControl><Input placeholder="Pershkrim i shkurtër" data-testid="input-ad-description" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="imageUrl" render={({ field }) => (
            <FormItem>
              <FormLabel>URL Imazhi (opcional)</FormLabel>
              <FormControl><Input placeholder="https://..." data-testid="input-ad-imageurl" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="linkUrl" render={({ field }) => (
            <FormItem>
              <FormLabel>URL Lidhja</FormLabel>
              <FormControl><Input placeholder="https://..." data-testid="input-ad-linkurl" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="businessType" render={({ field }) => (
            <FormItem>
              <FormLabel>Lloji</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-ad-type">
                    <SelectValue placeholder="Zgjidhni llojin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="notary">Noter</SelectItem>
                  <SelectItem value="translator">Pérkthyes</SelectItem>
                  <SelectItem value="course">Kurs</SelectItem>
                  <SelectItem value="other">Tjetër</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="order" render={({ field }) => (
            <FormItem>
              <FormLabel>Rendi (opcional)</FormLabel>
              <FormControl><Input type="number" placeholder="1" data-testid="input-ad-order" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting} data-testid="button-submit-ad">
          {form.formState.isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Duke ruajtur...</> : (adId ? "Përditëso" : "Krijo Reklamë")}
        </Button>
      </form>
    </Form>
  );
}

// ─── Stats Tab ────────────────────────────────────────────────────────────────
function StatsTab() {
  const { data: stats, isLoading } = useGetAdminStats({ query: { queryKey: getGetAdminStatsQueryKey() } });

  const statCards = stats ? [
    { label: "Përdorues gjithsej", value: stats.totalUsers, icon: Users2, color: "text-blue-600 bg-blue-50" },
    { label: "Noterë të aprovuar", value: stats.totalNotaries, icon: FileText, color: "text-green-600 bg-green-50" },
    { label: "Pérkthyes të aprovuar", value: stats.totalTranslators, icon: Languages, color: "text-purple-600 bg-purple-50" },
    { label: "Kurse aktive", value: stats.totalCourses, icon: BarChart3, color: "text-orange-600 bg-orange-50" },
    { label: "Reklama aktive", value: stats.totalAds, icon: MonitorPlay, color: "text-primary bg-primary/10" },
    { label: "Aprovime në pritje", value: stats.pendingApprovals, icon: Users2, color: "text-yellow-600 bg-yellow-50" },
  ] : [];

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-5">Statistikat e Platformës</h2>
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <motion.div
          initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
        >
          {statCards.map(card => (
            <motion.div
              key={card.label}
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
              className="bg-card border border-border rounded-xl p-5"
            >
              <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold text-foreground">{card.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{card.label}</div>
            </motion.div>
          ))}
        </motion.div>
      )}
      {stats?.recentRegistrations !== undefined && (
        <div className="mt-6 bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">
            Regjistrime të reja javën e fundit:
            <span className="font-bold text-foreground ml-2">{stats.recentRegistrations}</span>
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Ads Tab ──────────────────────────────────────────────────────────────────
function AdsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: ads, isLoading } = useListAds({ query: { queryKey: getListAdsQueryKey() } });
  const deleteAd = useDeleteAd();
  const [editAd, setEditAd] = useState<any>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const handleDelete = async (id: number) => {
    if (!confirm("Jeni i sigurt që dëshironi ta fshini këtë reklamë?")) return;
    await deleteAd.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListAdsQueryKey() });
    toast({ title: "Reklama u fshi." });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-foreground">Menaxhimi i Reklamave</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5" data-testid="button-create-ad">
              <Plus className="h-4 w-4" />Shto Reklamë
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Shto Reklamë të Re</DialogTitle></DialogHeader>
            <AdFormModal onClose={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : ads?.length ? (
        <div className="space-y-3">
          {ads.map(ad => (
            <div key={ad.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4" data-testid={`row-ad-${ad.id}`}>
              {ad.imageUrl ? (
                <img src={ad.imageUrl} alt={ad.title} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Image className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium text-foreground text-sm">{ad.title}</h3>
                  <Badge variant={ad.isActive ? "default" : "secondary"} className="text-xs">
                    {ad.isActive ? "Aktiv" : "Joaktiv"}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">{businessTypeLabels[ad.businessType]}</Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{ad.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Dialog open={editAd?.id === ad.id} onOpenChange={open => !open && setEditAd(null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setEditAd(ad)} data-testid={`button-edit-ad-${ad.id}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Përditëso Reklamën</DialogTitle></DialogHeader>
                    <AdFormModal
                      adId={ad.id}
                      defaultValues={{ title: ad.title, description: ad.description, imageUrl: ad.imageUrl || "", linkUrl: ad.linkUrl, businessType: ad.businessType as any, isActive: ad.isActive, order: ad.order ?? undefined }}
                      onClose={() => setEditAd(null)}
                    />
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(ad.id)}
                  disabled={deleteAd.isPending}
                  data-testid={`button-delete-ad-${ad.id}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <MonitorPlay className="h-12 w-12 mx-auto mb-3 opacity-25" />
          <p>Nuk ka reklama aktualisht. Shto reklamën e parë!</p>
        </div>
      )}
    </div>
  );
}

// ─── Pending Tab ──────────────────────────────────────────────────────────────
function PendingTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: pending, isLoading } = useListPendingApprovals({ query: { queryKey: getListPendingApprovalsQueryKey() } });
  const approveUser = useApproveUser();
  const rejectUser = useRejectUser();

  const handleApprove = async (userId: string) => {
    await approveUser.mutateAsync({ userId });
    queryClient.invalidateQueries({ queryKey: getListPendingApprovalsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
    toast({ title: "Aprovuar me sukses!" });
  };

  const handleReject = async (userId: string) => {
    await rejectUser.mutateAsync({ userId });
    queryClient.invalidateQueries({ queryKey: getListPendingApprovalsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
    toast({ title: "Refuzuar." });
  };

  const totalPending = (pending?.notaries?.length ?? 0) + (pending?.translators?.length ?? 0);

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-lg font-semibold text-foreground">Aprovime në Pritje</h2>
        {totalPending > 0 && (
          <Badge className="bg-primary text-primary-foreground">{totalPending}</Badge>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : totalPending === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-25" />
          <p>Asnjë kërkesë nuk pret aprovim.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(pending?.notaries ?? []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Noterë</p>
              <div className="space-y-2">
                {pending!.notaries.map(n => (
                  <div key={n.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4" data-testid={`pending-notary-${n.id}`}>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-sm">{n.fullName.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{n.fullName}</p>
                      <p className="text-xs text-muted-foreground">{n.businessName} — {n.city}</p>
                      <p className="text-xs text-muted-foreground">NIPT: {n.businessNumber}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" onClick={() => handleApprove(n.userId)} disabled={approveUser.isPending} data-testid={`button-approve-${n.userId}`} className="gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5" />Aprovo
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive gap-1.5" onClick={() => handleReject(n.userId)} disabled={rejectUser.isPending} data-testid={`button-reject-${n.userId}`}>
                        <XCircle className="h-3.5 w-3.5" />Refuzo
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(pending?.translators ?? []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pérkthyes</p>
              <div className="space-y-2">
                {pending!.translators.map(t => (
                  <div key={t.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4" data-testid={`pending-translator-${t.id}`}>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-sm">{t.fullName.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{t.fullName}</p>
                      <p className="text-xs text-muted-foreground">{t.languages.join(", ")} — {t.city}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" onClick={() => handleApprove(t.userId)} disabled={approveUser.isPending} className="gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5" />Aprovo
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive gap-1.5" onClick={() => handleReject(t.userId)} disabled={rejectUser.isPending}>
                        <XCircle className="h-3.5 w-3.5" />Refuzo
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Panel ─────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-br from-secondary to-secondary/90 text-secondary-foreground py-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Badge className="mb-3 bg-primary/20 text-primary border-primary/30">Administrim</Badge>
              <h1 className="text-2xl font-bold">Paneli i Administratorit</h1>
              <p className="text-secondary-foreground/70 text-sm mt-1">Menaxhoni platformen, reklamat dhe aprovimin e profesionistëve</p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="stats">
            <TabsList className="mb-6" data-testid="admin-tabs">
              <TabsTrigger value="stats" className="gap-1.5" data-testid="tab-stats">
                <LayoutDashboard className="h-4 w-4" />Dashboard
              </TabsTrigger>
              <TabsTrigger value="ads" className="gap-1.5" data-testid="tab-ads">
                <MonitorPlay className="h-4 w-4" />Reklama
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-1.5" data-testid="tab-pending">
                <Users2 className="h-4 w-4" />Aprovime
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stats"><StatsTab /></TabsContent>
            <TabsContent value="ads"><AdsTab /></TabsContent>
            <TabsContent value="pending"><PendingTab /></TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
