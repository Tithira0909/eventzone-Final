function Navbar() {
  const links = [
    { href: "#tickets", label: "Tickets" },
    { href: "#lineup", label: "Line-up" },
    { href: "#details", label: "Details" },
    { href: "#faq" },
  ];
  return (
    <nav className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60 bg-gray-900/90 border-b border-teal-700/40">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          {/* Navbar */}
 <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
    {/* Left: Logo + Brand */}
    <div className="flex items-center gap-2">
      <img
        src="../logo.jpg"  // ← replace with actual path, e.g., imported image
        alt="Eventz One Logo"
        className="h-15 w-10"
      />
      <span className="text-lg font-semibold text-teal-50">Eventz One</span>
    </div>
   
  </div>    
        </Link>
        <div className="hidden items-center gap-6 sm:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-teal-100/80 hover:text-amber-300 transition-colors">{l.label}</a>
          ))}
          <a href="/events/sanda-ek-dinak/seats" className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-3 py-2 font-medium text-gray-900 hover:bg-amber-200">
            <Ticket className="h-4 w-4" /> Buy Tickets
          </a>
        </div>
      </div>
    </nav>
  );
}