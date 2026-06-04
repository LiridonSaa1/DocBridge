import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { useCreateNotary, useCreateTranslator } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, User, FileText, Languages, ChevronRight } from "lucide-react";

type Role = "customer" | "notary" | "translator";

const customerSchema = z.object({
  email: z.string().email("Email i pavlefshëm"),
  password: z.string().min(6, "Te pakten 6 karaktere"),
  fullName: z.string().min(2, "Emri duhet te kete te pakten 2 karaktere"),
  phone: z.string().min(6, "Numri i telefonit i pavlefshëm"),
});

const notarySchema = customerSchema.extend({
  businessName: z.string().min(2, "Emri i biznesit duhet të plotësohet"),
  businessNumber: z.string().min(3, "Numri i biznesit duhet të plotësohet"),
  city: z.string().min(2, "Qyteti duhet të plotësohet"),
  address: z.string().optional(),
  certificationNumber: z.string().optional(),
  bio: z.string().optional(),
});

const translatorSchema = customerSchema.extend({
  languages: z.string().min(2, "Shkruani gjuhët e ndara me presje"),
  city: z.string().min(2, "Qyteti duhet të plotësohet"),
  diplomaInfo: z.string().optional(),
  bio: z.string().optional(),
});

type CustomerForm = z.infer<typeof customerSchema>;
type NotaryForm = z.infer<typeof notarySchema>;
type TranslatorForm = z.infer<typeof translatorSchema>;

const roleOptions = [
  { value: "customer" as Role, label: "Klient", desc: "Po kërkoj shërbime", icon: User },
  { value: "notary" as Role, label: "Noter", desc: "Ofroj shërbime noteriale", icon: FileText },
  { value: "translator" as Role, label: "Përkthyes", desc: "Ofroj shërbime përkthimi", icon: Languages },
];

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [role, setRole] = useState<Role>("customer");
  const [step, setStep] = useState(1);
  const createNotary = useCreateNotary();
  const createTranslator = useCreateTranslator();

  const getSchema = () => {
    if (role === "notary") return notarySchema;
    if (role === "translator") return translatorSchema;
    return customerSchema;
  };

  const form = useForm<any>({
    resolver: zodResolver(getSchema()),
    defaultValues: { email: "", password: "", fullName: "", phone: "" },
  });

  const onSubmit = async (values: any) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { role, full_name: values.fullName } },
    });

    if (authError) {
      toast({ title: "Gabim", description: authError.message, variant: "destructive" });
      return;
    }

    const userId = authData.user?.id;

    try {
      if (role === "notary" && userId) {
        await createNotary.mutateAsync({
          data: {
            fullName: values.fullName,
            businessName: values.businessName,
            businessNumber: values.businessNumber,
            city: values.city,
            address: values.address,
            phone: values.phone,
            email: values.email,
            certificationNumber: values.certificationNumber,
            bio: values.bio,
          },
        });
      } else if (role === "translator" && userId) {
        const langs = values.languages.split(",").map((l: string) => l.trim()).filter(Boolean);
        await createTranslator.mutateAsync({
          data: {
            fullName: values.fullName,
            languages: langs,
            city: values.city,
            phone: values.phone,
            email: values.email,
            diplomaInfo: values.diplomaInfo,
            bio: values.bio,
          },
        });
      }

      toast({
        title: "Llogaria u krijua!",
        description: role === "customer" ? "Mirë se vini!" : "Regjistrimi u dërgua për aprovim.",
      });
      setLocation("/login");
    } catch {
      toast({ title: "Gabim", description: "Ndodhi një gabim gjatë regjistrimit.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-secondary to-secondary/90 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/25 via-transparent to-transparent" />
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="relative text-white max-w-sm"
        >
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-6">
            <span className="text-white font-bold text-xl">SH</span>
          </div>
          <h2 className="font-serif text-3xl font-bold mb-3">Bashkohuni me ShërbimePro</h2>
          <p className="text-white/70 leading-relaxed">
            Krijoni llogarinë tuaj si klient, noter ose përkthyes dhe nisni të përfitoni nga platforma jonë profesionale.
          </p>
          <div className="mt-8 space-y-3">
            {["Shërbime të verifikuara", "Aprovim i shpejtë", "Kontakt i drejtpërdrejtë"].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <ChevronRight className="h-3 w-3 text-white" />
                </div>
                <span className="text-white/80 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right form */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">SH</span>
            </div>
            <span className="font-bold text-lg">Shërbime<span className="text-primary">Pro</span></span>
          </div>

          <h1 className="font-serif text-2xl font-bold text-foreground mb-2">Regjistrohu</h1>
          <p className="text-muted-foreground mb-6">Zgjidhni llojin e llogarisë</p>

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {roleOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { setRole(opt.value); form.reset(); }}
                data-testid={`button-role-${opt.value}`}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  role === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <opt.icon className={`h-5 w-5 mb-2 ${role === opt.value ? "text-primary" : "text-muted-foreground"}`} />
                <div className={`text-sm font-semibold ${role === opt.value ? "text-primary" : "text-foreground"}`}>{opt.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5 leading-tight">{opt.desc}</div>
              </button>
            ))}
          </div>

          {role !== "customer" && (
            <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs text-primary">
              Regjistrimi si {role === "notary" ? "noter" : "perkthyes"} kerkon aprovim nga administratori.
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Common fields */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emri i plotë</FormLabel>
                    <FormControl><Input placeholder="Agim Berisha" data-testid="input-fullname" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl><Input placeholder="+355 69..." data-testid="input-phone" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" placeholder="emri@shembull.com" data-testid="input-email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fjalëkalimi</FormLabel>
                  <FormControl><Input type="password" placeholder="Minimum 6 karaktere" data-testid="input-password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Notary-specific */}
              <AnimatePresence>
                {role === "notary" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="pt-3 border-t border-border">
                      <p className="text-sm font-medium text-foreground mb-3">Informacioni i biznesit</p>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="businessName" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emri i biznesit</FormLabel>
                            <FormControl><Input placeholder="Noteri XYZ" data-testid="input-businessname" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="businessNumber" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Numri i biznesit (NIPT)</FormLabel>
                            <FormControl><Input placeholder="K12345678A" data-testid="input-businessnumber" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="city" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Qyteti</FormLabel>
                            <FormControl><Input placeholder="Tiranë" data-testid="input-city" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="certificationNumber" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nr. Certifikates (opcional)</FormLabel>
                            <FormControl><Input placeholder="CERT-001" data-testid="input-cert" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem className="mt-3">
                          <FormLabel>Adresa (opcional)</FormLabel>
                          <FormControl><Input placeholder="Rruga, Nr. ..." data-testid="input-address" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </motion.div>
                )}

                {role === "translator" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="pt-3 border-t border-border">
                      <p className="text-sm font-medium text-foreground mb-3">Informacioni profesional</p>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="languages" render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Gjuhët (ndara me presje)</FormLabel>
                            <FormControl><Input placeholder="Anglisht, Italisht, Gjermanisht" data-testid="input-languages" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="city" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Qyteti</FormLabel>
                            <FormControl><Input placeholder="Tiranë" data-testid="input-city" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="diplomaInfo" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Info Diplomë (opcional)</FormLabel>
                            <FormControl><Input placeholder="Universiteti i Tiranës..." data-testid="input-diploma" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting || createNotary.isPending || createTranslator.isPending}
                data-testid="button-submit-register"
              >
                {form.formState.isSubmitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Duke regjistruar...</>
                ) : "Regjistrohu"}
              </Button>
            </form>
          </Form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Keni llogari?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline" data-testid="link-to-login">
              Hyni këtu
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
