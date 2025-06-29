import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header'; // Adjust path as needed
import Footer from '../components/Footer'; // Adjust path as needed
import { Swords, GitMerge, BarChart3, Award, Zap, Users, ShieldQuestion } from 'lucide-react'; // Added Users, ShieldQuestion

const ViewPage = () => {
  const options = [
    { label: "View Tournaments", icon: <Swords className="w-8 h-8 md:w-10 md:h-10" />, path: "/competitions", special: false },
    { label: "Knockout Fixtures", icon: <GitMerge className="w-8 h-8 md:w-10 md:h-10" />, path: "/public-ko", special: false },
    { label: "League Standings", icon: <BarChart3 className="w-8 h-8 md:w-10 md:h-10" />, path: "/standings", special: false },
    { label: "Trophy Cabinet", icon: <Award className="w-8 h-8 md:w-10 md:h-10" />, path: "/trophy-cabinet", special: false },
    { label: "Player Directory", icon: <Users className="w-8 h-8 md:w-10 md:h-10" />, path: "#", special: false }, // Improvised option
    { label: "FAQs & Support", icon: <ShieldQuestion className="w-8 h-8 md:w-10 md:h-10" />, path: "", special: false }, // Improvised option
    { label: "JOIN THIS CLASH", icon: <Zap className="w-10 h-10 md:w-12 md:h-12" />, path: "/", special: true },
  ];


  return (
    
<div className="min-h-screen flex flex-col stylish-gaming-bg text-white font-sans">
      <main className="flex-grow container mx-auto px-4 sm:px-6 py-12 md:py-20 relative z-10">
        <div className="text-center mb-12 md:mb-16 relative">
          {/* Re-using the hero glow concept */}
          <div className="absolute inset-x-0 -top-24 md:-top-40 h-72 md:h-[500px] bg-radial-gradient-hero pointer-events-none opacity-70"></div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight relative">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#ffc107] via-[#ffab00] to-[#e65100]">EXPLORE</span> THE ARENA
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-300 max-w-2xl mx-auto relative">
            Dive into the heart of the competition. Your next challenge awaits.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {options.map((opt) => (
            <Link
              to={opt.path}
              key={opt.label}
              className={`
                group relative rounded-xl overflow-hidden border-2 transition-all duration-300 ease-in-out transform focus:outline-none 
                ${opt.special
                  ? 'sm:col-span-2 lg:col-span-3 text-black py-10 md:py-14 bg-gradient-to-br from-[#ffc107] via-[#ffab00] to-[#e65100] hover:from-[#ffab00] hover:via-[#ffc107] hover:to-[#ff8f00] border-[#ffc107]/50 hover:border-[#ffab00] shadow-2xl hover:shadow-[#ffc107]/50 hover:scale-[1.02] focus:ring-4 focus:ring-[#ffab00]/60'
                  : 'text-white py-8 bg-[#0d1b2a]/70 hover:bg-[#101c30]/80 border-[#1a237e]/50 hover:border-[#ffc107]/70 shadow-lg hover:shadow-[#0d1b2a]/40 hover:scale-105 focus:ring-4 focus:ring-[#ffc107]/50 backdrop-blur-[3px]'
                }
                flex flex-col items-center justify-center text-center p-4 md:p-6 
              `}
            >
              {/* Icon with its own flair */}
              <div className={`relative mb-3 md:mb-4 transition-transform duration-300 group-hover:scale-110
                ${opt.special ? 'text-black drop-shadow-lg' : 'text-[#ffc107] group-hover:text-[#ffab00]'}`}>
                {/* Optional subtle glow for icons */}
                <div className={`absolute -inset-1.5 md:-inset-2 rounded-full blur-md transition-all duration-300 opacity-0 group-hover:opacity-60
                  ${opt.special ? 'bg-white/20' : 'bg-[#ffc107]/20'}`}>
                </div>
                <span className="relative">{opt.icon}</span>
              </div>
              
              <h3 className={`font-bold tracking-wide leading-tight
                ${opt.special ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'}`}>
                {opt.label}
              </h3>
              
              {/* Shimmer effect for special button on hover */}
              {opt.special && (
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent transform scale-y-150 -skew-x-[30deg] translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-out opacity-80 group-hover:opacity-100"></div>
              )}
              {/* Subtle pattern for non-special cards */}
              {!opt.special && (
                <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity duration-300"
                     style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffc107' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")", backgroundRepeat: 'repeat' }}>
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* Improvised "Stay Connected" Section */}
        <div className="mt-16 md:mt-24 p-6 md:p-8 bg-[#0d1b2a]/60 border-2 border-[#1a237e]/40 rounded-xl shadow-xl backdrop-blur-md text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 text-[#ffc107]">Stay Connected!</h2>
            <p className="text-gray-300 mb-6 max-w-lg mx-auto text-sm md:text-base">
                Follow us on social media and join our community channels to never miss an update on upcoming tournaments and events.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <a href="https://www.instagram.com/official.t90__/" className="w-full sm:w-auto text-center text-[#ffab00] hover:text-black hover:bg-gradient-to-r hover:from-[#ffc107] hover:to-[#ffab00] transition-all duration-300 text-sm md:text-base font-semibold py-2.5 px-5 border-2 border-[#ffab00] rounded-lg transform hover:scale-105">Community Discord</a>
                <a href="https://x.com/officialpes9" className="w-full sm:w-auto text-center text-[#ffab00] hover:text-black hover:bg-gradient-to-r hover:from-[#ffc107] hover:to-[#ffab00] transition-all duration-300 text-sm md:text-base font-semibold py-2.5 px-5 border-2 border-[#ffab00] rounded-lg transform hover:scale-105">Follow on X</a>
            </div>
        </div>
      </main>
      <Footer />

      {/* IMPORTANT: CSS for .stylish-gaming-bg and .bg-radial-gradient-hero 
          If these are not in a global CSS file, you need to define them here.
          For example, if they were defined in Home.jsx's <style jsx>, you'd copy those definitions here.
      */}
      <style jsx>{`
        /* If .stylish-gaming-bg and .bg-radial-gradient-hero are not global, define them here: */
        .stylish-gaming-bg {
          background: linear-gradient(180deg, #0d1b2a 0%, #020408 100%);
          position: relative;
          overflow: hidden;
        }

        .stylish-gaming-bg::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image:
            linear-gradient(rgba(255, 193, 7, 0.035) 0.5px, transparent 0.5px),
            linear-gradient(90deg, rgba(255, 193, 7, 0.035) 0.5px, transparent 0.5px);
          background-size: 35px 35px;
          mask-image: radial-gradient(ellipse 90% 60% at 50% 10%, black 10%, transparent 70%);
        }

        .bg-radial-gradient-hero {
          background: radial-gradient(ellipse at center top, 
            rgba(26, 35, 126, 0.25) 0%, /* Indigo #1a237e */
            rgba(255, 193, 7, 0.08) 35%,  /* Gold #ffc107 */
            transparent 75%
          );
          /* Opacity and filter are applied directly in the className now */
          /* transform is also applied directly in className for hero glow */
        }

        /* You can add more component-specific styles here if needed */
      `}</style>
    </div>
  );
};

export default ViewPage;
