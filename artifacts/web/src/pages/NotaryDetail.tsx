import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetNotary, getGetNotaryQueryKey } from "@workspace/api-client-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Phone, Mail, Building2, Award, ChevronLeft, FileText } from "lucide-react";

export default function NotaryDetail({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const { data: notary, isLoading } = useGetNotary(id, {
    query: { enabled: !!id, queryKey: getGetNotaryQueryKey(id) },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
        <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
          <Link href="/notaries" className="gap-1.5">
            <ChevronLeft className="h-4 w-4" /> Kthehu te noterët
          </Link>
        </Button>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        ) : notary ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            {/* Header card */}
            <div className="bg-card border border-border rounded-xl p-6 mb-5">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-2xl">{notary.fullName.charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">{notary.fullName}</h1>
                      <p className="text-muted-foreground">{notary.businessName}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-green-200">Aprovuar</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="bg-card border border-border rounded-xl p-6 mb-5">
              <h2 className="font-semibold text-foreground mb-4">Informacioni i kontaktit</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={MapPin} label="Qyteti" value={notary.city} />
                {notary.address && <InfoRow icon={MapPin} label="Adresa" value={notary.address} />}
                <InfoRow icon={Phone} label="Telefon" value={notary.phone} />
                <InfoRow icon={Mail} label="Email" value={notary.email} />
                <InfoRow icon={Building2} label="NIPT" value={notary.businessNumber} />
                {notary.certificationNumber && (
                  <InfoRow icon={Award} label="Nr. Certifikates" value={notary.certificationNumber} />
                )}
              </div>
            </div>

            {notary.bio && (
              <div className="bg-card border border-border rounded-xl p-6 mb-5">
                <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Rreth noterit
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">{notary.bio}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button className="flex-1" asChild data-testid="button-call-notary">
                <a href={`tel:${notary.phone}`}>
                  <Phone className="h-4 w-4 mr-2" />
                  Kontaktoni
                </a>
              </Button>
              <Button variant="outline" className="flex-1" asChild data-testid="button-email-notary">
                <a href={`mailto:${notary.email}`}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </a>
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <FileText className="h-14 w-14 mx-auto mb-4 opacity-25" />
            <p>Noteri nuk u gjet.</p>
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
