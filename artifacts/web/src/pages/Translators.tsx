import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useListTranslators, getListTranslatorsQueryKey } from "@workspace/api-client-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Languages, ChevronRight } from "lucide-react";

const LANGUAGES = ["Anglisht", "Italisht", "Gjermanisht", "Frëngjisht", "Spanjisht", "Greqisht", "Turqisht", "Arabisht"];

export default function Translators() {
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("");

  const { data: translators, isLoading } = useListTranslators(
    { search: search || undefined, language: language || undefined },
    { query: { queryKey: getListTranslatorsQueryKey({ search: search || undefined, language: language || undefined }) } }
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-br from-secondary to-secondary/90 text-secondary-foreground py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <Badge className="mb-3 bg-primary/20 text-primary border-primary/30">Shërbime Pérkthimi</Badge>
              <h1 className="font-serif text-3xl font-bold mb-2">Pérkthyes Profesionistë</h1>
              <p className="text-secondary-foreground/70">Gjeni pérkthyesin e duhur sipas gjuhës dhe qytetit</p>
            </motion.div>
          </div>
        </div>

        <div className="bg-card border-b border-border sticky top-16 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Kërko pérkthyes..."
                  className="pl-9"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  data-testid="input-search-translators"
                />
              </div>
              <select
                className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={language}
                onChange={e => setLanguage(e.target.value)}
                data-testid="select-language"
              >
                <option value="">Të gjitha gjuhët</option>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              {(search || language) && (
                <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setLanguage(""); }}>
                  Pastro
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-52 rounded-xl" />)}
            </div>
          ) : translators?.length ? (
            <>
              <p className="text-sm text-muted-foreground mb-5">{translators.length} pérkthyes u gjet{translators.length !== 1 ? "ën" : ""}</p>
              <motion.div
                initial="hidden" animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {translators.map(t => (
                  <motion.div key={t.id} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
                    <Link href={`/translators/${t.id}`} data-testid={`card-translator-${t.id}`}>
                      <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all h-full flex flex-col group">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-bold">{t.fullName.charAt(0)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{t.fullName}</h3>
                            {t.businessName && <p className="text-sm text-muted-foreground truncate">{t.businessName}</p>}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {t.languages.slice(0, 4).map(lang => (
                            <Badge key={lang} variant="secondary" className="text-xs">{lang}</Badge>
                          ))}
                          {t.languages.length > 4 && <Badge variant="outline" className="text-xs">+{t.languages.length - 4}</Badge>}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-auto">
                          <MapPin className="h-3 w-3 text-primary" />
                          <span>{t.city}</span>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                          <Badge variant="outline" className="text-xs">Aprovuar</Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <Languages className="h-14 w-14 mx-auto mb-4 opacity-25" />
              <p className="text-lg font-medium">Asnjë pérkthyes nuk u gjet</p>
              <p className="text-sm mt-1">Provoni me kritere të tjera kërkimi</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
