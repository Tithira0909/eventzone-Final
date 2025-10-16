import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, Ticket, ChevronRight, Calendar, Clock, MapPin, Wine } from "lucide-react";
import { POSTER_SRC } from "../config";

export default function Landing() {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  function onMouseMove(e) {
    const { innerWidth: w, innerHeight: h } = window;
    const rx = ((h / 2 - e.clientY) / h) * 6;
    const ry = ((e.clientX - w / 2) / w) * 8;
    setTilt({ rx, ry });
  }

  return (
    <div onMouseMove={onMouseMove} className="relative min-h-screen overflow-hidden bg-gray-950 text-teal-100">
      {/* Aurora blobs */}
      <div className="pointer-events-none absolute -top-20 -left-16 h-[40rem] w-[40rem] rounded-full bg-teal-700/30 blur-3xl animate-[blob_18s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute -bottom-24 -right-10 h-[36rem] w-[36rem] rounded-full bg-amber-400/20 blur-3xl animate-[blob_22s_ease-in-out_infinite_reverse]" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl animate-[blob_26s_ease-in-out_infinite]" />

      {/* Grain */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-soft-light" style={{
        backgroundImage:
          'url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%2780%27 height=%2780%27 viewBox=%270 0 80 80%27><filter id=%27n%27><feTurbulence type=%27fractalNoise%27 baseFrequency=%270.8%27 numOctaves=%272%27 stitchTiles=%27stitch%27/></filter><rect width=%2780%27 height=%2780%27 filter=%27url(%23n)%27 opacity=%270.25%27/></svg>")'
      }} />

      {/* Top nav */}
      <header className="relative z-10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-teal-400 to-amber-300" />
            <span className="font-semibold tracking-tight">Eventz One</span>
          </Link>
          <nav className="hidden gap-6 sm:flex text-teal-100/80">
            <Link to="/events/sanda-ek-dinak#tickets" className="hover:text-amber-300">Tickets</Link>
            <Link to="/events/sanda-ek-dinak#lineup" className="hover:text-amber-300">Line-up</Link>
            <Link to="/events/sanda-ek-dinak#details" className="hover:text-amber-300">Details</Link>
          </nav>
        </div>
      </header>

      {/* 3D-tilt hero card */}
      <div className="relative z-10 mx-auto grid max-w-6xl place-items-center px-4 py-16 sm:py-24">
        <div
          style={{ transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`, transformStyle: "preserve-3d" }}
          className="w-full max-w-3xl rounded-3xl border border-teal-700/40 bg-gray-900/50 p-8 shadow-2xl backdrop-blur-lg transition-transform"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-900/10 px-3 py-1 text-amber-200/95 text-sm">
            <Star className="h-4 w-4" /> One-Event Tickets • Elegant • BYOB
          </div>

          <h1 className="text-4xl font-bold leading-tight text-teal-50 sm:text-6xl">
            <span className="bg-gradient-to-r from-teal-200 via-amber-200 to-teal-200 bg-[length:200%_100%] bg-clip-text text-transparent animate-[shine_4s_linear_infinite]">
              Sanda Ek Dinak
            </span>
            <span className="mt-2 block text-xl text-teal-200/80 sm:text-2xl">Memory Lane to the 70’s</span>
          </h1>

          <p className="mt-4 max-w-2xl text-teal-200/80">
            A nostalgic Sri Lankan pop night with Mariazelle, Annesley, and Hector.
            BYOB • Smart Casual • Welisara • Nov 30 • 7:00 PM
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link to="/events/sanda-ek-dinak" className="inline-flex items-center gap-2 rounded-2xl bg-amber-300 px-6 py-3 font-semibold text-gray-900 hover:bg-amber-200">
              <Ticket className="h-5 w-5" /> Enter Event
            </Link>
            <Link to="/events/sanda-ek-dinak/seats" className="inline-flex items-center gap-2 rounded-2xl border border-teal-700/40 px-6 py-3 text-teal-100 hover:bg-teal-900/30">
              Seat Map <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-7 overflow-hidden rounded-2xl border border-teal-800/40 bg-gray-900/60">
            <img src={POSTER_SRC} alt="Event poster" className="block w-full h-auto" />
          </div>
        </div>
      </div>

      {/* Icon marquee */}
      <div className="pointer-events-none absolute bottom-8 left-0 right-0 z-10">
        <div className="mx-auto max-w-6xl overflow-hidden px-4">
          <div className="flex gap-10 whitespace-nowrap opacity-80 animate-[marquee_22s_linear_infinite]">
            {Array.from({ length: 2 }).map((_, k) => (
              <div key={k} className="flex items-center gap-10 text-teal-200/80">
                <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4 text-amber-300" /> Sat, Nov 30</span>
                <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-amber-300" /> 07:00 PM</span>
                <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-amber-300" /> Welisara</span>
                <span className="inline-flex items-center gap-2"><Wine className="h-4 w-4 text-amber-300" /> BYOB</span>
                <span className="inline-flex items-center gap-2"><Ticket className="h-4 w-4 text-amber-300" /> Limited Seats</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
