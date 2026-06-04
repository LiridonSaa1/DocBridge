import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, LogOut, LayoutDashboard, Shield, FileText, Languages } from "lucide-react";

const navLinks = [
  { href: "/notaries", label: "Noterë", icon: FileText },
  { href: "/translators", label: "Pérkthyes", icon: Languages },
];

export default function Header() {
  const [location] = useLocation();
  const { user, role, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-border"
        : "bg-white border-b border-border"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group" data-testid="link-logo">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30 group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-sm tracking-tight">SH</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-serif font-bold text-lg text-foreground tracking-tight">Shërbime<span className="text-primary">Pro</span></span>
              <span className="text-[10px] text-muted-foreground font-sans tracking-widest uppercase">Profesional</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                data-testid={`link-nav-${href.slice(1)}`}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  location === href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/50 transition-all text-sm" data-testid="button-user-menu">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{user.email?.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="max-w-[100px] truncate font-medium">{user.email?.split("@")[0]}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-border/80">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2 rounded-lg" data-testid="link-dashboard">
                      <LayoutDashboard className="h-4 w-4 text-muted-foreground" />Paneli im
                    </Link>
                  </DropdownMenuItem>
                  {role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2 rounded-lg" data-testid="link-admin">
                        <Shield className="h-4 w-4 text-muted-foreground" />Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive gap-2 rounded-lg" data-testid="button-signout">
                    <LogOut className="h-4 w-4" />Dilni
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                  data-testid="button-login"
                >
                  Hyrje
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  data-testid="button-register"
                >
                  Regjistrohu
                </Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-border bg-white overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Icon className="h-4 w-4" />{label}
                </Link>
              ))}
              <div className="pt-3 border-t border-border flex gap-2 mt-2">
                {user ? (
                  <>
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors">Paneli</Link>
                    <button onClick={() => { signOut(); setMobileOpen(false); }} className="flex-1 py-2 rounded-xl bg-destructive text-white text-sm font-semibold">Dilni</button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors">Hyrje</Link>
                    <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2 rounded-xl bg-primary text-white text-sm font-semibold shadow-md shadow-primary/25">Regjistrohu</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
