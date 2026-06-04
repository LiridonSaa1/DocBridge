import { Link } from "wouter";
import { FileText, Languages, Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-[#0d1117] text-white/70 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center mb-4 group">
              <img
                src="/logo.png"
                alt="DocBridge"
                className="h-12 w-auto object-contain brightness-0 invert group-hover:scale-105 transition-transform duration-200"
              />
            </Link>
            <p className="text-sm leading-relaxed max-w-xs text-white/50">
              Platforma kryesore shqiptare për gjetjen e noterëve dhe pérkthyesve të certifikuar.
            </p>
          </div>

          {/* Shërbime */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Shërbimet</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/notaries" className="flex items-center gap-2 hover:text-white transition-colors group">
                  <FileText className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
                  Noterë
                </Link>
              </li>
              <li>
                <Link href="/translators" className="flex items-center gap-2 hover:text-white transition-colors group">
                  <Languages className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
                  Pérkthyes
                </Link>
              </li>
            </ul>
          </div>

          {/* Llogaria */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Llogaria</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/login" className="hover:text-white transition-colors">Hyrje</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Regjistrohu si noter</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Regjistrohu si pérkthyes</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <span>&copy; {new Date().getFullYear()} ShërbimePro. Të gjitha të drejtat e rezervuara.</span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-primary" />
            Ndërtuar me kujdes për profesionistët shqiptarë
          </span>
        </div>
      </div>
    </footer>
  );
}
