interface HeaderProps {
  title: string;
  breadcrumb: string;
}

export default function Header({ title, breadcrumb }: HeaderProps) {
  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-200 px-8 py-6 sticky top-0 z-10">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            {title}
          </h2>
          <nav className="text-sm text-slate-500 mt-2 flex items-center gap-2">
            <span className="hover:text-slate-700 transition-colors">
              {breadcrumb}
            </span>
          </nav>
        </div>
      </div>
    </header>
  );
}
