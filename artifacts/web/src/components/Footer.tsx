import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-secondary text-secondary-foreground mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-xs">SH</span>
              </div>
              <span className="font-bold text-lg">Shërbime<span className="text-primary">Pro</span></span>
            </div>
            <p className="text-sm text-secondary-foreground/70 max-w-xs leading-relaxed">
              Platforma kryesore shqiptare për gjetjen e noterëve, përkthyesve dhe kurseve profesionale.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-3">Shërbimet</h3>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li><Link href="/notaries" className="hover:text-primary transition-colors">Noterë</Link></li>
              <li><Link href="/translators" className="hover:text-primary transition-colors">Përkthyes</Link></li>
              <li><Link href="/courses" className="hover:text-primary transition-colors">Kurse</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-3">Llogaria</h3>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li><Link href="/login" className="hover:text-primary transition-colors">Hyrje</Link></li>
              <li><Link href="/register" className="hover:text-primary transition-colors">Regjistrohu</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-secondary-foreground/50">
          <span>&copy; {new Date().getFullYear()} ShërbimePro. Të gjitha të drejtat e rezervuara.</span>
          <span>Ndërtuar me kujdes per shqiptaret</span>
        </div>
      </div>
    </footer>
  );
}
