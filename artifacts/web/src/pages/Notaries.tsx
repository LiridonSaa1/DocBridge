import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useListNotaries, getListNotariesQueryKey } from "@workspace/api-client-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Phone, Building2, ChevronRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { citiesByCountry } from "@/data/citiesByCountry";

const KOSOVO_CITIES = citiesByCountry["Kosovo"] ?? [];
const ALBANIAN_CITIES = citiesByCountry["Shqipëri"] ?? [];
const ALL_CITIES = [...KOSOVO_CITIES, ...ALBANIAN_CITIES];

export default function Notaries() {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const queryClient = useQueryClient();

  const { data: notaries, isLoading } = useListNotaries(
    { search: search || undefined, city: city || undefined },
    { query: { queryKey: getListNotariesQueryKey({ search: search || undefined, city: city || undefined }) } }
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Page header */}
        <div className="bg-gradient-to-br from-secondary to-secondary/90 text-secondary-foreground py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <Badge className="mb-3 bg-primary/20 text-primary border-primary/30">Shërbime Noteriale</Badge>
              <h1 className="font-serif text-3xl font-bold mb-2">Noterë të Aprovuar</h1>
              <p className="text-secondary-foreground/70">Gjeni noterin më të afërt dhe të certifikuar</p>
            </motion.div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border-b border-border sticky top-16 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Kërko noter..."
                  className="pl-9"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  data-testid="input-search-notaries"
                />
              </div>
              <select
                className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={city}
                onChange={e => setCity(e.target.value)}
                data-testid="select-city"
              >
                <option value="">Të gjitha qytetet</option>
                <optgroup label="🇽🇰 Kosovë">
                  {KOSOVO_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </optgroup>
                <optgroup label="🇦🇱 Shqipëri">
                  {ALBANIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </optgroup>
              </select>
              {(search || city) && (
                <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setCity(""); }} data-testid="button-clear-filters">
                  Pastro filtrat
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-52 rounded-xl" />)}
            </div>
          ) : notaries?.length ? (
            <>
              <p className="text-sm text-muted-foreground mb-5">{notaries.length} noter{notaries.length !== 1 ? "ë" : ""} u gjet{notaries.length !== 1 ? "ën" : ""}</p>
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {notaries.map(n => (
                  <motion.div
                    key={n.id}
                    variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                  >
                    <Link href={`/notaries/${n.id}`} data-testid={`card-notary-${n.id}`}>
                      <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all h-full flex flex-col group">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-bold">{n.fullName.charAt(0)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{n.fullName}</h3>
                            <p className="text-sm text-muted-foreground truncate">{n.businessName}</p>
                          </div>
                        </div>
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            <span>{n.city}{n.address ? `, ${n.address}` : ""}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            <span>{n.phone}</span>
                          </div>
                          {n.businessNumber && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Building2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                              <span>NIPT: {n.businessNumber}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
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
              <Building2 className="h-14 w-14 mx-auto mb-4 opacity-25" />
              <p className="text-lg font-medium">Asnjë noter nuk u gjet</p>
              <p className="text-sm mt-1">Provoni me kritere të tjera kërkimi</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
