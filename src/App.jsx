import { AnimatePresence } from "framer-motion";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import useBoot from "./hooks/useBoot";
import LoadingScreen from "./components/LoadingScreen";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import EventDetail from "./pages/EventDetail";
import SeatMap from "./pages/SeatMap";
import { POSTER_SRC } from "./config";

export default function App() {
  const { ready, progress } = useBoot({ assets: [POSTER_SRC], minDuration: 1200 });

  return (
    <BrowserRouter>
      <AnimatePresence>{!ready && <LoadingScreen progress={progress} />}</AnimatePresence>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route path="/events/sanda-ek-dinak" element={<EventDetail />} />
        <Route path="/events/sanda-ek-dinak/seats" element={<SeatMap />} />
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-gray-950 text-teal-100 flex items-center justify-center p-6 text-center">
              <div>
                <h1 className="text-3xl font-bold">Page not found</h1>
                <p className="mt-2 text-teal-200/70">Try going back home.</p>
                <Link className="mt-4 inline-block rounded-xl bg-amber-300 px-4 py-2 text-gray-900 font-semibold" to="/">Go Home</Link>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
