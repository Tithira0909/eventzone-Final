// src/App.jsx
import { useEffect, Suspense, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
  Navigate,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import useBoot from "./hooks/useBoot";
import LoadingScreen from "./components/LoadingScreen";
import { POSTER_SRC } from "./config";


/* ── Lazy loaded pages (code-split) ───────────────────────────────────── */
const Home = lazy(() => import("./pages/Home"));
const Landing = lazy(() => import("./pages/Landing"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const SeatMap = lazy(() => import("./pages/SeatMap"));
const Checkout = lazy(() => import("./pages/checkout")); // name on disk is "checkout.jsx"
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const QrGenerator = lazy(() => import("./pages/admin/QrGenerator"));
const TicketBook = lazy(() => import("./pages/admin/TicketBook"));

/* ── Admin route guard ───────────────────────────────────────────────── */
function RequireAdmin({ children }) {
  const authed =
    typeof window !== "undefined" &&
    localStorage.getItem("adminAuthed") === "1";
  return authed ? children : <Navigate to="/admin/login" replace />;
}

/* ── Scroll to top on route change ───────────────────────────────────── */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/* ── 404 page ────────────────────────────────────────────────────────── */
function NotFound() {
  return (
    <div className="grid min-h-[70svh] place-items-center p-6 text-center">
      <div className="w-full max-w-md rounded-2xl border border-teal-800/40 bg-gray-900/60 p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-teal-50">
          Page not found
        </h1>
        <p className="mt-2 text-teal-200/70">Try going back home.</p>
        <Link
          to="/"
          className="mt-5 inline-flex rounded-xl bg-amber-300 px-4 py-2 font-semibold text-gray-900 hover:bg-amber-200"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}

/* ── App shell ───────────────────────────────────────────────────────── */
export default function App() {
  const { ready, progress } = useBoot({
    assets: [POSTER_SRC],
    minDuration: 900,
  });

  return (
    <BrowserRouter>
      <ScrollToTop />

      <div className="relative min-h-svh overflow-x-hidden bg-gray-950 text-teal-100">
        {/* Ambient glows */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-24 -right-24 h-[28rem] w-[28rem] rounded-full bg-teal-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-[28rem] w-[28rem] rounded-full bg-amber-400/20 blur-3xl" />
        </div>

        {/* Splash while preloading */}
        <AnimatePresence>
          {!ready && <LoadingScreen key="splash" progress={progress} />}
        </AnimatePresence>

        {/* Routes */}
        <Suspense
          fallback={
            <div className="p-8 text-center text-teal-200/80">Loading…</div>
          }
        >
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/landing" element={<Landing />} />

            {/* Event flow */}
            <Route path="/events/sanda-ek-dinak" element={<EventDetail />} />
            <Route
              path="/events/sanda-ek-dinak/seats"
              element={<SeatMap />}
            />
            <Route path="/checkout" element={<Checkout />} />

            {/* Admin */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminDashboard />
                </RequireAdmin>
              }
            />
            <Route path="/admin/qr-generator" element={<QrGenerator />} />
            <Route path="/admin/ticketbook" element={< TicketBook/>} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}
