import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Loader2, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email i pavlefshëm"),
  password: z.string().min(6, "Fjalëkalimi duhet të ketë të paktën 6 karaktere"),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginForm) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) {
      toast({ title: "Gabim", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Mirë se vini!", description: "Hytet me sukses." });
      setLocation("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary to-secondary/90 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="relative text-white max-w-md"
        >
          <img src="/logo.png" alt="DocBridge" className="h-14 w-auto object-contain mb-6 brightness-0 invert" />
          <h2 className="font-serif text-3xl font-bold mb-4">Mirë se ktheheni</h2>
          <p className="text-white/70 text-lg leading-relaxed">
            Hyni në llogarinë tuaj dhe aksesoni shërbimet profesionale shqiptare.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {["Noterë të Certifikuar", "Pérkthyes Profesionistë", "Kurse Cilësore"].map(item => (
              <div key={item} className="bg-white/10 rounded-xl p-4 text-center">
                <div className="text-xs text-white/70 leading-tight">{item}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8">
            <img src="/logo.png" alt="DocBridge" className="h-10 w-auto object-contain" />
          </div>

          <h1 className="font-serif text-2xl font-bold text-foreground mb-2">Hyrje</h1>
          <p className="text-muted-foreground mb-8">Shkruani kredencialet tuaja</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="emri@shembull.com" data-testid="input-email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fjalëkalimi</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          data-testid="input-password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
                data-testid="button-submit-login"
              >
                {form.formState.isSubmitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Duke hyrë...</>
                ) : "Hyni"}
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Nuk keni llogari?{" "}
            <Link href="/register" className="text-primary font-medium hover:underline" data-testid="link-to-register">
              Regjistrohu
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
