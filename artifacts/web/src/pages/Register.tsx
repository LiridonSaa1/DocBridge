import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { User, Languages, FileText, ChevronRight } from "lucide-react";
import { Link } from "wouter";

const roles = [
  {
    id: "customer",
    label: "Klient",
    description: "Kërkon shërbime noteriale ose përkthimi",
    icon: User,
    color: "from-blue-500/20 to-blue-600/10",
    border: "hover:border-blue-400",
    iconBg: "bg-blue-100 text-blue-600",
    features: ["Krijo kërkesa", "Gjej profesionistë", "Śhtrak progresin", "Paguaj online"],
    path: "/register/customer",
  },
  {
    id: "translator",
    label: "Pérkthyes",
    description: "Ofron shërbime të përkthimit profesional",
    icon: Languages,
    color: "from-emerald-500/20 to-emerald-600/10",
    border: "hover:border-emerald-400",
    iconBg: "bg-emerald-100 text-emerald-600",
    features: ["Prano punë", "Ngarko dokumente", "Menaxho çmimet", "Merr pagesa"],
    path: "/register/translator",
  },
  {
    id: "notary",
    label: "Noter",
    description: "Ofron shërbime noteriale të licensuara",
    icon: FileText,
    color: "from-primary/20 to-primary/10",
    border: "hover:border-primary/60",
    iconBg: "bg-primary/10 text-primary",
    features: ["Aprovo klientë", "Menaxho takimet", "Ngarko dokumente", "Gjenero fatura"],
    path: "/register/notary",
  },
];

export default function Register() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <img src="/logo.png" alt="DocBridge" className="h-9 object-contain" />
        </Link>
        <p className="text-sm text-muted-foreground">
          Keni llogari?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">Hyni</Link>
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="font-serif text-4xl font-bold text-foreground mb-4">
            Çfarë lloji llogarie dëshironi?
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Zgjidhni llojin e llogarisë që përshkruan më mirë rolin tuaj në platformën ShërbimePro.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((role, i) => {
            const Icon = role.icon;
            return (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <button
                  onClick={() => setLocation(role.path)}
                  className={`w-full text-left p-6 rounded-2xl border-2 border-border ${role.border} bg-gradient-to-br ${role.color} transition-all duration-200 hover:shadow-lg hover:-translate-y-1 group`}
                >
                  <div className={`w-14 h-14 rounded-2xl ${role.iconBg} flex items-center justify-center mb-5`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-foreground mb-1">{role.label}</h3>
                  <p className="text-muted-foreground text-sm mb-5 leading-relaxed">{role.description}</p>
                  <ul className="space-y-1.5 mb-5">
                    {role.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                        <div className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0 opacity-50" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                    Regjistrohu si {role.label} <ChevronRight className="h-4 w-4" />
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-10">
          Duke u regjistruar, pranoni{" "}
          <span className="underline cursor-pointer">Kushtet e Shërbimit</span> dhe{" "}
          <span className="underline cursor-pointer">Politikën e Privatësisë</span> të ShërbimePro.
        </p>
      </div>
    </div>
  );
}
