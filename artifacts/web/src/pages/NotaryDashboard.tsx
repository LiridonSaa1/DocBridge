import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { FileText, CheckCircle2, Clock, MessageSquare, User, LayoutDashboard, LogOut, Bell, Loader2, AlertCircle, Calendar } from "lucide-react";

export default function NotaryDashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "requests" | "messages" | "profile">("overview");

  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ["notary-orders"],
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

  const unreadNotifs = notifications.filter((n: any) => !n.isRead).length;
  const pendingOrders = orders.filter((o: any) => o.status === "pending");
  const activeOrders = orders.filter((o: any) => ["accepted", "in_progress"].includes(o.status));
  const completedOrders = orders.filter((o: any) => o.status === "completed");

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700", accepted: "bg-blue-100 text-blue-700",
    in_progress: "bg-orange-100 text-orange-700", completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };
  const statusLabels: Record<string, string> = {
    pending: "Në Pritje", accepted: "Pranuar", in_progress: "Në Progres",
    completed: "Përfunduar", cancelled: "Anuluar",
  };

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
        <aside className="hidden lg:flex w-64 flex-col border-r bg-card p-4 pt-8 gap-1">
          <div className="flex items-center gap-3 px-3 py-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold">{user?.email?.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="font-medium text-sm">{user?.user_metadata?.full_name || "Noter"}</p>
              <p className="text-xs text-muted-foreground">Noter</p>
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
                  <h1 className="font-serif text-2xl font-bold">Paneli i Noterit</h1>
                  <p className="text-muted-foreground text-sm mt-1">Menaxhoni shërbimet noteriale.</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "Në Pritje", value: pendingOrders.length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Aktive", value: activeOrders.length, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
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

                {orders.length === 0 ? (
                  <div className="bg-card border rounded-xl p-12 text-center">
                    <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium">Ende asnjë kërkesë noteriale.</p>
                    <p className="text-sm text-muted-foreground mt-1">Klientët do t'ju kontaktojnë kur profili juaj të aprovohet.</p>
                  </div>
                ) : (
                  <div className="bg-card border rounded-xl p-6">
                    <h2 className="font-semibold mb-4">Kërkesat e Fundit</h2>
                    <div className="space-y-2">
                      {orders.slice(0, 8).map((order: any) => (
                        <div key={order.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-xl transition-colors">
                          <div className="flex-1">
                            <p className="text-sm font-medium">Porosi #{order.id}</p>
                            <p className="text-xs text-muted-foreground">{order.price ? `${order.price} ${order.currency}` : "Çmim pa caktuar"}</p>
                          </div>
                          <Badge className={`${statusColors[order.status] ?? ""} border-0`}>{statusLabels[order.status] ?? order.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "requests" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="font-serif text-2xl font-bold mb-6">Kërkesat Noteriale</h1>
                {orders.length === 0 ? (
                  <div className="bg-card border rounded-xl p-16 text-center">
                    <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium">Asnjë kërkesë ende.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order: any) => (
                      <div key={order.id} className="bg-card border rounded-xl p-4 flex items-center gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-sm">Porosi #{order.id}</p>
                          <p className="text-xs text-muted-foreground">{order.price ? `${order.price} ${order.currency}` : "—"}</p>
                        </div>
                        <Badge className={`${statusColors[order.status] ?? ""} border-0`}>{statusLabels[order.status] ?? order.status}</Badge>
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
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold text-2xl">{user?.email?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg">{user?.user_metadata?.full_name || "Noter"}</h2>
                      <p className="text-muted-foreground text-sm">{user?.email}</p>
                      <Badge className="mt-1 bg-primary/10 text-primary border-0">Noter</Badge>
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
