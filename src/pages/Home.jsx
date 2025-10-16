// src/pages/Home.jsx
import { Link } from "react-router-dom";
import { Calendar, MapPin, Ticket } from "lucide-react";

const POSTER_SRC = "/poster.png"; // replace with your poster

function EventCard({ event }) {
  return (
    <article className="w-full max-w-[340px] sm:max-w-[360px] rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition">
      <Link to={event.href} className="block">
        <div className="aspect-[1/1] overflow-hidden rounded-t-2xl">
          <img
            src={event.poster || POSTER_SRC}
            alt={event.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      </Link>

      <div className="p-4">
        <h3 className="text-xl font-semibold leading-snug line-clamp-2">
          {event.title}
        </h3>

        <div className="mt-3 space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            <span>{event.dateText}</span>
            <span className="mx-1">•</span>
            <span>{event.timeText}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-500" />
            <span className="line-clamp-1">{event.venue}</span>
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-blue-600">
            {event.price}
          </span>
          <span className="text-slate-500">upwards</span>
        </div>
      </div>

      <div className="border-t border-slate-200 p-3">
        <Link
          to={event.href}
          className="block w-full rounded-xl bg-blue-600 py-3 text-center font-semibold text-white hover:bg-blue-500"
        >
          Buy Tickets
        </Link>
      </div>
    </article>
  );
}

export default function Home() {
  const event = {
    title: "Yugathraa යුගාත්‍රා",
    dateText: "Sep 27, 2025",
    timeText: "07.00 PM IST",
    venue: "Nelum Pokuna Indoor Theatre",
    price: "2,000 LKR",
    href: "/events/sanda-ek-dinak#tickets", // change to your route
    poster: POSTER_SRC,
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Sticky top bar */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-slate-200">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-teal-400 to-amber-300" />
            <span className="font-semibold">Eventz One</span>
          </Link>

          {/* Hide the top CTA on very small screens; show a bottom CTA instead */}
          <Link
            to={event.href}
            className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500"
          >
            <Ticket className="h-4 w-4" />
            Buy Tickets
          </Link>
        </div>
      </header>

      {/* Centered single card */}
      <main className="px-4 py-8 sm:py-12">
        <div className="mx-auto flex max-w-6xl items-start justify-center">
          <EventCard event={event} />
        </div>
      </main>

      {/* Mobile bottom CTA */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur p-3">
        <div className="mx-auto max-w-6xl">
          <Link
            to={event.href}
            className="block w-full rounded-xl bg-blue-600 py-3 text-center font-semibold text-white hover:bg-blue-500"
          >
            Buy Tickets
          </Link>
        </div>
      </div>
    </div>
  );
}
