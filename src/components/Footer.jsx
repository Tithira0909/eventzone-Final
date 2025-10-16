import { Mail, MapPin, Phone, Facebook, Instagram, Youtube, ArrowUpRight } from "lucide-react";
// If your logo is in /public, use "/logo.png". If it's in src/assets, import it:
import logo from "../public/logo.jpg"; // <-- change if you keep it in /public

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-20 border-t border-teal-800/30 bg-[#070e19] text-teal-100">
      {/* soft corner glow */}
      <div className="pointer-events-none absolute -left-32 top-0 h-72 w-72 rounded-full bg-gradient-to-br from-teal-400/15 via-emerald-400/10 to-amber-300/10 blur-2xl" />
      <div className="pointer-events-none absolute -right-32 -top-10 h-64 w-64 rounded-full bg-gradient-to-tl from-amber-300/15 via-teal-400/10 to-cyan-400/10 blur-2xl" />

      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-4">
        {/* Brand */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <img
              src={logo /* or "/logo.png" */}
              alt="Eventz One"
              className="h-9 w-9 rounded-xl shadow-sm ring-1 ring-white/10 object-cover"
            />
            <div>
              <div className="text-2xl font-semibold tracking-tight text-teal-50">Eventz One</div>
              {/* <div className="text-teal-200/75">Elegantly crafted events</div> */}
            </div>
          </div>

          <p className="mt-4 max-w-prose text-sm leading-relaxed text-teal-200/80">
            We curate throwback concerts and premium live shows with a seamless ticketing experience.
            Bring your friends, make new memories, and enjoy world-class production values.
          </p>

          <div className="mt-5 flex items-center gap-3">
            <a
              href="https://facebook.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10"
              aria-label="Facebook"
            >
              <Facebook className="h-4.5 w-4.5" />
            </a>
            <a
              href="https://instagram.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10"
              aria-label="Instagram"
            >
              <Instagram className="h-4.5 w-4.5" />
            </a>
            <a
              href="https://youtube.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10"
              aria-label="YouTube"
            >
              <Youtube className="h-4.5 w-4.5" />
            </a>
          </div>
        </div>

        {/* Quick links */}
        <nav className="grid gap-2 text-medium">
          <div className="mb-2 text-lg font-semibold uppercase tracking-wider text-teal-200/60">
            Quick Links
          </div>
          <FooterLink href="/#tickets" label="Tickets" />
          <FooterLink href="/#lineup" label="Line-up" />
          <FooterLink href="/#details" label="Event Details" />
          
        
        </nav>

        {/* Contact */}
        <div className="grid gap-2 text-sm">
          <div className="mb-2 text-lg font-semibold uppercase tracking-wider text-teal-200/60">
            Contact
          </div>
          <div className="inline-flex items-center gap-2 text-teal-200/85">
            <Phone className="h-4 w-4 text-amber-300" />
            <span>
              <span className="text-teal-100/90">Hotline:</span>{" "}
              <a href="tel:0741613392" className="text-amber-300 hover:text-amber-200">074 161 3392</a>{" "}
              <span className="text-teal-400/50">•</span>{" "}
              <a href="tel:0778235867" className="text-amber-300 hover:text-amber-200">077 823 5867</a>
            </span>
          </div>
          <div className="inline-flex items-center gap-2 text-teal-200/85">
            <Mail className="h-4 w-4 text-amber-300" />
            <a href="mailto:hello@eventzone.lk" className="hover:text-teal-100">
              hello@eventzone.lk
            </a>
          </div>
          <div className="inline-flex items-center gap-2 text-teal-200/85">
            <MapPin className="h-4 w-4 text-amber-300" />
            Colombo, Sri Lanka
          </div>

          <a
            href="https://wa.me/94741613392"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 self-start rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/15"
          >
            Chat on WhatsApp <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-6 py-6 text-xs text-teal-200/70 md:flex-row md:items-center">
          <div>© {year} Eventz One. All rights reserved.</div>
          <div className="space-x-1">
            <span>Design and Developed by</span>
            <a
              href="https://zeatralabs.com"
              target="_blank"
              rel="noreferrer"
              className="font-normal text-teal-200 hover:text-amber-300"
            >
              Zeatralabs.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* small helper for links */
function FooterLink({ href, label }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 text-teal-200/85 hover:text-teal-50"
    >
      <span className="h-[2px] w-2 rounded bg-teal-500/60" />
      {label}
    </a>
  );
}
