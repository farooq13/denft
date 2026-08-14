import { Link } from 'react-router-dom'
import {
  Cloud,
  Twitter,
  ExternalLink,
  Shield,
  Globe,
  Zap,
  ArrowUp,
} from 'lucide-react'
import { cn } from '@/lib/cn'

//  Link data 

const FOOTER_LINKS = {

  resources: [
    { label: 'Help Center',     href: '#',           external: true  },
    { label: 'Documentation',   href: '#',           external: true  },
    { label: 'Community',       href: '#',           external: true  },
  ],
  company: [
    { label: 'Privacy Policy',  href: '/privacy',    external: false },
    { label: 'Terms of Service',href: '/terms',      external: false },
  ],
} as const

const SOCIAL_LINKS = [
  { label: 'Twitter / X', icon: Twitter, href: 'https://x.com/denftcloud' },
] as const



// Footer link component 

function FooterLink({
  href,
  label,
  external,
}: {
  href: string
  label: string
  external: boolean
}) {
  const cls = cn(
    'flex items-center gap-1 text-sm text-neutral-500',
    'hover:text-primary-400 transition-colors duration-sm',
    'focus-visible:outline-none focus-visible:text-primary-400'
  )

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {label}
        <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
      </a>
    )
  }

  return (
    <Link to={href} className={cls}>
      {label}
    </Link>
  )
}

// ── Main Footer ───────────────────────────────────────────────

export function Footer() {
  const year = new Date().getFullYear()

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <footer
      className={cn(
        'relative border-t border-neutral-800',
        'bg-neutral-950',
        'mt-auto'
      )}
      aria-label="Site footer"
    >
      {/* Subtle gradient accent */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-primary-500/30 to-transparent"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-12">
        {/*  Main grid  */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">


          {/* Link columns */}
          {(Object.entries(FOOTER_LINKS) as [string, typeof FOOTER_LINKS[keyof typeof FOOTER_LINKS]][])
            .map(([section, links]) => (
              <div key={section} className="col-span-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </h3>
                <ul className="space-y-3">
                  {links.map(link => (
                    <li key={link.label}>
                      <FooterLink
                        href={link.href}
                        label={link.label}
                        external={link.external}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>

        {/* ── Divider ───────────────────────────────────────── */}
        <div className="border-t border-neutral-800 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-neutral-600 order-2 sm:order-1">
              © {year} Denft. All rights reserved. Built on Solana.
            </p>

            {/* Scroll to top */}
            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Scroll to top of page"
              className={cn(
                'order-1 sm:order-2 flex items-center gap-1.5 text-xs text-neutral-500',
                'hover:text-neutral-300 transition-colors duration-sm',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-md px-1'
              )}
            >
              <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
              Back to top
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer