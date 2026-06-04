import { useState, useEffect, useCallback, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Link } from "wouter";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useListAds, useListNotaries, useListTranslators } from "@workspace/api-client-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft, ChevronRight, MapPin, Phone, Mail,
  Star, Award, ArrowRight, Shield, CheckCircle, Sparkles,
  FileText, Languages, Building2, Clock,
} from "lucide-react";

// ─── Fade-in animation wrapper ────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Ad Carousel ──────────────────────────────────────────────────────────────
function AdCarousel() {
  const autoplay = useRef(Autoplay({ delay: 4000, stopOnInteraction: false }));
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [autoplay.current]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { data: ads, isLoading } = useListAds();

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  if (isLoading) return <Skeleton className="w-full h-72 rounded-2xl" />;
  if (!ads?.length) return null;

  const businessColors: Record<string, string> = {
    notary: "from-[#8B1A1A] to-[#C0392B]",
    translator: "from-[#1a3a5c] to-[#2980B9]",
    course: "from-[#1a4a1a] to-[#27AE60]",
    other: "from-[#2c1a5c] to-[#8E44AD]",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-2xl shadow-black/15" data-testid="carousel-ads">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {ads.map((ad, i) => (
            <div key={ad.id} className="flex-none w-full">
              <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" data-testid={`ad-slide-${ad.id}`}>
                <div
                  className={`h-72 md:h-80 relative flex items-end overflow-hidden bg-gradient-to-br ${businessColors[ad.businessType] ?? businessColors.other}`}
                  style={ad.imageUrl ? {
                    backgroundImage: `url(${ad.imageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  } : {}}
                >
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                  {/* Decorative circles */}
                  <div className="absolute top-6 right-6 w-32 h-32 rounded-full bg-white/5 border border-white/10" />
                  <div className="absolute top-14 right-14 w-16 h-16 rounded-full bg-white/5 border border-white/10" />

                  {/* Content */}
                  <div className="relative z-10 p-6 md:p-8 w-full">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-semibold border border-white/20 uppercase tracking-wider">
                        <Sparkles className="h-3 w-3" />
                        {ad.businessType === "notary" ? "Noter" : ad.businessType === "translator" ? "Pérkthyes" : ad.businessType}
                      </span>
                    </div>
                    <h2 className="font-serif text-2xl md:text-3xl font-bold text-white leading-tight mb-1">{ad.title}</h2>
                    <p className="text-white/75 text-sm md:text-base">{ad.description}</p>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Nav buttons */}
      <button onClick={scrollPrev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all" data-testid="button-carousel-prev">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button onClick={scrollNext} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all" data-testid="button-carousel-next">
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
        {ads.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`transition-all duration-300 rounded-full ${i === selectedIndex ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/60"}`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Professional Card ────────────────────────────────────────────────────────
function ProCard({ type, item, index }: { type: "notary" | "translator"; item: any; index: number }) {
  const href = `/${type === "notary" ? "notaries" : "translators"}/${item.id}`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={href} data-testid={`card-${type}-${item.id}`}>
        <div className="group bg-card border border-card-border rounded-2xl p-5 hover:shadow-xl hover:shadow-black/8 hover:-translate-y-1 hover:border-primary/25 transition-all duration-300 cursor-pointer h-full flex flex-col">
          {/* Avatar + name */}
          <div className="flex items-start gap-3.5 mb-4">
            <div className="relative flex-shrink-0">
              <div className="w-13 h-13 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10">
                <span className="font-serif font-bold text-xl text-primary">{item.fullName.charAt(0)}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-card flex items-center justify-center">
                <CheckCircle className="h-2.5 w-2.5 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors leading-tight truncate">{item.fullName}</h3>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{type === "notary" ? item.businessName : (item.businessName || "Pérkthyes i lirë")}</p>
            </div>
          </div>

          {/* Languages (for translators) */}
          {type === "translator" && (
            <div className="flex flex-wrap gap-1 mb-3">
              {item.languages.slice(0, 3).map((lang: string) => (
                <span key={lang} className="text-xs px-2 py-0.5 rounded-full bg-primary/8 text-primary font-medium border border-primary/12">{lang}</span>
              ))}
              {item.languages.length > 3 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">+{item.languages.length - 3}</span>
              )}
            </div>
          )}

          {/* Business number (for notaries) */}
          {type === "notary" && item.businessNumber && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <Building2 className="h-3 w-3 text-primary/60" />
              <span>NIPT: {item.businessNumber}</span>
            </div>
          )}

          <div className="mt-auto space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 text-primary flex-shrink-0" />
              <span className="truncate">{item.city}{item.address ? `, ${item.address}` : ""}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 text-primary flex-shrink-0" />
              <span>{item.phone}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <span className="text-xs font-medium text-green-600 flex items-center gap-1">
              <Shield className="h-3 w-3" />Aprovuar
            </span>
            <span className="text-xs text-primary font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
              Shiko <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ badge, title, subtitle, href, linkLabel }: { badge: string; title: string; subtitle: string; href: string; linkLabel: string }) {
  return (
    <div className="flex items-end justify-between mb-8">
      <FadeIn>
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-widest mb-2">
            <Sparkles className="h-3 w-3" />{badge}
          </span>
          <h2 className="font-serif text-3xl font-bold text-foreground">{title}</h2>
          <p className="text-muted-foreground text-sm mt-1.5 max-w-md">{subtitle}</p>
        </div>
      </FadeIn>
      <FadeIn delay={0.1}>
        <Link
          href={href}
          className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-200"
          data-testid={`link-all-${href.slice(1)}`}
        >
          {linkLabel} <ArrowRight className="h-4 w-4" />
        </Link>
      </FadeIn>
    </div>
  );
}

// ─── Floating stat ────────────────────────────────────────────────────────────
function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15">
      <span className="font-serif text-2xl font-bold text-white">{value}</span>
      <span className="text-white/60 text-xs mt-0.5 whitespace-nowrap">{label}</span>
    </div>
  );
}

// ─── Main Home Page ───────────────────────────────────────────────────────────
export default function Home() {
  const { data: notaries, isLoading: notaryLoading } = useListNotaries();
  const { data: translators, isLoading: translatorLoading } = useListTranslators();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-br from-[#0d1117] via-[#1a1f2e] to-[#12161f] overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute top-1/2 left-0 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold tracking-wider uppercase mb-6">
                <Sparkles className="h-3 w-3" />
                Platforma Profesionale Nr. 1 në Shqipëri
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.1] mb-5"
            >
              Gjeni Noterën<br />
              ose Pérkthyesin<br />
              <span className="text-primary">tuaj të Besuar</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-white/60 text-lg md:text-xl leading-relaxed mb-8 max-w-xl"
            >
              Profesionistë të certifikuar, të verifikuar dhe të aprovuar —
              gati për t'ju shërbyer në të gjithë Shqipërinë.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-3 mb-10"
            >
              <Link
                href="/notaries"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm bg-primary text-white shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
                data-testid="button-hero-notaries"
              >
                <FileText className="h-4 w-4" />
                Gjej Noterin
              </Link>
              <Link
                href="/translators"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/35 active:scale-[0.98] transition-all duration-200"
                data-testid="button-hero-translators"
              >
                <Languages className="h-4 w-4" />
                Gjej Pérkthyesin
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="flex flex-wrap gap-3"
            >
              <StatPill value={`${(notaries?.length ?? 0) + 50}+`} label="Noterë aktiv" />
              <StatPill value={`${(translators?.length ?? 0) + 30}+`} label="Pérkthyes" />
              <StatPill value="100%" label="Aprovim zyrtar" />
            </motion.div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ── SHPALLJET (Ads Carousel) ── */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <FadeIn>
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-widest">
              <Sparkles className="h-3 w-3" />Shpalljet
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
        </FadeIn>
        <FadeIn delay={0.08}>
          <AdCarousel />
        </FadeIn>
      </section>

      {/* ── TRUST STRIP ── */}
      <FadeIn>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Shield, label: "Aprovim Zyrtar", desc: "Çdo profesionist verifikohet" },
              { icon: Award, label: "Çertifikata Valide", desc: "Dokumentet janë autentike" },
              { icon: Star, label: "Vlerësim 4.9/5", desc: "Klientë të kënaqur" },
              { icon: Clock, label: "Përgjigje e Shpejtë", desc: "Kontakt direkt 24/7" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-card border border-card-border rounded-2xl p-5 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* ── NOTERËT MÁ TÉ MIRË ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <SectionHeader
          badge="Noterë të Aprovuar"
          title="Noterë të Certifikuar"
          subtitle="Profesionistë me licencë zyrtare dhe eksperiencë të provuar në shërbimet noteriale."
          href="/notaries"
          linkLabel="Shiko të gjithë"
        />
        {notaryLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3].map(i => (
              <div key={i} className="bg-card border border-card-border rounded-2xl p-5 space-y-3">
                <div className="flex gap-3"><Skeleton className="w-13 h-13 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div>
                <Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : notaries?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {notaries.slice(0, 6).map((n, i) => (
              <ProCard key={n.id} type="notary" item={n} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">Noterët do të shfaqen pasi të aprovohen nga admini.</p>
          </div>
        )}
        {/* Mobile "see all" */}
        {notaries?.length ? (
          <div className="sm:hidden mt-5 text-center">
            <Link href="/notaries" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 border-border text-sm font-semibold hover:border-primary/40 hover:text-primary transition-all">
              Shiko të gjithë <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : null}
      </section>

      {/* ── PÉRKTHYESIT MÁ TÉ MIRË ── */}
      <section className="bg-muted/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <SectionHeader
            badge="Pérkthyes Profesionistë"
            title="Pérkthyes me Diplomë"
            subtitle="Pérkthyes të çertifikuar për dokumente zyrtare, juridike dhe mjekësore."
            href="/translators"
            linkLabel="Shiko të gjithë"
          />
          {translatorLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3].map(i => (
                <div key={i} className="bg-card border border-card-border rounded-2xl p-5 space-y-3">
                  <div className="flex gap-3"><Skeleton className="w-13 h-13 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div>
                  <Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-2/3" />
                </div>
              ))}
            </div>
          ) : translators?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {translators.slice(0, 6).map((t, i) => (
                <ProCard key={t.id} type="translator" item={t} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Languages className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">Pérkthyesit do të shfaqen pasi të aprovohen nga admini.</p>
            </div>
          )}
          {translators?.length ? (
            <div className="sm:hidden mt-5 text-center">
              <Link href="/translators" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 border-border text-sm font-semibold hover:border-primary/40 hover:text-primary transition-all">
                Shiko të gjithë <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <FadeIn>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-[#8B1A1A] p-10 md:p-14 text-center">
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-black/10 translate-y-1/3 -translate-x-1/3" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/20 text-white text-xs font-semibold tracking-wider uppercase mb-5">
                <Sparkles className="h-3 w-3" />Regjistro Biznesin Tënd
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-3">
                Jeni Noter ose Pérkthyes?
              </h2>
              <p className="text-white/70 text-lg mb-8 max-w-md mx-auto leading-relaxed">
                Regjistrohu sot dhe filloni të merrni klientë të rinj përmes platformës tonë profesionale.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm bg-white text-primary shadow-xl shadow-black/20 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
                  data-testid="button-cta-register"
                >
                  Regjistrohuni Falas <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-200"
                >
                  Hyni në Llogari
                </Link>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      <Footer />
    </div>
  );
}
