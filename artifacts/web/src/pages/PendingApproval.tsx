import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, XCircle, AlertCircle, Mail, Phone, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function PendingApproval() {
  const { user, signOut } = useAuth();

  const steps = [
    { icon: Mail, label: "Verifikimi i Emailit", done: true },
    { icon: Phone, label: "Verifikimi i Telefonit", done: false, current: true },
    { icon: FileText, label: "Rishikimi i Dokumenteve", done: false },
    { icon: CheckCircle2, label: "Aprovimi Final", done: false },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="DocBridge" className="h-10 object-contain mx-auto mb-6" />
        </div>

        {/* Status card */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-foreground mb-2">
            Aplikimi juaj është në pritje
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Ekipi ynë është duke rishikuar dokumentet dhe informacionet tuaja. Ky proces zakonisht zgjat <strong>24–72 orë</strong>.
          </p>
        </div>

        {/* Progress steps */}
        <div className="bg-card border rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-sm text-foreground mb-4">Progresi i Verifikimit</h2>
          <div className="space-y-3">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.done ? "bg-green-100" : step.current ? "bg-amber-100" : "bg-muted"
                  }`}>
                    <Icon className={`h-4 w-4 ${
                      step.done ? "text-green-600" : step.current ? "text-amber-600" : "text-muted-foreground"
                    }`} />
                  </div>
                  <div className="flex-1">
                    <span className={`text-sm font-medium ${
                      step.done ? "text-green-700" : step.current ? "text-amber-700" : "text-muted-foreground"
                    }`}>{step.label}</span>
                  </div>
                  {step.done && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  {step.current && <Clock className="h-4 w-4 text-amber-500" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Info */}
        <div className="bg-muted/40 rounded-xl p-4 mb-6 text-sm text-muted-foreground space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <p>Do të njoftoheni me email sapo statusi juaj të ndryshojë.</p>
          </div>
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <p>Nëse kërkohet informacion shtesë, administratori do t'ju kontaktojë drejtpërdrejt.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button variant="outline" onClick={signOut} className="w-full">
            Dilni nga Llogaria
          </Button>
          <Link href="/">
            <Button variant="ghost" className="w-full text-muted-foreground">
              Kthehuni në Faqen Kryesore
            </Button>
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Pyetje? Na kontaktoni në{" "}
          <a href="mailto:support@sherbimepro.al" className="text-primary hover:underline">support@sherbimepro.al</a>
        </p>
      </motion.div>
    </div>
  );
}
