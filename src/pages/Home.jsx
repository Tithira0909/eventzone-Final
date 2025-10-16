import { Link } from "react-router-dom";
import { Ticket, Calendar, Clock, MapPin, ChevronRight } from "lucide-react";
import { POSTER_SRC } from "../config";
import Footer from "../components/Footer";

/* Mobile compact row */
function EventRowMobile({ event }) {
  return (
    <Link
      to={event.href}
      className="block rounded-2xl border border-white/10 bg-gray-900/90 p-4 shadow-md sm:hidden"
    >
      <div className="flex items-center gap-4">
        <img
          src={POSTER_SRC}
          alt=""
          className="h-16 w-16 flex-shrink-0 rounded-xl object-cover ring-1 ring-black/10"
        />

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-teal-50">{event.title}</h3>

          <div className="mt-1 space-y-1 text-xs text-teal-200/80">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-amber-300" />
              <span className="truncate">{event.dateText}</span>
              <span className="mx-1">•</span>
              <Clock className="h-4 w-4 text-amber-300" />
              <span>{event.timeText} IST</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-amber-300" />
              <span className="truncate">{event.venue}</span>
            </div>
          </div>
        </div>

        <ChevronRight className="h-5 w-5 flex-shrink-0 text-teal-200/70" />
      </div>
    </Link>
  );
}

/* Desktop card */
function EventCardDesktop({ event }) {
  return (
    <article className="hidden w-full max-w-md overflow-hidden rounded-2xl border border-teal-700/40 bg-gray-900/70 shadow-lg sm:block">
      <div className="aspect-[4/5] w-full">
        <img src={POSTER_SRC} alt={event.title} className="h-full w-full object-cover" />
      </div>

      <div className="p-6">
        <h2 className="font-display text-2xl tracking-wide text-amber-400">{event.title}</h2>

        <div className="mt-4 space-y-2 text-teal-100">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-400" />
            <span className="font-semibold">{event.dateText}</span>
            <span className="mx-1">•</span>
            <Clock className="h-5 w-5 text-amber-400" />
            <span>{event.timeText} IST</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-amber-400" />
            <span className="font-medium">{event.venue}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xl font-bold">
            <span className="text-amber-400">{event.price}</span>{" "}
            <span className="font-medium text-teal-200/80">upwards</span>
          </div>
          <Link
            to={event.href}
            className="rounded-xl bg-gradient-to-r from-teal-500 to-teal-700 px-6 py-3 text-center font-semibold text-white shadow-lg hover:from-teal-400 hover:to-teal-600"
          >
            Buy Tickets
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const event = {
    title: "සඳ එක් දිනක් — Sanda Ek Dinak",
    dateText: "Nov 30, 2025",
    timeText: "07:00 PM",
    venue: "Wave N' Lake Navy Hall, Welisara",
    price: "5,000 LKR",
    href: "/events/sanda-ek-dinak#tickets",
  };

  return (
    <div className="flex min-h-svh flex-col overflow-x-hidden bg-gray-950 text-teal-100">
      <header className="sticky top-0 z-40 border-b border-teal-700/40 bg-gray-900/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.jpg" alt="Eventz One" className="h-7 w-7 rounded-full" />
            <span className="text-base font-semibold text-teal-50 sm:text-lg">Eventz One</span>
          </Link>
          <Link
            to={event.href}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-3 py-2 text-xs font-medium text-gray-900 hover:bg-amber-200 sm:text-sm"
          >
            <Ticket className="h-4 w-4" /> Buy
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-6 sm:px-4 sm:py-12">
        <h1 className="mb-6 font-display text-2xl tracking-wide text-amber-300 sm:text-3xl">
          Featured Event
        </h1>

        <EventRowMobile event={event} />
        <div className="mt-6 flex justify-center">
          <EventCardDesktop event={event} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
