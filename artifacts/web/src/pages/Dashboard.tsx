import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { User, Mail, Phone, Shield, Clock, CheckCircle, XCircle } from "lucide-react";
import { useEffect } from "react";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  active:   { label: "Aktiv",    color: "bg-green-100 text-green-700",  icon: CheckCircle },
  pending:  { label: "Në pritje", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  suspended:{ label: "Pezulluar", color: "bg-red-100 text-red-700",    icon: XCircle },
};

const roleLabels: Record<string, string> = {
  customer:   "Klient",
  notary:     "Noter",
  translator: "Përkthyes",
  admin:      "Administrator",
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) setLocation("/login");
  }, [user, loading, setLocation]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const st = statusConfig["active"];
  const StatusIcon = st.icon;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Paneli im</h1>
              <p className="text-muted-foreground text-sm mt-1">Mirë se vini në llogarinë tuaj</p>
            </div>
            <Badge className={`${statusConfig["active"].color} border-0 gap-1.5 px-3 py-1.5`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {st.label}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile card */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-xl">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">{user.user_metadata?.full_name || "Përdoruesi"}</h2>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {roleLabels[role ?? "customer"] || "Klient"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 text-primary/60" />
                  <span data-testid="text-email">{user.email}</span>
                </div>
                {user.user_metadata?.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 text-primary/60" />
                    <span data-testid="text-phone">{user.user_metadata.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4 text-primary/60" />
                  <span>ID: <code className="text-xs bg-muted px-1 rounded">{user.id.slice(0, 8)}...</code></span>
                </div>
              </div>
            </div>

            {/* Info card */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4">Informacione të llogarisë</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Roli juaj</p>
                    <p className="text-sm text-muted-foreground">{roleLabels[role ?? "customer"]}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Data e regjistrimit</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString("sq-AL", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
                {(role === "notary" || role === "translator") && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                    <p className="text-xs text-yellow-700">
                      Llogaria juaj si {role === "notary" ? "noter" : "perkthyes"} është në pritje të aprovimit nga administratori.
                    </p>
                  </div>
                )}
              </div>
              {role === "admin" && (
                <Button className="w-full mt-5" asChild>
                  <a href="/admin" data-testid="button-go-admin">Shko te Admin Panel</a>
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
