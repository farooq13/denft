import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Divider } from '@nextui-org/react';
import {
  Cloud,
  Twitter,
  ExternalLink,
  Shield,
  Globe,
  Zap,
  ArrowUp,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerLinks = {
    product: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Upload Files', href: '/upload' },
      { label: 'Verify Files', href: '/verify' },
      { label: 'File Management', href: '/files' },
    ],
    resources: [
      { label: 'Help Center', href: '/help', external: true },
      { label: 'Community', href: '/community', external: true },
    ],
    company: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: 'https://x.com/denftcloud', label: 'Twitter' },
  ];

  const features = [
    { icon: Shield, text: 'Blockchain Secured' },
    { icon: Globe, text: 'Globally Distributed' },
    { icon: Zap, text: 'Lightning Fast' },
  ];

  return (
    <footer className="relative mt-20 border-t border-slate-700/50 bg-gradient-to-b from-slate-900/50 to-slate-900 backdrop-blur-xl">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/4 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute -top-24 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600 rounded-lg transition-all duration-300 group"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors duration-300" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Footer Links */}
          <div className='grid grid-cols-2 gap-8'>
              <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link, index) => (
                  <li key={index}>
                    <Link
                      to={link.href}
                      className="text-slate-400 hover:text-blue-400 transition-colors duration-300 text-sm flex items-center group"
                    >
                      <span>{link.label}</span>
                      <ArrowUp className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 rotate-45 transition-all duration-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Resources</h3>
              <ul className="space-y-3">
                {footerLinks.resources.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="text-slate-400 hover:text-blue-400 transition-colors duration-300 text-sm flex items-center group"
                    >
                      <span>{link.label}</span>
                      {link.external && (
                        <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link, index) => (
                  <li key={index}>
                    <Link
                      to={link.href}
                      className="text-slate-400 hover:text-blue-400 transition-colors duration-300 text-sm flex items-center group"
                    >
                      <span>{link.label}</span>
                      <ArrowUp className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 rotate-45 transition-all duration-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <Divider className="bg-slate-700/50 mb-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-6 mb-4 md:mb-0">
            <p className="text-slate-400 text-sm">
              © {currentYear} Denft. All rights reserved.
            </p>
           
          </div>
        </div>
      </div>
    </footer>
  );
};