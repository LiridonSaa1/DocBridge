import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const CustomerDashboard = lazy(() => import("./CustomerDashboard"));
const TranslatorDashboard = lazy(() => import("./TranslatorDashboard"));
const NotaryDashboard = lazy(() => import("./NotaryDashboard"));

export default function Dashboard() {
  const { user, loading, role } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) setLocation("/login");
    if (!loading && user && role === "admin") setLocation("/admin");
  }, [user, loading, role]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      {role === "translator" && <TranslatorDashboard />}
      {role === "notary" && <NotaryDashboard />}
      {(role === "customer" || !role) && <CustomerDashboard />}
    </Suspense>
  );
}
