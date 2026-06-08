import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, LogOut, LayoutDashboard, Shield, FileText, Languages, Bell, CheckCircle } from "lucide-react";
import { useAdminEvents, type AdminEvent } from "@/hooks/useAdminEvents";

const navLinks = [
  { href: "/notaries", label: "Noterë", icon: FileText },
  { href: "/translators", label: "Pérkthyes", icon: Languages },
];

// ─── Admin Notification Bell ─────────────────────────────────────────────────
function AdminBell() {
  const { events, unreadCount, clearUnread } = useAdminEvents();
  const [open, setOpen] = useState(false);
  const prevCountRef = useRef(0);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (unreadCount <= prevCountRef.current) return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 1200);
    prevCountRef.current = unreadCount;
    return () => clearTimeout(t);
  }, [unreadCount]);

  const handleOpen = (v: boolean) => {
    setOpen(v);
    if (v) clearUnread();
  };

  const typeLabel = (e: AdminEvent) =>
    e.entityType === "notary" ? "Noter i Ri" : "Pérkthyes i Ri";

  const timeAgo = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return "Tani";
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} orë`;
    return `${Math.floor(diff / 86400)} d`;
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <motion.button
          className="relative p-2 rounded-xl hover:bg-muted transition-colors"
          animate={pulse ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.4 }}
          aria-label="Notifikime Admin"
        >
          <Bell className="h-4.5 w-5 text-muted-foreground" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-sm"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 rounded-xl shadow-xl border-border/80 p-0 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
          <div>
            <p className="text-sm font-semibold">Aprovime në Pritje</p>
            <p className="text-xs text-muted-foreground">Notifikime real-time</p>
          </div>
          <Link href="/admin">
            <span className="text-xs text-primary font-medium hover:underline cursor-pointer">Shiko të gjitha</span>
          </Link>
        </div>

        {/* Event list */}
        <div className="max-h-72 overflow-y-auto">
          {events.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle className="h-7 w-7 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Asnjë aprovim i ri</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {events.map((ev, i) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted/60 rounded-none border-b border-border/40 last:border-0">
                      <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${ev.entityType === "notary" ? "bg-primary/10" : "bg-emerald-100"}`}>
                        <span className={`text-sm font-bold ${ev.entityType === "notary" ? "text-primary" : "text-emerald-700"}`}>
                          {ev.fullName.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold truncate">{ev.fullName}</p>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">{timeAgo(ev.createdAt)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{typeLabel(ev)}{ev.city ? ` · ${ev.city}` : ""}</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2.5 bg-muted/20">
          <Link href="/admin">
            <span className="text-xs text-primary font-medium hover:underline cursor-pointer flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Hap Panelin Admin
            </span>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
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
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <Link href="/" className="flex items-center group" data-testid="link-logo">
            <div
              className="group-hover:scale-105 transition-transform duration-200"
              style={{
                width: 190,
                height: 80,
                backgroundImage: "url('/logo.png')",
                backgroundSize: "280px auto",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "-45px -82px",
              }}
              role="img"
              aria-label="DocBridge"
            />
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

          {/* Auth + Admin Bell */}
          <div className="hidden md:flex items-center gap-2">
            {user && role === "admin" && <AdminBell />}

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
