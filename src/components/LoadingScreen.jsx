import { motion } from "framer-motion";

export default function LoadingScreen({ progress = 0 }) {
  const pct = Math.max(5, Math.min(100, progress));

  return (
    <motion.div
      className="fixed inset-0 z-[100] grid min-h-svh place-items-center bg-gray-950 text-teal-100"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full max-w-[26rem] px-4 sm:px-6">
        {/* brand */}
        <div className="mb-5 flex items-center justify-center gap-3">
          <img
            src="/logo.jpg"
            alt="Eventz One"
            className="h-9 w-9 rounded-xl object-cover"
            loading="eager"
          />
          <div className="text-xl font-semibold tracking-tight">Eventz One</div>
        </div>

        {/* spinner */}
        <div className="mx-auto h-16 w-16">
          <div className="relative h-full w-full">
            <div className="absolute inset-0 rounded-full border-2 border-teal-800/40" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
          </div>
        </div>

        {/* progress */}
        <div className="mx-auto mt-6 w-[min(88vw,20rem)]">
          <div className="h-2 overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-amber-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-center text-xs text-teal-200/70">
            Preparing experience… {Math.floor(pct)}% loaded
          </p>
        </div>
      </div>
    </motion.div>
  );
}
