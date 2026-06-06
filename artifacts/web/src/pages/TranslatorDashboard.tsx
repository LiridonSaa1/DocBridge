import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, CheckCircle2, Clock, DollarSign, MessageSquare, User, LayoutDashboard, LogOut, Bell, ChevronRight, Loader2, Languages, AlertCircle } from "lucide-react";

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-700", assigned: "bg-amber-100 text-amber-700",
  in_progress: "bg-orange-100 text-orange-700", completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};
const statusLabels: Record<string, string> = {
  open: "E hapur", assigned: "Caktuar", in_progress: "Në Progres", completed: "Përfunduar", cancelled: "Anuluar",
};

export default function TranslatorDashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "jobs" | "my-orders" | "messages" | "profile">("overview");

  const { data: openJobs = [], isLoading: jobsLoading } = useQuery<any[]>({
    queryKey: ["open-jobs"],
    queryFn: async () => {
      const res = await fetch("/api/translation-requests/open");
      if (!res.ok) throw new Error("Gabim");
      return res.json();
    },
    enabled: !!user,
  });

  const { data: myOrders = [] } = useQuery<any[]>({
    queryKey: ["my-orders"],
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
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  const acceptJob = useMutation({
    mutationFn: async ({ requestId, customerId }: { requestId: number; customerId: string }) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: String(requestId), customerId, providerType: "translator" }),
      });
      if (!res.ok) throw new Error("Gabim");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["open-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      toast({ title: "Punën e pranuat!", description: "Klienti është njoftuar." });
    },
    onError: () => toast({ title: "Gabim", description: "Nuk mund të pranohej puna.", variant: "destructive" }),
  });

  const unreadNotifs = notifications.filter((n: any) => !n.isRead).length;
  const activeOrders = myOrders.filter((o: any) => ["pending", "accepted", "in_progress"].includes(o.status));
  const completedOrders = myOrders.filter((o: any) => o.status === "completed");

  const navItems = [
    { id: "overview", label: "Pasqyra", icon: LayoutDashboard },
    { id: "jobs", label: "Punët e Lira", icon: Briefcase },
    { id: "my-orders", label: "Porositë e Mia", icon: CheckCircle2 },
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
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-emerald-700 font-bold">{user?.email?.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="font-medium text-sm">{user?.user_metadata?.full_name || "Përkthyes"}</p>
              <p className="text-xs text-muted-foreground">Pérkthyes</p>
            </div>
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id as any)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === item.id ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <Icon className="h-4 w-4" />{item.label}
                {item.id === "messages" && unreadNotifs > 0 && (
                  <span className="ml-auto bg-primary text-white text-xs rounded-full px-1.5 py-0.5">{unreadNotifs}</span>
                )}
              </button>
            );
          })}
          <div className="mt-auto pt-4 border-t">
            <button onClick={signOut} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted w-full">
              <LogOut className="h-4 w-4" /> Dilni
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto p-6 lg:p-8">

            {activeTab === "overview" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="mb-8">
                  <h1 className="font-serif text-2xl font-bold">Paneli i Pérkthyesit</h1>
                  <p className="text-muted-foreground text-sm mt-1">Menaxhoni punët dhe porositë tuaja.</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "Punë të Lira", value: openJobs.length, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Aktive", value: activeOrders.length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Përfunduar", value: completedOrders.length, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
                    { label: "Njoftime", value: unreadNotifs, icon: Bell, color: "text-primary", bg: "bg-primary/10" },
                  ].map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <div key={i} className="bg-card border rounded-xl p-4">
                        <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                          <Icon className={`h-5 w-5 ${s.color}`} />
                        </div>
                        <p className="text-2xl font-bold">{s.value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Open jobs preview */}
                <div className="bg-card border rounded-xl p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold">Punët e Lira</h2>
                    <button onClick={() => setActiveTab("jobs")} className="text-sm text-primary hover:underline flex items-center gap-1">
                      Të gjitha <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                  {jobsLoading ? <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div> :
                    openJobs.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground"><Languages className="h-8 w-8 mx-auto mb-2" /><p className="text-sm">Asnjë punë e re.</p></div>
                    ) : openJobs.slice(0, 3).map((job: any) => (
                      <div key={job.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-xl transition-colors mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{job.title}</p>
                          <p className="text-xs text-muted-foreground">{job.sourceLanguage} → {job.targetLanguage} · {job.serviceType}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => acceptJob.mutate({ requestId: job.id, customerId: job.customerId })} disabled={acceptJob.isPending}>
                          Prano
                        </Button>
                      </div>
                    ))
                  }
                </div>

                {/* My active orders */}
                {activeOrders.length > 0 && (
                  <div className="bg-card border rounded-xl p-6">
                    <h2 className="font-semibold mb-4">Porositë Aktive</h2>
                    <div className="space-y-2">
                      {activeOrders.map((order: any) => (
                        <div key={order.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-xl">
                          <div className="flex-1">
                            <p className="text-sm font-medium">Porosi #{order.id}</p>
                            <p className="text-xs text-muted-foreground">{order.price ? `${order.price} ${order.currency}` : "Çmim pa caktuar"}</p>
                          </div>
                          <Badge className={`${statusColors[order.status]} border-0`}>{statusLabels[order.status]}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "jobs" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="font-serif text-2xl font-bold mb-6">Punët e Lira</h1>
                {jobsLoading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div> :
                  openJobs.length === 0 ? (
                    <div className="bg-card border rounded-xl p-16 text-center">
                      <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="font-medium">Asnjë punë e lirë tani.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {openJobs.map((job: any) => (
                        <div key={job.id} className="bg-card border rounded-xl p-5 hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h3 className="font-semibold">{job.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{job.sourceLanguage} → {job.targetLanguage}</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">{job.serviceType}</Badge>
                                {job.budget && <Badge variant="outline" className="text-xs">Buxheti: {job.budget} ALL</Badge>}
                                {job.deadline && <Badge variant="outline" className="text-xs">Afati: {new Date(job.deadline).toLocaleDateString("sq-AL")}</Badge>}
                              </div>
                              {job.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{job.description}</p>}
                            </div>
                            <Button onClick={() => acceptJob.mutate({ requestId: job.id, customerId: job.customerId })} disabled={acceptJob.isPending}>
                              {acceptJob.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Prano Punën"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                }
              </motion.div>
            )}

            {activeTab === "my-orders" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="font-serif text-2xl font-bold mb-6">Porositë e Mia</h1>
                {myOrders.length === 0 ? (
                  <div className="bg-card border rounded-xl p-16 text-center">
                    <CheckCircle2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium">Ende asnjë porosi.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myOrders.map((order: any) => (
                      <div key={order.id} className="bg-card border rounded-xl p-4 flex items-center gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-sm">Porosi #{order.id}</p>
                          <p className="text-xs text-muted-foreground">{order.price ? `${order.price} ${order.currency}` : "—"}</p>
                        </div>
                        <Badge className={`${statusColors[order.status]} border-0`}>{statusLabels[order.status]}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "profile" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="font-serif text-2xl font-bold mb-6">Profili Im</h1>
                <div className="bg-card border rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                      <span className="text-emerald-700 font-bold text-2xl">{user?.email?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg">{user?.user_metadata?.full_name || "Pérkthyes"}</h2>
                      <p className="text-muted-foreground text-sm">{user?.email}</p>
                      <Badge className="mt-1 bg-emerald-100 text-emerald-700 border-0">Pérkthyes</Badge>
                    </div>
                  </div>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>Profili juaj është nën shqyrtim nga administratori. Do të njoftoheni kur të aprovohet.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "messages" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="font-serif text-2xl font-bold mb-6">Mesazhet</h1>
                <div className="bg-card border rounded-xl p-16 text-center">
                  <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium">Asnjë bisedë ende.</p>
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
