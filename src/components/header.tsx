import { Link } from "react-router-dom";

export function Header() {
  return (
    <header className="w-full h-[var(--app-shell-bar-height)] bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-lg">
      <div className="w-full h-full px-4 sm:px-6 lg:px-8 flex items-center">
        <Link
          to="/"
          aria-label="Tuus Imago – home"
          className="inline-flex items-center"
        >
          <span className="text-3xl font-bold leading-none">
            <span className="text-slate-900">Tuus</span>
            <span className="text-blue-500">Imago</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
