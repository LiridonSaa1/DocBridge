import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetTranslator, getGetTranslatorQueryKey } from "@workspace/api-client-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Phone, Mail, Languages, ChevronLeft, FileText, GraduationCap } from "lucide-react";

export default function TranslatorDetail({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const { data: translator, isLoading } = useGetTranslator(id, {
    query: { enabled: !!id, queryKey: getGetTranslatorQueryKey(id) },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
        <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
          <Link href="/translators" className="gap-1.5">
            <ChevronLeft className="h-4 w-4" /> Kthehu te pérkthyesit
          </Link>
        </Button>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        ) : translator ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-card border border-border rounded-xl p-6 mb-5">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-2xl">{translator.fullName.charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">{translator.fullName}</h1>
                      {translator.businessName && <p className="text-muted-foreground">{translator.businessName}</p>}
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-green-200">Aprovuar</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {translator.languages.map(lang => (
                      <Badge key={lang} className="bg-primary/10 text-primary border-primary/20">{lang}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 mb-5">
              <h2 className="font-semibold text-foreground mb-4">Informacioni i kontaktit</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={MapPin} label="Qyteti" value={translator.city} />
                <InfoRow icon={Phone} label="Telefon" value={translator.phone} />
                <InfoRow icon={Mail} label="Email" value={translator.email} />
                <InfoRow icon={Languages} label="Gjuhët" value={translator.languages.join(", ")} />
                {translator.diplomaInfo && (
                  <InfoRow icon={GraduationCap} label="Diploma" value={translator.diplomaInfo} />
                )}
              </div>
            </div>

            {translator.bio && (
              <div className="bg-card border border-border rounded-xl p-6 mb-5">
                <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Rreth pérkthyesit
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">{translator.bio}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button className="flex-1" asChild data-testid="button-call-translator">
                <a href={`tel:${translator.phone}`}>
                  <Phone className="h-4 w-4 mr-2" />Kontaktoni
                </a>
              </Button>
              <Button variant="outline" className="flex-1" asChild data-testid="button-email-translator">
                <a href={`mailto:${translator.email}`}>
                  <Mail className="h-4 w-4 mr-2" />Email
                </a>
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <Languages className="h-14 w-14 mx-auto mb-4 opacity-25" />
            <p>Pérkthyesi nuk u gjet.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
