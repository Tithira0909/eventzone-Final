import { motion } from "framer-motion";

export default function LoadingScreen({ progress = 0 }) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex flex-col items-center gap-6 px-6 text-teal-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-teal-400 to-amber-300" />
          <div className="text-xl font-semibold tracking-tight">Eventz One</div>
        </div>

        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-2 border-teal-800/50" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
        </div>

        <div className="w-64 max-w-[80vw]">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-amber-300"
              style={{ width: `${Math.max(5, Math.min(100, progress))}%` }}
            />
          </div>
          <div className="mt-2 text-center text-xs text-teal-200/70">
            Loading experience… {Math.floor(progress)}%
          </div>
        </div>
      </div>
    </motion.div>
  );
}
