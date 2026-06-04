import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useListCourses, getListCoursesQueryKey } from "@workspace/api-client-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Clock, BookOpen, ChevronRight } from "lucide-react";

const CATEGORIES = ["Gjuhë të huaja", "Teknologji", "Biznes", "Drejtësi", "Kontabilitet", "Arte", "Mjekësi", "Tjetër"];

export default function Courses() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const { data: courses, isLoading } = useListCourses(
    { search: search || undefined, category: category || undefined },
    { query: { queryKey: getListCoursesQueryKey({ search: search || undefined, category: category || undefined }) } }
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-br from-secondary to-secondary/90 text-secondary-foreground py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <Badge className="mb-3 bg-primary/20 text-primary border-primary/30">Edukim Profesional</Badge>
              <h1 className="text-3xl font-bold mb-2">Kurse dhe Trajnime</h1>
              <p className="text-secondary-foreground/70">Zhvilloni aftësitë tuaja me kurset më cilësore</p>
            </motion.div>
          </div>
        </div>

        <div className="bg-card border-b border-border sticky top-16 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Kërko kurs..."
                  className="pl-9"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  data-testid="input-search-courses"
                />
              </div>
              <select
                className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={category}
                onChange={e => setCategory(e.target.value)}
                data-testid="select-category"
              >
                <option value="">Të gjitha kategorit</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {(search || category) && (
                <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setCategory(""); }}>Pastro</Button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-56 rounded-xl" />)}
            </div>
          ) : courses?.length ? (
            <>
              <p className="text-sm text-muted-foreground mb-5">{courses.length} kurs{courses.length !== 1 ? "e" : ""} u gjet{courses.length !== 1 ? "ën" : ""}</p>
              <motion.div
                initial="hidden" animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {courses.map(c => (
                  <motion.div key={c.id} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
                    <Link href={`/courses/${c.id}`} data-testid={`card-course-${c.id}`}>
                      <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:border-primary/30 transition-all h-full flex flex-col group">
                        {c.imageUrl ? (
                          <div className="h-40 bg-muted">
                            <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-28 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <BookOpen className="h-10 w-10 text-primary/40" />
                          </div>
                        )}
                        <div className="p-5 flex flex-col flex-1">
                          <Badge variant="secondary" className="w-fit text-xs mb-2">{c.category}</Badge>
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">{c.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{c.description}</p>
                          <div className="mt-auto space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 text-primary" />{c.city}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 text-primary" />{c.duration}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                            <span className="font-bold text-primary">{Number(c.price) === 0 ? "Falas" : `${c.price} Lekë`}</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <BookOpen className="h-14 w-14 mx-auto mb-4 opacity-25" />
              <p className="text-lg font-medium">Asnjë kurs nuk u gjet</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
