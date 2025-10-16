import { Link } from "react-router-dom";
import { Calendar, Clock, MapPin, ChevronRight } from "lucide-react";

export default function EventCardCompact({ poster, title, dateText, timeText, venue, href }) {
  return (
    <Link
      to={href}
      className="flex items-center gap-3 rounded-2xl border border-neutral-200/70 bg-white p-3 shadow-sm transition hover:shadow-md
                 dark:border-white/10 dark:bg-gray-900/80 dark:hover:bg-gray-900"
    >
      <img
        src={poster}
        alt=""
        className="h-14 w-14 flex-none rounded-lg object-cover ring-1 ring-black/5"
      />

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold text-gray-900 dark:text-teal-50">
          {title}
        </h3>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600 dark:text-teal-200/80">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-4 w-4 text-blue-500 dark:text-amber-300" />
            {dateText}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-4 w-4 text-blue-500 dark:text-amber-300" />
            {timeText} IST
          </span>
          <span className="basis-full inline-flex items-center gap-1">
            <MapPin className="h-4 w-4 text-blue-500 dark:text-amber-300" />
            <span className="truncate">{venue}</span>
          </span>
        </div>
      </div>

      <ChevronRight className="h-5 w-5 flex-none text-gray-400" />
    </Link>
  );
}
