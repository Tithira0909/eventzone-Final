export default function Section({ id, title, subtitle, children }) {
  return (
    <section id={id} className="relative py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        {title && (
          <div className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-teal-100">{title}</h2>
            {subtitle && <p className="mt-2 text-teal-200/70 max-w-2xl">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
