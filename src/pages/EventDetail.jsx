// src/pages/EventDetail.jsx
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Ticket,
  MapPin,
  Clock,
  Calendar,
  Music2,
  Wine,
  ChevronRight,
  ExternalLink,
  Star,
} from "lucide-react";
import Pill from "../components/Pill";
import Section from "../components/Section";
import { classNames, nextOccurrenceOfNov30At19 } from "../lib/utils";
import useCountdown from "../hooks/useCountdown";
import { POSTER_SRC } from "../config";
import Footer from "../components/Footer";

// artist images
import { hector } from "../config";
import { anesley } from "../config";
import { mariyasel } from "../config";
import { band } from "../config";

// navbar logo (adjust the path if yours is different)
import logo from "../public/logo.jpg";

function Navbar() {
  const links = [
    { href: "#tickets", label: "Tickets" },
    { href: "#lineup", label: "Line-up" },
    { href: "#details", label: "Details" },
    { href: "#faq", label: "FAQ" },
  ];
  return (
    <nav className="sticky top-0 z-50 border-b border-teal-700/40 bg-gray-900/90 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <a href="/" className="flex items-center gap-2">
          <img src={logo} alt="Eventz One" className="h-10 w-10 rounded-md" />
          <span className="text-lg font-semibold text-teal-50">Eventz One</span>
        </a>

        <div className="hidden items-center gap-6 sm:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-teal-100/80 transition-colors hover:text-amber-300"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#tickets"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-3 py-2 font-medium text-gray-900 hover:bg-amber-200"
          >
            <Ticket className="h-4 w-4" /> Buy Tickets
          </a>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  const target = nextOccurrenceOfNov30At19();
  const cd = useCountdown(target); // use ONE hook and read its values

  return (
    <header className="relative overflow-hidden bg-gray-950">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/70 via-gray-950/60 to-gray-950" />
        <div className="pointer-events-none absolute -top-24 right-[-10%] h-[32rem] w-[32rem] rounded-full bg-teal-700/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-[-10%] h-[32rem] w-[32rem] rounded-full bg-amber-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 sm:grid-cols-2 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="order-2 sm:order-1"
        >
          <Pill icon={Music2} className="mb-4">
            Memory Lane to the 70&apos;s
          </Pill>
          <h1 className="text-3xl font-bold leading-tight text-teal-50 sm:text-5xl">
            සඳ එක් දිනක් – <span className="text-amber-300">Sanda Ek Dinak</span>
          </h1>
          <p className="mt-3 max-w-prose text-teal-200/80">
            A nostalgic evening with legends Mariazelle Goonetilleke, Annesley
            Malewana, and Hector Dias. Join us for an elegant BYOB night of
            Sinhala pop classics.
          </p>

          <div className="mt-6 grid gap-4">
            <div className="flex flex-wrap items-center gap-4 text-teal-100/90">
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-300" /> 30 Nov
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-300" /> 7:00 PM
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-5 w-5 text-amber-300" /> Wave N&apos; Lake
                Navy Hall, Welisara
              </span>
            </div>

            <div className="flex flex-wrap gap-4">
              <a
                href="#tickets"
                className="inline-flex items-center gap-2 rounded-2xl bg-amber-300 px-5 py-3 font-semibold text-gray-900 hover:bg-amber-200"
              >
                <Ticket className="h-5 w-5" /> Buy Tickets
              </a>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-teal-200/80">
              <Pill icon={Wine}>BYOB – Bring Your Own Bottle</Pill>
              <Pill>Smart Casual</Pill>
              <Pill>All Ages</Pill>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="order-1 sm:order-2"
        >
          <div className="relative mx-auto max-w-md overflow-hidden rounded-3xl border border-teal-700/40 bg-gradient-to-b from-gray-900/60 to-gray-900 shadow-2xl">
            <img
              src={POSTER_SRC}
              alt="Sanda Ek Dinak poster"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-950 to-transparent p-4">
              <div className="flex items-center justify-between text-teal-100">
                <span className="inline-flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 text-amber-300" /> Featured Event
                </span>
                <a
                  href="#lineup"
                  className="inline-flex items-center gap-1 text-sm text-amber-300 hover:text-amber-200"
                >
                  See artists <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-4 gap-3">
            {[
              { label: "Days", value: cd.days },
              { label: "Hours", value: cd.hours },
              { label: "Minutes", value: cd.minutes },
              { label: "Seconds", value: cd.seconds },
            ].map((k) => (
              <div
                key={k.label}
                className="rounded-2xl border border-teal-700/40 bg-gray-900/60 p-3 text-center"
              >
                <div className="tabular-nums text-2xl font-semibold text-teal-50">
                  {String(k.value).padStart(2, "0")}
                </div>
                <div className="text-xs uppercase tracking-wide text-teal-200/70">
                  {k.label}
                </div>
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
    {
      name: "General",
      price: "Rs 5,000",
      perks: ["Entrance", "Open seating", "Access to Dancing Floor"],
      cta: "Select Seats",
      to: "/events/sanda-ek-dinak/seats",
      featured: true,
    },
    {
      name: "VIP",
      price: "Rs 7,500",
      perks: [
        "Reserved seating",
        "Priority entrance",
        "Complimentary welcome drink",
      ],
      cta: "Select Seats",
      to: "/events/sanda-ek-dinak/seats",
    },
    {
      name: "VIP Table",
      price: "Rs 70,000",
      oldPrice: "Rs 75,000",
      limited: true,
      perks: ["Reserved 10 seats", "Priority entrance", "Welcome drink"],
      // ⬇️ THIS one auto-books a whole VIP table
      cta: "Select Table",
      to: "/events/sanda-ek-dinak/seats?vipTable=1",
      state: { vipTable: true },
      autoBook: "vipTable",
    },
  ];

  return (
    <Section id="tickets" title="Tickets" subtitle="Choose your experience">
      <div className="grid gap-6 sm:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={classNames(
              "relative flex flex-col justify-between rounded-3xl border p-6 sm:p-8",
              "border-teal-700/40 bg-gray-900/60 shadow-md",
              t.featured && "ring-2 ring-amber-300/60"
            )}
          >
            {t.featured && (
              <span className="absolute -top-3 left-6 rounded-full bg-amber-300 px-3 py-1 text-xs font-semibold text-gray-900">
                Most Popular
              </span>
            )}
            {t.limited && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-300 px-3 py-1 text-xs font-semibold text-gray-900 shadow">
                Limited Time Offer
              </span>
            )}

            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-teal-50">{t.name}</h3>
              <Ticket className="h-5 w-5 text-amber-300" />
            </div>

            <div className="mt-2">
              {t.oldPrice ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-lg text-teal-200/70 line-through">
                    {t.oldPrice}
                  </span>
                  <span className="text-3xl font-bold text-amber-300">
                    {t.price}
                  </span>
                </div>
              ) : (
                <p className="text-3xl font-semibold text-amber-300">
                  {t.price}
                </p>
              )}
            </div>

            <ul className="mt-4 flex-1 space-y-2 text-teal-200/80">
              {t.perks.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-amber-300" /> {p}
                </li>
              ))}
            </ul>

            {/* CTA:
                For VIP Table we pass state: { autoBook: 'vipTable' } so SeatMap auto-books 10 VIP seats. */}
            <Link
              to={t.to}
              state={t.autoBook ? { autoBook: t.autoBook } : undefined}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-500"
            >
              {t.cta}
            </Link>

            <p className="mt-3 text-xs text-teal-200/60">
              Service fees may apply. BYOB policy in effect.
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Lineup() {
  const artists = [
    { name: "Mariazelle Goonetilleke", role: "Vocalist", img: mariyasel },
    { name: "Annesley Malewana", role: "Vocalist", img: anesley },
    { name: "Hector Dias", role: "Vocalist", img: hector },
    { name: "D Major", role: "Band", img: band },
  ];
  return (
    <Section id="lineup" title="Artists" subtitle="Legendary voices of Sri Lankan pop">
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
        {artists.map((a) => (
          <div
            key={a.name}
            className="rounded-3xl border border-teal-700/40 bg-gray-900/60 p-3"
          >
            <div className="aspect-[4/5] overflow-hidden rounded-2xl">
              <img
                src={a.img}
                alt={a.name}
                className="h-full w-full object-cover opacity-90"
              />
            </div>
            <div className="p-3">
              <div className="font-semibold text-teal-50">{a.name}</div>
              <div className="text-sm text-teal-200/70">{a.role}</div>
            </div>
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
        <div className="rounded-3xl border border-teal-700/40 bg-gray-900/60 p-6">
          <div className="mb-2 flex items-center gap-2 text-amber-300">
            <Calendar className="h-5 w-5" /> <span className="font-semibold">Date &amp; time</span>
          </div>
          <p className="text-teal-100">Saturday, Nov 30 • 7:00 PM</p>
          <p className="text-teal-200/70">Doors open 6:00 PM</p>
        </div>

        <div className="rounded-3xl border border-teal-700/40 bg-gray-900/60 p-6">
          <div className="mb-2 flex items-center gap-2 text-amber-300">
            <MapPin className="h-5 w-5" /> <span className="font-semibold">Venue</span>
          </div>
          <p className="text-teal-100">Wave N&apos; Lake Navy Hall, Welisara</p>
          <a
            className="mt-2 inline-flex items-center gap-1 text-amber-300 hover:text-amber-200"
            href="https://www.google.com/maps/search/?api=1&query=Wave+N+Lake+Navy+Hall+Welisara"
            target="_blank"
            rel="noopener"
          >
            Open in Maps <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <div className="rounded-3xl border border-teal-700/40 bg-gray-900/60 p-6">
          <div className="mb-2 flex items-center gap-2 text-amber-300">
            <Wine className="h-5 w-5" /> <span className="font-semibold">BYOB policy</span>
          </div>
          <p className="text-teal-100">
            Bring your own bottle. Glassware available. Please drink responsibly.
          </p>
          <p className="text-teal-200/70">Right of admission reserved.</p>
        </div>
      </div>
    </Section>
  );
}

function FAQ() {
 
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
    </div>
  );
}
