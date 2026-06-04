import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetCourse, getGetCourseQueryKey } from "@workspace/api-client-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Phone, Mail, Clock, ChevronLeft, BookOpen, Building2 } from "lucide-react";

export default function CourseDetail({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const { data: course, isLoading } = useGetCourse(id, {
    query: { enabled: !!id, queryKey: getGetCourseQueryKey(id) },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
        <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
          <Link href="/courses" className="gap-1.5">
            <ChevronLeft className="h-4 w-4" /> Kthehu te kurset
          </Link>
        </Button>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        ) : course ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            {course.imageUrl && (
              <div className="rounded-xl overflow-hidden mb-5 h-52">
                <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="bg-card border border-border rounded-xl p-6 mb-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <Badge variant="secondary" className="mb-2">{course.category}</Badge>
                  <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
                  <p className="text-muted-foreground mt-1">{course.provider}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {Number(course.price) === 0 ? "Falas" : `${course.price} Lekë`}
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">{course.description}</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 mb-5">
              <h2 className="font-semibold text-foreground mb-4">Detajet e kursit</h2>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow icon={MapPin} label="Qyteti" value={course.city} />
                <InfoRow icon={Clock} label="Kohëzgjatja" value={course.duration} />
                <InfoRow icon={Building2} label="Ofrues" value={course.provider} />
                {course.contactPhone && <InfoRow icon={Phone} label="Telefon" value={course.contactPhone} />}
                {course.contactEmail && <InfoRow icon={Mail} label="Email" value={course.contactEmail} />}
              </div>
            </div>

            {(course.contactPhone || course.contactEmail) && (
              <div className="flex gap-3">
                {course.contactPhone && (
                  <Button className="flex-1" asChild data-testid="button-call-course">
                    <a href={`tel:${course.contactPhone}`}>
                      <Phone className="h-4 w-4 mr-2" />Kontaktoni
                    </a>
                  </Button>
                )}
                {course.contactEmail && (
                  <Button variant="outline" className="flex-1" asChild data-testid="button-email-course">
                    <a href={`mailto:${course.contactEmail}`}>
                      <Mail className="h-4 w-4 mr-2" />Email
                    </a>
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="h-14 w-14 mx-auto mb-4 opacity-25" />
            <p>Kursi nuk u gjet.</p>
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
