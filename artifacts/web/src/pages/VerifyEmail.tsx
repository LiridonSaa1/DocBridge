import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Mail, CheckCircle2 } from "lucide-react";

export default function VerifyEmail() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="h-12 w-12 text-primary" />
        </div>

        <h1 className="font-serif text-3xl font-bold text-foreground mb-3">
          Aplikimi u dërgua!
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed mb-8">
          Profili juaj do të rishikohet nga administratori brenda 48-72 orëve. Do të njoftoheni kur të aprovohet.
        </p>

        <div className="bg-muted/50 rounded-2xl p-6 mb-6 text-left space-y-3">
          {[
            "Aplikimi juaj u regjistrua me sukses",
            "Administratori do të shqyrtojë dokumentet tuaja",
            "Do të njoftoheni me email kur të aprovohet",
            "Pas aprovimit mund të hyni në platformë",
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="text-sm text-foreground">{step}</span>
            </div>
          ))}
        </div>

        <Link href="/login">
          <Button className="w-full">Kthehuni në Faqen Kryesore</Button>
        </Link>
      </motion.div>
    </div>
  );
}
