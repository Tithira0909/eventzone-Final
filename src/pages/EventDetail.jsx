import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Ticket, Phone, MapPin, Clock, Calendar, Music2, Wine, ChevronRight, ExternalLink, Star } from "lucide-react";
import Pill from "../components/Pill";
import Section from "../components/Section";
import { classNames, nextOccurrenceOfNov30At19 } from "../lib/utils";
import useCountdown from "../hooks/useCountdown";
import { POSTER_SRC } from "../config";

function Navbar() {
  const links = [
    { href: "#tickets", label: "Tickets" },
    { href: "#lineup", label: "Line-up" },
    { href: "#details", label: "Details" },
    { href: "#faq", label: "FAQ" },
  ];
  return (
    <nav className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60 bg-gray-900/90 border-b border-teal-700/40">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-teal-400 to-amber-300" />
          <span className="font-semibold tracking-tight text-teal-100">Eventz One</span>
        </Link>
        <div className="hidden items-center gap-6 sm:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-teal-100/80 hover:text-amber-300 transition-colors">{l.label}</a>
          ))}
          <a href="#tickets" className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-3 py-2 font-medium text-gray-900 hover:bg-amber-200">
            <Ticket className="h-4 w-4" /> Buy Tickets
          </a>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  const target = nextOccurrenceOfNov30At19();
  const { days, hours, minutes, seconds } = useCountdown(target);
  return (
    <header className="relative overflow-hidden bg-gray-950">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/70 via-gray-950/60 to-gray-950" />
        <div className="pointer-events-none absolute -top-24 right-[-10%] h-[32rem] w-[32rem] rounded-full bg-teal-700/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-[-10%] h-[32rem] w-[32rem] rounded-full bg-amber-500/20 blur-3xl" />
      </div>
      <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 sm:grid-cols-2 sm:py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }} className="order-2 sm:order-1">
          <Pill icon={Music2} className="mb-4">Memory Lane to the 70's</Pill>
          <h1 className="text-3xl leading-tight sm:text-5xl font-bold text-teal-50">සඳ එක් දිනක් – <span className="text-amber-300">Sanda Ek Dinak</span></h1>
          <p className="mt-3 max-w-prose text-teal-200/80">A nostalgic evening with legends Mariazelle Goonetilleke, Annesley Malewana, and Hector Dias. Join us for an elegant BYOB night of Sinhala pop classics.</p>
          <div className="mt-6 grid gap-4">
            <div className="flex flex-wrap items-center gap-4 text-teal-100/90">
              <span className="inline-flex items-center gap-2"><Calendar className="h-5 w-5 text-amber-300" /> 30 Nov</span>
              <span className="inline-flex items-center gap-2"><Clock className="h-5 w-5 text-amber-300" /> 7:00 PM</span>
              <span className="inline-flex items-center gap-2"><MapPin className="h-5 w-5 text-amber-300" /> Wave N' Lake Navy Hall, Welisara</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="#tickets" className="inline-flex items-center gap-2 rounded-2xl bg-amber-300 px-5 py-3 font-semibold text-gray-900 hover:bg-amber-200"><Ticket className="h-5 w-5" /> Buy Tickets</a>
              <a href="tel:+94741613392" className="inline-flex items-center gap-2 rounded-2xl border border-teal-700/40 px-5 py-3 text-teal-100 hover:bg-teal-900/30"><Phone className="h-5 w-5" /> Call: 074 161 3392</a>
              <a href="https://wa.me/94778235867" target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-2xl border border-teal-700/40 px-5 py-3 text-teal-100 hover:bg-teal-900/30">WhatsApp 077 823 5867 <ExternalLink className="h-4 w-4" /></a>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-teal-200/80">
              <Pill icon={Wine}>BYOB – Bring Your Own Bottle</Pill>
              <Pill>Smart Casual</Pill>
              <Pill>All Ages</Pill>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .1 }} className="order-1 sm:order-2">
          <div className="relative mx-auto max-w-md overflow-hidden rounded-3xl border border-teal-700/40 bg-gradient-to-b from-gray-900/60 to-gray-900 shadow-2xl">
            <img src={POSTER_SRC} alt="Sanda Ek Dinak poster" className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-950 to-transparent p-4">
              <div className="flex items-center justify-between text-teal-100">
                <span className="inline-flex items-center gap-1 text-sm"><Star className="h-4 w-4 text-amber-300" /> Featured Event</span>
                <a href="#lineup" className="inline-flex items-center gap-1 text-sm text-amber-300 hover:text-amber-200">See artists <ChevronRight className="h-4 w-4" /></a>
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-4 gap-3">
            {[{ label: "Days", value: useCountdown(target).days },
              { label: "Hours", value: useCountdown(target).hours },
              { label: "Minutes", value: useCountdown(target).minutes },
              { label: "Seconds", value: useCountdown(target).seconds }].map((k) => (
              <div key={k.label} className="rounded-2xl border border-teal-700/40 bg-gray-900/60 p-3 text-center">
                <div className="text-2xl font-semibold text-teal-50 tabular-nums">{String(k.value).padStart(2, "0")}</div>
                <div className="text-xs uppercase tracking-wide text-teal-200/70">{k.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </header>
  );
}

function Tickets() {
  const tiers = [
    { name: "General", price: "Rs 5,000", perks: ["Entrance", "Open seating", "Access to bar area"], cta: "Select Seats", to: "/events/sanda-ek-dinak/seats" },
    { name: "VIP", price: "Rs 7,500", perks: ["Reserved seating", "Priority entrance", "Complimentary welcome drink"], cta: "Select Seats", to: "/events/sanda-ek-dinak/seats", featured: true }
  ];
  return (
    <Section id="tickets" title="Tickets" subtitle="Choose your experience">
      <div className="grid gap-6 sm:grid-cols-2">
        {tiers.map(t => (
          <div key={t.name} className={classNames("relative rounded-3xl border p-6 sm:p-8", "border-teal-700/40 bg-gray-900/60", t.featured && "ring-2 ring-amber-300/60")}>
            {t.featured && <span className="absolute -top-3 left-6 rounded-full bg-amber-300 px-3 py-1 text-xs font-semibold text-gray-900">Most Popular</span>}
            <div className="flex items-center justify-between"><h3 className="text-xl font-semibold text-teal-50">{t.name}</h3><Ticket className="h-5 w-5 text-amber-300" /></div>
            <p className="mt-2 text-3xl font-semibold text-amber-300">{t.price}</p>
            <ul className="mt-4 space-y-2 text-teal-200/80">{t.perks.map(p => (
              <li key={p} className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-amber-300" /> {p}</li>))}
            </ul>
            <Link to={t.to} className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-500">{t.cta}</Link>
            <p className="mt-3 text-xs text-teal-200/60">Service fees may apply. BYOB policy in effect.</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Lineup() {
  const artists = [
    { name: "Mariazelle Goonetilleke", role: "Vocalist", img: POSTER_SRC },
    { name: "Annesley Malewana", role: "Vocalist", img: POSTER_SRC },
    { name: "Hector Dias", role: "Vocalist", img: POSTER_SRC },
    { name: "D Major", role: "Band", img: POSTER_SRC },
  ];
  return (
    <Section id="lineup" title="Artists" subtitle="Legendary voices of Sri Lankan pop">
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
        {artists.map(a => (
          <div key={a.name} className="rounded-3xl border border-teal-700/40 bg-gray-900/60 p-3">
            <div className="aspect-[4/5] overflow-hidden rounded-2xl"><img src={a.img} alt={a.name} className="h-full w-full object-cover opacity-90" /></div>
            <div className="p-3"><div className="font-semibold text-teal-50">{a.name}</div><div className="text-sm text-teal-200/70">{a.role}</div></div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Details() {
  return (
    <Section id="details" title="Event details" subtitle="All the essentials at a glance">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-teal-700/40 bg-gray-900/60 p-6"><div className="mb-2 flex items-center gap-2 text-amber-300"><Calendar className="h-5 w-5" /> <span className="font-semibold">Date & time</span></div><p className="text-teal-100">Saturday, Nov 30 • 7:00 PM</p><p className="text-teal-200/70">Doors open 6:00 PM</p></div>
        <div className="rounded-3xl border border-teal-700/40 bg-gray-900/60 p-6"><div className="mb-2 flex items-center gap-2 text-amber-300"><MapPin className="h-5 w-5" /> <span className="font-semibold">Venue</span></div><p className="text-teal-100">Wave N' Lake Navy Hall, Welisara</p><a className="mt-2 inline-flex items-center gap-1 text-amber-300 hover:text-amber-200" href="https://www.google.com/maps/search/?api=1&query=Wave+N+Lake+Navy+Hall+Welisara" target="_blank" rel="noopener">Open in Maps <ExternalLink className="h-4 w-4" /></a></div>
        <div className="rounded-3xl border border-teal-700/40 bg-gray-900/60 p-6"><div className="mb-2 flex items-center gap-2 text-amber-300"><Wine className="h-5 w-5" /> <span className="font-semibold">BYOB policy</span></div><p className="text-teal-100">Bring your own bottle. Glassware available. Please drink responsibly.</p><p className="text-teal-200/70">Right of admission reserved.</p></div>
      </div>
    </Section>
  );
}

function FAQ() {
  const items = [
    { q: "How do I get tickets?", a: "Tap Buy Tickets to contact our hotline or use Select Seats." },
    { q: "Is there parking?", a: "Yes, on-site parking is available on a first-come basis." },
    { q: "Do you allow outside food?", a: "Light snacks are permitted. Catered options available at the venue." },
  ];
  return (
    <Section id="faq" title="FAQ" subtitle="Quick answers">
      <div className="divide-y divide-teal-800/40 overflow-hidden rounded-3xl border border-teal-700/40 bg-gray-900/60">
        {items.map(f => (
          <details key={f.q} className="group open:bg-gray-900/80">
            <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 text-teal-100"><span className="font-medium">{f.q}</span><ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" /></summary>
            <div className="px-5 pb-5 text-teal-200/80">{f.a}</div>
          </details>
        ))}
      </div>
    </Section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-teal-800/40 bg-gray-950 py-10">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-400 to-amber-300" />
            <div>
              <div className="font-semibold text-teal-50">Eventz One</div>
              <div className="text-sm text-teal-200/70">Elegantly crafted events</div>
            </div>
          </div>
          <div className="text-sm text-teal-200/70">Hotline: <a className="text-amber-300" href="tel:+94741613392">074 161 3392</a> · <a className="text-amber-300" href="tel:+94778235867">077 823 5867</a></div>
        </div>
        <p className="mt-6 text-xs text-teal-200/60">© {new Date().getFullYear()} Eventz One. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default function EventDetail() {
  return (
    <div className="min-h-screen scroll-smooth bg-gray-950 text-teal-100">
      <Navbar />
      <Hero />
      <main>
        <Tickets />
        <Lineup />
        <Details />
        <FAQ />
      </main>
      <Footer />
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-teal-800/40 bg-gray-950/95 p-3 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-1">
          <a href="#tickets" className="flex-1 rounded-xl bg-amber-300 py-3 text-center font-semibold text-gray-900">Buy Tickets</a>
          <a href="tel:+94741613392" className="rounded-xl border border-teal-700/40 px-4 py-3 text-teal-100">Call</a>
        </div>
      </div>
    </div>
  );
}
