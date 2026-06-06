import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FileText, Clock, CheckCircle2, MessageSquare, Bell, User, Search, Languages, LayoutDashboard, Settings, LogOut, ChevronRight, Loader2 } from "lucide-react";

const requestSchema = z.object({
  title: z.string().min(3, "Titulli duhet të ketë të paktën 3 karaktere"),
  sourceLanguage: z.string().min(1, "Zgjidhni gjuhën burimore"),
  targetLanguage: z.string().min(1, "Zgjidhni gjuhën e synuar"),
  serviceType: z.string().min(1, "Zgjidhni llojin e shërbimit"),
  description: z.string().optional(),
  deadline: z.string().optional(),
  budget: z.string().optional(),
});

const LANGUAGES = ["Shqip", "Anglisht", "Italisht", "Gjermanisht", "Frëngjisht", "Arabisht", "Turqisht", "Greqisht", "Serbisht"];
const SERVICE_TYPES = [
  { value: "normal", label: "Përkthim Normal" },
  { value: "urgent", label: "Urgjent (24 orë)" },
  { value: "certified", label: "I Çertifikuar" },
  { value: "notarization", label: "Me Noterizim" },
  { value: "legalization", label: "Me Legalizim" },
];

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  assigned: "bg-amber-100 text-amber-700",
  in_progress: "bg-orange-100 text-orange-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};
const statusLabels: Record<string, string> = {
  open: "E hapur", assigned: "Caktuar", in_progress: "Në Progres",
  completed: "Përfunduar", cancelled: "Anuluar",
};

export default function CustomerDashboard() {
  const { user, role, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "requests" | "messages" | "profile">("overview");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [, setLocation] = useLocation();

  const { data: requests = [], isLoading: reqLoading } = useQuery<any[]>({
    queryKey: ["translation-requests"],
    queryFn: async () => {
      const res = await fetch("/api/translation-requests");
      if (!res.ok) throw new Error("Gabim");
      return res.json();
    },
    enabled: !!user,
  });

  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Gabim");
      return res.json();
    },
    enabled: !!user,
  });

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch(`/api/users/${user?.id}/notifications`);
      if (!res.ok) throw new Error("Gabim");
      return res.json();
    },
    enabled: !!user,
  });

  const form = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: { title: "", sourceLanguage: "", targetLanguage: "", serviceType: "", description: "", deadline: "", budget: "" },
  });

  const createRequest = useMutation({
    mutationFn: async (values: z.infer<typeof requestSchema>) => {
      const res = await fetch("/api/translation-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Gabim");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["translation-requests"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Kërkesa u dërgua!", description: "Profesionistët mund t'ju ofrojnë tani." });
    },
    onError: () => toast({ title: "Gabim", description: "Ndodhi një gabim.", variant: "destructive" }),
  });

  const unreadNotifs = notifications.filter((n: any) => !n.isRead).length;
  const activeRequests = requests.filter((r: any) => !["completed", "cancelled"].includes(r.status)).length;
  const completedOrders = orders.filter((o: any) => o.status === "completed").length;

  const navItems = [
    { id: "overview", label: "Pasqyra", icon: LayoutDashboard },
    { id: "requests", label: "Kërkesat", icon: FileText },
    { id: "messages", label: "Mesazhet", icon: MessageSquare },
    { id: "profile", label: "Profili", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r bg-card p-4 pt-8 gap-1">
          <div className="flex items-center gap-3 px-3 py-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold">{user?.email?.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="font-medium text-sm">{user?.user_metadata?.full_name || "Klient"}</p>
              <p className="text-xs text-muted-foreground">Klient</p>
            </div>
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id as any)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === item.id ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <Icon className="h-4 w-4" />
                {item.label}
                {item.id === "messages" && unreadNotifs > 0 && (
                  <span className="ml-auto bg-primary text-white text-xs rounded-full px-1.5 py-0.5">{unreadNotifs}</span>
                )}
              </button>
            );
          })}
          <div className="mt-auto pt-4 border-t">
            <button onClick={signOut} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted w-full">
              <LogOut className="h-4 w-4" /> Dilni
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto p-6 lg:p-8">

            {/* Overview tab */}
            {activeTab === "overview" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="font-serif text-2xl font-bold">Mirë se vini!</h1>
                    <p className="text-muted-foreground text-sm mt-1">Menaxhoni kërkesat dhe porositë tuaja.</p>
                  </div>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2"><Plus className="h-4 w-4" /> Kërkesë e re</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader><DialogTitle>Krijo Kërkesë Përkthimi</DialogTitle></DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(v => createRequest.mutate(v))} className="space-y-4">
                          <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem><FormLabel>Titulli *</FormLabel><FormControl><Input placeholder="Kontratë biznesi — Shqip → Anglisht" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="sourceLanguage" render={({ field }) => (
                              <FormItem><FormLabel>Gjuha Burimore *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="Zgjidhni" /></SelectTrigger></FormControl>
                                  <SelectContent>{LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                                </Select><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="targetLanguage" render={({ field }) => (
                              <FormItem><FormLabel>Gjuha e Synuar *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="Zgjidhni" /></SelectTrigger></FormControl>
                                  <SelectContent>{LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                                </Select><FormMessage /></FormItem>
                            )} />
                          </div>
                          <FormField control={form.control} name="serviceType" render={({ field }) => (
                            <FormItem><FormLabel>Lloji i Shërbimit *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Zgjidhni" /></SelectTrigger></FormControl>
                                <SelectContent>{SERVICE_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                              </Select><FormMessage /></FormItem>
                          )} />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="deadline" render={({ field }) => (
                              <FormItem><FormLabel>Afati</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="budget" render={({ field }) => (
                              <FormItem><FormLabel>Buxheti (ALL)</FormLabel><FormControl><Input placeholder="5000" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                          </div>
                          <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem><FormLabel>Shënim</FormLabel><FormControl><Textarea rows={3} placeholder="Detaje shtesë..." {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <Button type="submit" className="w-full" disabled={createRequest.isPending}>
                            {createRequest.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Dërgo Kërkesën
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "Kërkesa Aktive", value: activeRequests, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Porosi Aktive", value: orders.filter((o: any) => o.status === "in_progress").length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Të Përfunduara", value: completedOrders, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
                    { label: "Njoftime", value: unreadNotifs, icon: Bell, color: "text-primary", bg: "bg-primary/10" },
                  ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                      <div key={i} className="bg-card border rounded-xl p-4">
                        <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                          <Icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Recent requests */}
                <div className="bg-card border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold">Kërkesat e Fundit</h2>
                    <button onClick={() => setActiveTab("requests")} className="text-sm text-primary hover:underline flex items-center gap-1">
                      Të gjitha <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                  {reqLoading ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                  ) : requests.length === 0 ? (
                    <div className="text-center py-8">
                      <Languages className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">Ende nuk keni asnjë kërkesë.</p>
                      <Button size="sm" className="mt-3" onClick={() => setDialogOpen(true)}>Krijoni të parën</Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {requests.slice(0, 5).map((req: any) => (
                        <div key={req.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-xl transition-colors">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{req.title}</p>
                            <p className="text-xs text-muted-foreground">{req.sourceLanguage} → {req.targetLanguage}</p>
                          </div>
                          <Badge className={`${statusColors[req.status]} border-0 text-xs`}>{statusLabels[req.status]}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notifications */}
                {notifications.length > 0 && (
                  <div className="bg-card border rounded-xl p-6 mt-4">
                    <h2 className="font-semibold mb-4">Njoftimet</h2>
                    <div className="space-y-2">
                      {notifications.slice(0, 5).map((n: any) => (
                        <div key={n.id} className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${!n.isRead ? "bg-primary/5 border border-primary/15" : "hover:bg-muted/50"}`}>
                          <Bell className={`h-4 w-4 mt-0.5 flex-shrink-0 ${!n.isRead ? "text-primary" : "text-muted-foreground"}`} />
                          <div>
                            <p className="text-sm font-medium">{n.title}</p>
                            <p className="text-xs text-muted-foreground">{n.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Requests tab */}
            {activeTab === "requests" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between mb-6">
                  <h1 className="font-serif text-2xl font-bold">Kërkesat e Mia</h1>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2"><Plus className="h-4 w-4" /> Kërkesë e re</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader><DialogTitle>Krijo Kërkesë Përkthimi</DialogTitle></DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(v => createRequest.mutate(v))} className="space-y-4">
                          <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem><FormLabel>Titulli *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="sourceLanguage" render={({ field }) => (
                              <FormItem><FormLabel>Gjuha Burimore</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="Zgjidhni" /></SelectTrigger></FormControl>
                                  <SelectContent>{LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                                </Select></FormItem>
                            )} />
                            <FormField control={form.control} name="targetLanguage" render={({ field }) => (
                              <FormItem><FormLabel>Gjuha e Synuar</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="Zgjidhni" /></SelectTrigger></FormControl>
                                  <SelectContent>{LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                                </Select></FormItem>
                            )} />
                          </div>
                          <FormField control={form.control} name="serviceType" render={({ field }) => (
                            <FormItem><FormLabel>Lloji</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Zgjidhni" /></SelectTrigger></FormControl>
                                <SelectContent>{SERVICE_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                              </Select></FormItem>
                          )} />
                          <Button type="submit" className="w-full" disabled={createRequest.isPending}>Dërgo</Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
                {requests.length === 0 ? (
                  <div className="text-center py-16 bg-card border rounded-xl">
                    <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium">Asnjë kërkesë ende</p>
                    <p className="text-muted-foreground text-sm">Krijoni kërkesën tuaj të parë.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requests.map((req: any) => (
                      <div key={req.id} className="bg-card border rounded-xl p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h3 className="font-medium">{req.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{req.sourceLanguage} → {req.targetLanguage} · {SERVICE_TYPES.find(s => s.value === req.serviceType)?.label}</p>
                            {req.deadline && <p className="text-xs text-muted-foreground mt-1">Afati: {new Date(req.deadline).toLocaleDateString("sq-AL")}</p>}
                          </div>
                          <Badge className={`${statusColors[req.status]} border-0`}>{statusLabels[req.status]}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Profile tab */}
            {activeTab === "profile" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="font-serif text-2xl font-bold mb-6">Profili Im</h1>
                <div className="bg-card border rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold text-2xl">{user?.email?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg">{user?.user_metadata?.full_name || "Klient"}</h2>
                      <p className="text-muted-foreground text-sm">{user?.email}</p>
                      <Badge variant="outline" className="mt-1">Klient</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-muted-foreground">Email</p><p className="font-medium">{user?.email}</p></div>
                    <div><p className="text-muted-foreground">Roli</p><p className="font-medium">Klient</p></div>
                    <div><p className="text-muted-foreground">Regjistruar</p><p className="font-medium">{user?.created_at ? new Date(user.created_at).toLocaleDateString("sq-AL") : "—"}</p></div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Messages tab placeholder */}
            {activeTab === "messages" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="font-serif text-2xl font-bold mb-6">Mesazhet</h1>
                <div className="bg-card border rounded-xl p-16 text-center">
                  <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium">Asnjë bisedë ende</p>
                  <p className="text-muted-foreground text-sm">Kontaktoni një professional për të nisur bisedën.</p>
                </div>
              </motion.div>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
