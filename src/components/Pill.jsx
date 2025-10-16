import { classNames } from "../lib/utils";

export default function Pill({ icon: Icon, children, className }) {
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm",
        "border-amber-300/40 text-amber-200/95 bg-amber-900/10",
        className
      )}
    >
      {Icon && <Icon className="h-4 w-4" aria-hidden />}
      <span>{children}</span>
    </span>
  );
}
