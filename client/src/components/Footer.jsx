import React from 'react';
import { FaInstagram, FaTelegramPlane } from 'react-icons/fa';
import { Trophy, Crown, Shield, Star } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="relative bg-gradient-to-t from-[#0d1b2a] via-[#1a237e] to-[#0d1b2a] border-t-2 border-[#ffc107]/30 overflow-hidden">
      {/* Premium top accent - now full golden */}
      <div className="h-1 bg-gradient-to-r from-[#ffab00] via-[#ffc107] to-[#ffab00]"></div>
      
      {/* Decorative background elements - reduced size */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-6 left-6 text-4xl text-[#ffc107]">
          <Trophy />
        </div>
        <div className="absolute bottom-6 right-6 text-5xl text-[#ffc107]">
          <Crown />
        </div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-7xl text-[#ffc107]">
          <Star />
        </div>
      </div>

      <div className="relative container mx-auto px-4 py-8"> {/* Reduced padding */}
        <div className="grid md:grid-cols-3 gap-6 items-center"> {/* Reduced gap */}
          
          {/* Premium Brand Section - compact */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-2 mb-3"> {/* Reduced space */}
              <div className="relative">
                <div className="absolute inset-0 bg-[#ffc107]/30 rounded-full blur-md"></div> {/* Reduced blur */}
                <Trophy size={24} className="relative text-[#ffc107]" /> {/* Smaller icon */}
              </div>
              <div>
                <h3 className="text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#ffab00] via-[#ffc107] to-[#ffab00]"> {/* Smaller text */}
                  Official_90
                </h3>
                <div className="w-full h-0.5 bg-gradient-to-r from-[#ffab00] via-[#ffc107] to-[#ffab00] mt-1"></div>
              </div>
            </div>
            <p className="text-gray-300 text-sm font-light leading-relaxed max-w-xs mx-auto md:mx-0"> {/* Smaller text */}
              The pinnacle of football gaming excellence
            </p>
            
            {/* Premium decorative element - compact */}
            <div className="flex items-center justify-center md:justify-start space-x-1 mt-3"> {/* Reduced space */}
              <div className="w-6 h-0.5 bg-gradient-to-r from-transparent to-[#ffc107]"></div>
              <Shield size={14} className="text-[#ffc107]" /> {/* Smaller icon */}
              <div className="w-6 h-0.5 bg-gradient-to-l from-transparent to-[#ffc107]"></div>
            </div>
          </div>

         

          {/* Premium Social Links - compact */}
          <div className="text-center md:text-right">
            <h4 className="text-[#ffc107] text-lg font-bold mb-4 tracking-wide">Connect With Us</h4> {/* Smaller heading */}
            <div className="flex justify-center md:justify-end space-x-4"> {/* Reduced spacing */}
              <a
                href="https://www.instagram.com/official.t90__/"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative p-3 rounded-lg border border-[#ffc107]/30 hover:border-pink-400 bg-gradient-to-br from-[#ffc107]/5 to-transparent hover:from-pink-500/20 hover:to-purple-500/20 transition-all duration-500 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-pink-500/20" /* Smaller padding */
                title="Instagram"
              >
                <FaInstagram className="text-2xl text-[#ffc107] group-hover:text-pink-400 transition-colors duration-300" /> {/* Smaller icon */}
              </a>
              
              <a
                href="https://t.me/official_t90x"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative p-3 rounded-lg border border-[#ffc107]/30 hover:border-blue-400 bg-gradient-to-br from-[#ffc107]/5 to-transparent hover:from-blue-500/20 hover:to-cyan-500/20 transition-all duration-500 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/20" /* Smaller padding */
                title="Telegram"
              >
                <FaTelegramPlane className="text-2xl text-[#ffc107] group-hover:text-blue-400 transition-colors duration-300" /> {/* Smaller icon */}
              </a>
            </div>
            
            {/* Premium call-to-action - compact */}
            <div className="mt-4 p-3 bg-gradient-to-r from-[#ffc107]/10 via-transparent to-[#ffc107]/10 rounded border border-[#ffc107]/20"> {/* Reduced padding */}
              <p className="text-gray-300 text-xs font-light"> {/* Smaller text */}
                Join our elite community
              </p>
            </div>
          </div>
        </div>

        {/* Premium Footer Bottom - compact */}
        <div className="mt-8 pt-6 border-t border-[#ffc107]/20"> {/* Reduced padding */}
          <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0"> {/* Reduced spacing */}
            <div className="text-center md:text-left">
              <p className="text-gray-400 text-xs"> {/* Smaller text */}
                © {currentYear} <span className="font-bold text-[#ffc107]">Official_90</span>. All rights reserved.
              </p>
              <p className="text-gray-500 text-2xs mt-0.5"> {/* Smaller text */}
                Crafted for ultimate gaming experience
              </p>
            </div>
            
            {/* Premium badge - compact */}
            <div className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-[#ffc107]/20 to-[#ffab00]/20 rounded-full border border-[#ffc107]/30"> {/* Reduced padding */}
              <Crown size={12} className="text-[#ffc107]" /> {/* Smaller icon */}
              <span className="text-[#ffc107] text-xs font-bold tracking-tight">PREMIUM</span> {/* Smaller text */}
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom accent line - full golden */}
      <div className="h-1 bg-gradient-to-r from-[#ffab00] via-[#ffc107] to-[#ffab00]"></div>
    </footer>
  );
}