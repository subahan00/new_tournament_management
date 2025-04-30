import { FaInstagram, FaTelegramPlane } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-black text-yellow-400 py-10 border-t border-yellow-600 shadow-inner shadow-yellow-800/30">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-0">

          {/* Brand Section */}
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold tracking-wide text-yellow-300">
              Official_90
            </h3>
            <p className="text-yellow-500 mt-1 text-sm">
              The ultimate football gaming experience
            </p>
          </div>

          {/* Navigation Links */}
          <div className="flex space-x-6 text-sm font-medium">
            {['Terms', 'Privacy', 'Contact'].map((item, idx) => (
              <a
                key={idx}
                href="#"
                className="relative group hover:text-yellow-300 transition"
              >
                {item}
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-yellow-300 transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          {/* Social Links */}
          <div className="flex space-x-5 text-2xl">
            <a
              href="https://www.instagram.com/your_username"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-pink-400 hover:scale-110 transition-transform duration-300"
              title="Instagram"
            >
              <FaInstagram />
            </a>
            <a
              href="https://t.me/your_username"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-400 hover:scale-110 transition-transform duration-300"
              title="Telegram"
            >
              <FaTelegramPlane />
            </a>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-8 text-center text-yellow-600 text-xs">
          © {new Date().getFullYear()} <span className="font-semibold text-yellow-400">Official_90</span>. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
