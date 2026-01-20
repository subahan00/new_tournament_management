import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Crown, Instagram, Send, Users } from 'lucide-react';

const Footer = () => (
  <footer className="relative modern-footer overflow-hidden mt-20">
    <div className="absolute inset-0 modern-footer-bg"></div>
    <div className="modern-accent-line"></div>
    <div className="relative container mx-auto px-6 py-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
        <div className="md:col-span-1 md:text-left">
          <h4 className="modern-footer-title">Quick Links</h4>
          <ul className="space-y-4">
            {[
              { label: 'Tournaments', href: '#tournaments', isScroll: true },
              { label: 'Standings', href: '/standings' },
              { label: 'Rules', href: '/rules' },
              { label: 'Discord', href: '#discord', isScroll: true },
              { label: 'Support', href: '/support' }
            ].map((link) => (
              <li key={link.label}>
                {link.isScroll ? (
                  <a href={link.href} className="modern-footer-link group">
                    <Zap size={14} className="opacity-70 group-hover:opacity-100 group-hover:text-gold-400 transition-all" />
                    <span>{link.label}</span>
                  </a>
                ) : (
                  <Link to={link.href} className="modern-footer-link group">
                    <Zap size={14} className="opacity-70 group-hover:opacity-100 group-hover:text-gold-400 transition-all" />
                    <span>{link.label}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-1 flex flex-col items-center order-first md:order-none">
          <div className="relative mb-6">
            <div className="absolute -inset-3 rounded-full modern-glow"></div>
            <Crown size={56} className="relative text-gold-400" />
          </div>
          <p className="text-purple-300 text-sm font-body mb-2">
            © {new Date().getFullYear()} <span className="font-bold text-gold-400 font-title">Official_90</span>. All rights reserved.
          </p>
          <p className="text-purple-400 text-xs font-body">
            Forged in the fires of competition ⚔️
          </p>
        </div>

        <div className="md:col-span-1 md:text-right">
          <h4 className="modern-footer-title">Follow The Saga</h4>
          <div className="flex justify-center md:justify-end space-x-4">
            <a 
              href="https://www.instagram.com/official.t90__/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="modern-social-link" 
              title="Instagram"
            >
              <Instagram />
            </a>
            <a 
              href="https://t.me/official_t90x" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="modern-social-link" 
              title="Telegram"
            >
              <Send />
            </a>
            <a 
              href="#discord" 
              className="modern-social-link" 
              title="Community Discord"
            >
              <Users />
            </a>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;