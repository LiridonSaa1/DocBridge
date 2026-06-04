import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useListAds, useListNotaries, useListTranslators, useListCourses } from "@workspace/api-client-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, MapPin, Phone, Star, BookOpen, Users, Award, ArrowRight } from "lucide-react";

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.1 } } },
  item: { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } },
};

function AdCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 4500, stopOnInteraction: false })]);
  const { data: ads, isLoading } = useListAds();

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (isLoading) return <Skeleton className="w-full h-64 rounded-2xl" />;
  if (!ads?.length) return null;

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-xl" data-testid="carousel-ads">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {ads.map(ad => (
            <div key={ad.id} className="flex-none w-full relative">
              <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" data-testid={`ad-slide-${ad.id}`}>
                <div
                  className="h-64 md:h-80 bg-gradient-to-br from-primary/90 to-secondary flex items-center justify-center relative overflow-hidden"
                  style={ad.imageUrl ? { backgroundImage: `url(${ad.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
                >
                  {!ad.imageUrl && (
                    <div className="text-center text-white p-8">
                      <Badge className="mb-3 bg-white/20 text-white border-white/30 capitalize">{ad.businessType}</Badge>
                      <h2 className="text-3xl font-bold mb-2">{ad.title}</h2>
                      <p className="text-white/80 text-lg">{ad.description}</p>
                    </div>
                  )}
                  {ad.imageUrl && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                      <div className="text-white">
                        <Badge className="mb-2 bg-primary border-0 capitalize">{ad.businessType}</Badge>
                        <h2 className="text-2xl font-bold">{ad.title}</h2>
                        <p className="text-white/80 text-sm mt-1">{ad.description}</p>
                      </div>
                    </div>
                  )}
                </div>
              </a>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={scrollPrev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all"
        data-testid="button-carousel-prev"
      >
        <ChevronLeft className="h-5 w-5 text-foreground" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all"
        data-testid="button-carousel-next"
      >
        <ChevronRight className="h-5 w-5 text-foreground" />
      </button>
    </div>
  );
}

function StatCard({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <motion.div variants={stagger.item} className="text-center">
      <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </motion.div>
  );
}

export default function Home() {
  const { data: notaries, isLoading: notaryLoading } = useListNotaries();
  const { data: translators, isLoading: translatorLoading } = useListTranslators();
  const { data: courses, isLoading: courseLoading } = useListCourses();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-secondary via-secondary/95 to-secondary/90 text-secondary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              Platforma Profesionale #1 ne Shqiperi
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
              Gjeni Profesionistet<br />
              <span className="text-primary">Besues</span> dhe te Certifikuar
            </h1>
            <p className="text-lg text-secondary-foreground/70 mb-8 leading-relaxed">
              Noterë, përkthyes dhe kurse profesionale — të gjithë në një vend.
              Shërbime të verifikuara, të besueshme, të aksesueshme.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild data-testid="button-hero-notaries">
                <Link href="/notaries">Gjej Noterin</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild data-testid="button-hero-translators">
                <Link href="/translators">Gjej Perkthyesin</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Carousel */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 w-full">
        <AdCarousel />
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          variants={stagger.container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-card rounded-2xl p-8 border border-border shadow-sm"
        >
          <StatCard icon={Users} value={`${(notaries?.length ?? 0) + 50}+`} label="Noterë të regjistruar" />
          <StatCard icon={Award} value={`${(translators?.length ?? 0) + 30}+`} label="Përkthyes" />
          <StatCard icon={BookOpen} value={`${(courses?.length ?? 0) + 20}+`} label="Kurse aktive" />
          <StatCard icon={Star} value="4.9/5" label="Vlerësim mesatar" />
        </motion.div>
      </section>

      {/* Featured Notaries */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Noterë te Aprovuar</h2>
            <p className="text-muted-foreground text-sm mt-1">Profesioniste te certifikuar ne gjithe Shqiperine</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/notaries" className="gap-1" data-testid="link-all-notaries">
              Shiko te gjithe <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        {notaryLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        ) : (
          <motion.div
            variants={stagger.container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {notaries?.slice(0, 3).map(n => (
              <motion.div variants={stagger.item} key={n.id}>
                <Link href={`/notaries/${n.id}`} data-testid={`card-notary-${n.id}`}>
                  <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all group">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-bold text-sm">{n.fullName.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">{n.fullName}</h3>
                        <p className="text-sm text-muted-foreground truncate">{n.businessName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 text-primary" />
                      <span>{n.city}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
        {!notaryLoading && !notaries?.length && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Noterët do të shfaqen pasi të aprovohen nga admini.</p>
          </div>
        )}
      </section>

      {/* Featured Translators */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Perkthyes Profesioniste</h2>
            <p className="text-muted-foreground text-sm mt-1">Me diplome dhe eksperience te verifikuar</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/translators" className="gap-1" data-testid="link-all-translators">
              Shiko te gjithe <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        {translatorLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        ) : (
          <motion.div
            variants={stagger.container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {translators?.slice(0, 3).map(t => (
              <motion.div variants={stagger.item} key={t.id}>
                <Link href={`/translators/${t.id}`} data-testid={`card-translator-${t.id}`}>
                  <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all group">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-bold text-sm">{t.fullName.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">{t.fullName}</h3>
                        <p className="text-xs text-muted-foreground">{t.languages.slice(0, 3).join(", ")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 text-primary" />
                      <span>{t.city}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
        {!translatorLoading && !translators?.length && (
          <div className="text-center py-12 text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Perkthyesit do te shfaqen pasi te aprovohen nga admini.</p>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 md:p-12 text-white text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Jeni noter apo perkthyes?</h2>
          <p className="text-white/80 mb-6 max-w-md mx-auto">
            Regjistrohu sot dhe filloni te merrni klientet e rinj permes platformes tone.
          </p>
          <Button size="lg" variant="secondary" asChild data-testid="button-cta-register">
            <Link href="/register">Regjistrohuni falas</Link>
          </Button>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
