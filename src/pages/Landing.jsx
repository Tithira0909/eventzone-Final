import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Star, Ticket, ChevronRight, Calendar, Clock, MapPin, Wine } from "lucide-react";
import { POSTER_SRC } from "../config";

export default function Landing() {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const isTouch = useMemo(() => typeof window !== "undefined" && matchMedia("(pointer: coarse)").matches, []);

  function onMouseMove(e) {
    if (isTouch) return;
    const { innerWidth: w, innerHeight: h } = window;
    const rx = ((h / 2 - e.clientY) / h) * 6;
    const ry = ((e.clientX - w / 2) / w) * 8;
    setTilt({ rx, ry });
  }

  return (
    <div
      onMouseMove={onMouseMove}
      className="relative min-h-svh overflow-x-hidden bg-gray-950 text-teal-100"
    >
      {/* nav */}
      <header className="relative z-10">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.jpg" alt="Eventz One" className="h-8 w-8 rounded-xl" />
            <span className="font-semibold tracking-tight">Eventz One</span>
          </Link>
          <nav className="hidden gap-6 text-teal-100/80 sm:flex">
            <Link to="/events/sanda-ek-dinak#tickets" className="hover:text-amber-300">
              Tickets
            </Link>
            <Link to="/events/sanda-ek-dinak#lineup" className="hover:text-amber-300">
              Line-up
            </Link>
            <Link to="/events/sanda-ek-dinak#details" className="hover:text-amber-300">
              Details
            </Link>
          </nav>
        </div>
      </header>

      {/* hero card */}
      <div className="relative z-10 mx-auto grid max-w-6xl place-items-center px-3 py-12 sm:px-4 sm:py-20">
        <div
          style={
            isTouch
              ? undefined
              : {
                  transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                  transformStyle: "preserve-3d",
                }
          }
          className="w-full max-w-3xl rounded-3xl border border-teal-700/40 bg-gray-900/50 p-5 shadow-2xl backdrop-blur-lg sm:p-8"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-900/10 px-3 py-1 text-sm text-amber-200">
            <Star className="h-4 w-4" /> One-Event Tickets • Elegant • BYOB
          </div>

          <h1 className="text-3xl font-bold leading-tight text-teal-50 sm:text-5xl">
            Sanda Ek Dinak
            <span className="mt-1 block text-lg text-teal-200/80 sm:text-2xl">
              Memory Lane to the 70’s
            </span>
          </h1>

          <p className="mt-3 max-w-prose text-teal-200/80">
            A nostalgic Sri Lankan pop night with Mariazelle, Annesley, and Hector. BYOB •
            Smart Casual • Welisara • Nov 30 • 7:00 PM
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/events/sanda-ek-dinak"
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-300 px-5 py-3 font-semibold text-gray-900 hover:bg-amber-200"
            >
              <Ticket className="h-5 w-5" /> Enter Event
            </Link>
            <Link
              to="/events/sanda-ek-dinak/seats"
              className="inline-flex items-center gap-2 rounded-2xl border border-teal-700/40 px-5 py-3 text-teal-100 hover:bg-teal-900/30"
            >
              Seat Map <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-teal-800/40 bg-gray-900/60">
            <img src={POSTER_SRC} alt="Event poster" className="block h-auto w-full" />
          </div>
        </div>
      </div>

      {/* marquee (responsive) */}
      <div className="pointer-events-none absolute bottom-6 left-0 right-0 z-0">
        <div className="mx-auto max-w-6xl overflow-hidden px-3">
          <div className="flex gap-8 whitespace-nowrap opacity-80 [animation:marquee_22s_linear_infinite]">
            {Array.from({ length: 2 }).map((_, k) => (
              <div key={k} className="flex items-center gap-8 text-sm text-teal-200/80">
                <span className="inline-flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-300" /> Sat, Nov 30
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-300" /> 07:00 PM
                </span>
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-amber-300" /> Welisara
                </span>
                <span className="inline-flex items-center gap-2">
                  <Wine className="h-4 w-4 text-amber-300" /> BYOB
                </span>
                <span className="inline-flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-amber-300" /> Limited Seats
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
