import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  MapPin, Clock, Wine, ChevronDown,
} from 'lucide-react'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function getEventDate() {
  const now = new Date()
  let year = now.getFullYear()
  const event = new Date(year, 10, 30, 19, 0, 0)
  if (now > event) {
    year += 1
  }
  return new Date(year, 10, 30, 19, 0, 0)
}

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(targetDate))
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining(targetDate))
    }, 1000)
    return () => clearInterval(timer)
  }, [targetDate])
  return timeLeft
}

function getTimeRemaining(target) {
  const total = target - new Date()
  const seconds = Math.max(0, Math.floor((total / 1000) % 60))
  const minutes = Math.max(0, Math.floor((total / 1000 / 60) % 60))
  const hours = Math.max(0, Math.floor((total / (1000 * 60 * 60)) % 24))
  const days = Math.max(0, Math.floor(total / (1000 * 60 * 60 * 24)))
  return { days, hours, minutes, seconds }
}

const Section = ({ id, children, className }) => (
  <section id={id} className={classNames('py-20', className)}>
    <div className="container mx-auto px-4 max-w-5xl">{children}</div>
  </section>
)

const Pill = ({ children, className }) => (
  <span className={classNames('inline-block rounded-full bg-teal-600/20 text-teal-300 px-4 py-1 text-sm font-medium', className)}>
    {children}
  </span>
)

const Navbar = () => (
  <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur bg-gray-950/80 border-b border-amber-300/20">
    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
      <a href="#" className="text-teal-300 font-semibold">Eventz One</a>
      <div className="hidden md:flex gap-6 text-sm">
        <a href="#tickets" className="hover:text-teal-300">Tickets</a>
        <a href="#lineup" className="hover:text-teal-300">Line-up</a>
        <a href="#details" className="hover:text-teal-300">Details</a>
        <a href="#faq" className="hover:text-teal-300">FAQ</a>
      </div>
      <a
        href="#tickets"
        className="hidden md:inline-flex rounded-full bg-teal-600 hover:bg-teal-500 text-white px-5 py-2 text-sm font-semibold shadow"
      >
        Buy Tickets
      </a>
    </div>
  </nav>
)

const Hero = () => {
  const eventDate = getEventDate()
  const { days, hours, minutes, seconds } = useCountdown(eventDate)
  return (
    <Section id="hero" className="pt-24 pb-20 text-center">
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="flex flex-col items-center">
        <Pill className="mb-4">Sanda Ek Dinak</Pill>
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-teal-300 to-amber-300 bg-clip-text text-transparent">
          Eventz One — Sanda Ek Dinak
        </h1>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Pill>30 Nov · 7:00 PM</Pill>
          <Pill>Wave N' Lake Navy Hall, Welisara</Pill>
          <Pill>BYOB</Pill>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <a
            href="#tickets"
            className="rounded-full bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 font-semibold shadow"
          >
            Buy Tickets
          </a>
          <a
            href="tel:+94741613392"
            className="rounded-full bg-gray-800 hover:bg-gray-700 text-gray-100 px-6 py-3 font-semibold"
          >
            Hotline
          </a>
          <a
            href="https://wa.me/94778235867"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-gray-800 hover:bg-gray-700 text-gray-100 px-6 py-3 font-semibold"
          >
            WhatsApp VIP
          </a>
          <a
            href="https://maps.app.goo.gl/dyaVqAniyDb2hV9w7"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-gray-800 hover:bg-gray-700 text-gray-100 px-6 py-3 font-semibold"
          >
            Map
          </a>
        </div>
        <div className="mt-10 grid grid-cols-4 gap-2 w-full max-w-md">
          {[{ label: 'Days', value: days }, { label: 'Hours', value: hours }, { label: 'Minutes', value: minutes }, { label: 'Seconds', value: seconds }].map((item) => (
            <div key={item.label} className="flex flex-col bg-gray-900/60 rounded-lg p-3">
              <span className="text-2xl font-bold text-teal-300">{String(item.value).padStart(2, '0')}</span>
              <span className="text-xs uppercase text-gray-400">{item.label}</span>
            </div>
          ))}
        </div>
        <img
          src="/poster.jpg"
          alt="Event poster"
          loading="lazy"
          onError={(e) => (e.currentTarget.style.display = 'none')}
          className="mt-10 w-full max-w-md rounded-2xl border border-amber-300/20 shadow-lg"
        />
      </motion.div>
    </Section>
  )
}

const Tickets = () => {
  const tiers = [
    {
      name: 'General',
      price: 'Rs 5,000',
      cta: 'Call Hotline',
      href: 'tel:+94741613392',
    },
    {
      name: 'VIP',
      price: 'Rs 7,500',
      cta: 'WhatsApp VIP',
      href: 'https://wa.me/94778235867',
      external: true,
    },
  ]
  return (
    <Section id="tickets" className="bg-gray-900/50">
      <h2 className="text-3xl font-bold text-center mb-10">Tickets</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {tiers.map((tier) => (
          <motion.div
            key={tier.name} whileHover={{ y: -4 }}
            className="rounded-3xl bg-gray-900 p-8 border border-amber-300/20 shadow flex flex-col"
          >
            <h3 className="text-2xl font-semibold mb-4 text-teal-300">{tier.name}</h3>
            <p className="text-4xl font-bold mb-6">{tier.price}</p>
            <a
              href={tier.href}
              {...(tier.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 font-semibold shadow"
            >
              {tier.cta}
            </a>
          </motion.div>
        ))}
      </div>
      <p className="mt-6 text-sm text-center text-gray-400">BYOB. Please drink responsibly.</p>
    </Section>
  )
}

const Lineup = () => {
  const artists = [
    'Mariazelle Goonetilleke',
    'Annesley Malewana',
    'Hector Dias',
    'Band: D Major',
  ]
  return (
    <Section id="lineup">
      <h2 className="text-3xl font-bold text-center mb-10">Line-up</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {artists.map((artist) => (
          <div key={artist} className="bg-gray-900 p-4 rounded-2xl border border-amber-300/20 shadow">
            <img
              src="/poster.jpg"
              alt={artist}
              loading="lazy"
              onError={(e) => (e.currentTarget.style.display = 'none')}
              className="w-full h-48 object-cover rounded-xl mb-4"
            />
            <p className="text-center font-semibold">{artist}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}

const Details = () => {
  const cards = [
    {
      icon: MapPin,
      title: 'Venue',
      text: 'Wave N\' Lake Navy Hall, Welisara',
      href: 'https://maps.app.goo.gl/dyaVqAniyDb2hV9w7',
    },
    {
      icon: Clock,
      title: 'Date & Time',
      text: '30 November · 7:00 PM',
    },
    {
      icon: Wine,
      title: 'BYOB',
      text: 'Bring your own bottles',
    },
  ]
  return (
    <Section id="details" className="bg-gray-900/50">
      <h2 className="text-3xl font-bold text-center mb-10">Details</h2>
      <div className="grid gap-6 sm:grid-cols-3">
        {cards.map(({ icon: Icon, title, text, href }) => (
          <div key={title} className="bg-gray-900 p-6 rounded-2xl border border-amber-300/20 shadow text-center flex flex-col items-center">
            <Icon className="w-8 h-8 mb-4 text-amber-300" aria-hidden="true" />
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold hover:text-teal-300"
              >
                {title}
              </a>
            ) : (
              <h3 className="font-semibold">{title}</h3>
            )}
            <p className="mt-2 text-sm text-gray-400">{text}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}

const FAQ = () => {
  const faqs = [
    {
      q: 'How do I purchase tickets?',
      a: 'Use the Buy Tickets button above or call our hotline.',
    },
    {
      q: 'Is parking available?',
      a: 'Yes, ample parking is available at the venue.',
    },
    {
      q: 'Can I bring my own drinks?',
      a: 'Yes, it\'s a BYOB event. Please drink responsibly.',
    },
  ]
  const [open, setOpen] = useState(null)
  return (
    <Section id="faq">
      <h2 className="text-3xl font-bold text-center mb-10">FAQ</h2>
      <div className="space-y-4">
        {faqs.map((item, idx) => (
          <div key={item.q} className="border border-amber-300/20 rounded-2xl">
            <button
              className="w-full flex items-center justify-between p-4 text-left"
              onClick={() => setOpen(open === idx ? null : idx)}
            >
              <span className="font-medium">{item.q}</span>
              <ChevronDown
                className={classNames('w-5 h-5 transition-transform', open === idx ? 'rotate-180' : '')}
                aria-hidden="true"
              />
            </button>
            {open === idx && (
              <div className="p-4 pt-0 text-sm text-gray-400">{item.a}</div>
            )}
          </div>
        ))}
      </div>
    </Section>
  )
}

const Footer = () => (
  <footer className="bg-gray-900/80 border-t border-amber-300/20 py-10 text-center text-sm text-gray-400">
    <p>
      © {new Date().getFullYear()} Eventz One. All rights reserved.
    </p>
  </footer>
)

const MobileStickyCTA = () => (
  <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-gray-900/80 backdrop-blur border-t border-amber-300/20 p-4 flex justify-center">
    <a href="#tickets" className="w-full max-w-md rounded-full bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 font-semibold text-center shadow">
      Buy Tickets
    </a>
  </div>
)

export default function App() {
  return (
    <div className="relative text-gray-100">
      <Navbar />
      <main>
        <Hero />
        <Tickets />
        <Lineup />
        <Details />
        <FAQ />
      </main>
      <Footer />
      <MobileStickyCTA />
    </div>
  )
}
