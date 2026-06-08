import { useState } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Mail, RefreshCw, CheckCircle2 } from "lucide-react";

export default function VerifyEmail() {
  const { toast } = useToast();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return;
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email: user.email });
    setResending(false);
    if (error) {
      toast({ title: "Gabim", description: error.message, variant: "destructive" });
    } else {
      setResent(true);
      toast({ title: "Email u ridërgua!", description: "Kontrolloni kutinë tuaj postare." });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        {/* Icon */}
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="h-12 w-12 text-primary" />
        </div>

        <h1 className="font-serif text-3xl font-bold text-foreground mb-3">
          Verifikoni Emailin
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed mb-8">
          Ju kemi dërguar një email verifikimi. Ju lutemi klikoni linkun në email para se të vazhdoni.
        </p>

        <div className="bg-muted/50 rounded-2xl p-6 mb-6 text-left space-y-3">
          {[
            "Hapni emailin tuaj",
            "Gjeni emailin nga DocBridge",
            "Klikoni butonin 'Verifiko Email-in'",
            "Kthehuni këtu dhe hyni në llogari",
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </div>
              <span className="text-sm text-foreground">{step}</span>
            </div>
          ))}
        </div>

        {resent ? (
          <div className="flex items-center justify-center gap-2 text-green-600 mb-6">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">Email u ridërgua me sukses!</span>
          </div>
        ) : (
          <Button variant="outline" onClick={handleResend} disabled={resending} className="w-full mb-4">
            {resending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Ridërgo Emailin e Verifikimit
          </Button>
        )}

        <Link href="/login">
          <Button className="w-full">Kam verifikuar emailin — Hyni</Button>
        </Link>

        <p className="text-xs text-muted-foreground mt-6">
          Nuk e gjeni emailin? Kontrolloni dosjen e spamit ose{" "}
          <Link href="/register" className="text-primary hover:underline">regjistrohuni sërish</Link>.
        </p>
      </motion.div>
    </div>
  );
}
