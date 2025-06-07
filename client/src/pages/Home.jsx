import Header from '../components/Header';
import Footer from '../components/Footer';
import { useEffect, useState } from 'react';
import { X, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';
export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    whatsapp: '',
    club: '',
    age: '',
    location: '',
    playingSince: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
const [showTutorial, setShowTutorial] = useState(true);
const [tutorialStep, setTutorialStep] = useState(0);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/submit`, formData);
      setSubmitted(true);
    } catch (error) {
      console.error('Submission error:', error);
      alert('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ fullName: '', whatsapp: '', club: '', age: '', location: '', playingSince: '' });
    }, 300);
  };

  return (
    <div className="min-h-screen flex flex-col gaming-navy-bg text-white font-sans">
      <div id="pdf-content">
        <Header />

        {/* Floating CTA Button */}
        <div className="fixed bottom-8 right-8 z-50 group">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#ffc107] to-[#ffab00] opacity-40 animate-ping scale-110"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#1a237e] to-[#0d1b2a] opacity-30 animate-ping scale-125 animation-delay-200"></div>
          <div className="absolute -inset-4 pointer-events-none">
            <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-[#ffc107] rounded-full animate-bounce opacity-70"></div>
            <div className="absolute top-1/4 right-0 w-1 h-1 bg-[#ffab00] rounded-full animate-bounce animation-delay-300 opacity-60"></div>
            <div className="absolute bottom-1/4 left-0 w-1 h-1 bg-[#ffc107] rounded-full animate-bounce animation-delay-500 opacity-60"></div>
            <div className="absolute bottom-0 right-1/4 w-1.5 h-1.5 bg-[#1a237e] rounded-full animate-bounce animation-delay-700 opacity-50"></div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="relative px-8 py-4 bg-gradient-to-br from-[#ffc107] via-[#ffab00] to-[#e65100] hover:from-[#ffab00] hover:via-[#ffc107] hover:to-[#ff8f00] text-black rounded-full font-bold text-lg transition-all duration-500 shadow-2xl hover:shadow-[#ffc107]/50 transform hover:-translate-y-2 hover:scale-105 border-2 border-[#ffc107]/80 overflow-hidden group/btn animate-pulse"
            aria-label="Join Our Arena"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
            <div className="absolute inset-0 rounded-full border-2 border-[#1a237e]/30 group-hover/btn:border-[#1a237e]/50 transition-all duration-300"></div>
            <span className="relative z-10 flex items-center gap-2">
              🏆 Join Our Arena
              <span className="inline-block animate-bounce">⚽</span>
            </span>
          </button>
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="bg-gradient-to-r from-[#0d1b2a] to-[#1a237e] backdrop-blur-sm text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap border border-[#ffc107]/40">
              🎮 Join the Ultimate eFootball Experience!
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-[#0d1b2a]"></div>
            </div>
          </div>
        </div>

        {/* Side Elements */}
        <div className="fixed bottom-32 right-8 z-40">
          <div className="bg-gradient-to-r from-[#1a237e] to-[#3f51b5] text-white text-xs px-3 py-1 rounded-full animate-bounce shadow-lg border border-[#ffc107]/60">
            🔥 Limited Spots!
          </div>
        </div>

        <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-40">
          <div className="bg-gradient-to-l from-[#ffc107] via-[#ffab00] to-transparent text-black font-bold text-sm px-6 py-2 transform rotate-90 origin-right shadow-lg border-t border-[#1a237e]/20">
            ⭐ JOIN NOW ⭐
          </div>
        </div>

        <main className="flex-grow container mx-auto px-6 pt-28 pb-16 sm:pt-32 relative z-10">
          <section className="text-center">
            <div className="relative mb-16 md:mb-24">
              {/* Hero Background Glow */}
              <div className="absolute inset-x-0 -top-24 md:-top-40 h-72 md:h-[500px] navy-gold-hero-glow pointer-events-none"></div>
              <h1 className="relative text-5xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#ffc107] via-[#ffab00] to-[#e65100] mb-6 tracking-tight leading-tight drop-shadow-2xl">
                Welcome to <span className="bg-gradient-to-r from-white via-gray-200 to-[#e3f2fd] bg-clip-text text-transparent drop-shadow-2xl">Official_90</span>
              </h1>
              <div className="w-32 h-1 bg-gradient-to-r from-[#1a237e] via-[#ffc107] to-[#1a237e] mx-auto mb-8 shadow-lg"></div>
              <p className="text-xl sm:text-2xl text-gray-300 font-light tracking-wide max-w-2xl mx-auto leading-relaxed">
                Experience the pinnacle of football gaming excellence. Your journey to legendary status begins here.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-10 md:gap-12 max-w-6xl mx-auto">
              {/* Tournament Card */}
              <div className="group cursor-pointer">
                <div className="relative rounded-2xl overflow-hidden h-auto min-h-[320px] sm:min-h-[380px] border-2 border-[#1a237e]/40 hover:border-[#ffc107]/80 transition-all duration-700 shadow-2xl hover:shadow-[#ffc107]/30 navy-card-bg backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ffc107]/8 via-[#1a237e]/5 to-[#0d1b2a]/10 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                  <img
                    src="/assets/football.jpg"
                    alt="Weekly football tournaments"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-[.45] group-hover:brightness-[.55]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d1b2a]/85 via-[#1a237e]/50 to-transparent group-hover:from-[#0d1b2a]/75 group-hover:via-[#1a237e]/40 transition-all duration-500" />

                  {/* Corner Decorations */}
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4 w-6 h-6 sm:w-8 sm:h-8 border-l-2 border-t-2 border-[#ffc107]/60 group-hover:border-[#ffc107] transition-colors duration-300"></div>
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 border-r-2 border-t-2 border-[#ffc107]/60 group-hover:border-[#ffc107] transition-colors duration-300"></div>
                  <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 w-6 h-6 sm:w-8 sm:h-8 border-l-2 border-b-2 border-[#ffc107]/60 group-hover:border-[#ffc107] transition-colors duration-300"></div>
                  <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 border-r-2 border-b-2 border-[#ffc107]/60 group-hover:border-[#ffc107] transition-colors duration-300"></div>

                  <div className="relative h-full flex flex-col justify-end items-center p-6 sm:p-8 md:p-10 text-center text-white z-10">
                    <div className="mb-4">
                      <div className="w-12 h-1 bg-gradient-to-r from-[#ffc107] to-[#ffab00] mx-auto mb-3 sm:mb-4 shadow-lg"></div>
                      <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4 tracking-wider text-[#ffc107] group-hover:text-[#ffab00] transition-colors duration-300 drop-shadow-lg">
                        WEEKLY TOURNAMENTS
                      </h2>
                      <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-[#1a237e]/80 to-transparent mx-auto mb-3 sm:mb-4"></div>
                    </div>
                    <p className="text-base sm:text-lg font-medium max-w-sm leading-relaxed text-gray-200 mb-6">
                      Compete against elite players for prestigious prizes every weekend.
                    </p>
                    <div className="flex justify-center w-full mt-auto">
                      <Link
                        to="/view" // Navigate to the new page
                        className="relative px-8 py-3 w-full max-w-[280px] bg-gradient-to-br from-[#ffc107] via-[#ffab00] to-[#e65100] hover:from-[#ffab00] hover:via-[#ffc107] hover:to-[#ff8f00] text-black rounded-full font-bold text-lg transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-[#ffc107]/50 transform hover:-translate-y-1 border-2 border-[#1a237e]/40 hover:border-[#1a237e]/70 overflow-hidden group/btn focus:outline-none focus:ring-4 focus:ring-[#ffab00]/50"
                      >
                        <span className="relative z-10">View Tournaments</span>

                      </Link>

                    </div>
                  </div>
                </div>
              </div>

              {/* Leaderboard Card */}
              <div className="group cursor-pointer">
                <div className="relative rounded-2xl overflow-hidden h-auto min-h-[320px] sm:min-h-[380px] border-2 border-[#1a237e]/40 hover:border-[#ffc107]/80 transition-all duration-700 shadow-2xl hover:shadow-[#ffc107]/30 navy-card-bg backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ffc107]/8 via-[#1a237e]/5 to-[#0d1b2a]/10 opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                  <img
                    src="/assets/social.jpg"
                    alt="Live leaderboards"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-[.45] group-hover:brightness-[.55]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d1b2a]/85 via-[#1a237e]/50 to-transparent group-hover:from-[#0d1b2a]/75 group-hover:via-[#1a237e]/40 transition-all duration-500" />

                  {/* Corner Decorations */}
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4 w-6 h-6 sm:w-8 sm:h-8 border-l-2 border-t-2 border-[#ffc107]/60 group-hover:border-[#ffc107] transition-colors duration-300"></div>
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 border-r-2 border-t-2 border-[#ffc107]/60 group-hover:border-[#ffc107] transition-colors duration-300"></div>
                  <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 w-6 h-6 sm:w-8 sm:h-8 border-l-2 border-b-2 border-[#ffc107]/60 group-hover:border-[#ffc107] transition-colors duration-300"></div>
                  <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 border-r-2 border-b-2 border-[#ffc107]/60 group-hover:border-[#ffc107] transition-colors duration-300"></div>

                  <div className="relative h-full flex flex-col justify-end items-center p-6 sm:p-8 md:p-10 text-center text-white z-10">
                    <div className="mb-4">
                      <div className="w-12 h-1 bg-gradient-to-r from-[#ffc107] to-[#ffab00] mx-auto mb-3 sm:mb-4 shadow-lg"></div>
                      <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4 tracking-wider text-[#ffc107] group-hover:text-[#ffab00] transition-colors duration-300 drop-shadow-lg">
                       HD FOOTBALL WALLPAPERS
                      </h2>
                      <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-[#1a237e]/80 to-transparent mx-auto mb-3 sm:mb-4"></div>
                    </div>
                    <p className="text-base sm:text-lg font-medium max-w-sm leading-relaxed text-gray-200 mb-6">
                      Download exclusive high-definition football wallpapers for your devices.
                    </p>
                    <div className="flex justify-center w-full mt-auto">
                      <Link
                        to="/wallpaper" // Navigate to the new page
                        className="relative px-8 py-3 w-full max-w-[280px] bg-gradient-to-br from-[#ffc107] via-[#ffab00] to-[#e65100] hover:from-[#ffab00] hover:via-[#ffc107] hover:to-[#ff8f00] text-black rounded-full font-bold text-lg transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-[#ffc107]/50 transform hover:-translate-y-1 border-2 border-[#1a237e]/40 hover:border-[#1a237e]/70 overflow-hidden group/btn focus:outline-none focus:ring-4 focus:ring-[#ffab00]/50"
                      >
                        <span className="relative z-10">View Wallpapers</span>

                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Divider */}
            <div className="my-20 md:my-24 flex justify-center">
              <div className="flex items-center space-x-4">
                <div className="w-12 sm:w-16 h-0.5 bg-gradient-to-r from-transparent to-[#1a237e]"></div>
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#ffc107] rotate-45 shadow-lg"></div>
                <div className="w-20 sm:w-24 h-0.5 bg-gradient-to-r from-[#1a237e] to-[#ffc107]"></div>
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#1a237e] rotate-45 shadow-lg"></div>
                <div className="w-12 sm:w-16 h-0.5 bg-gradient-to-l from-transparent to-[#ffc107]"></div>
              </div>
            </div>
          </section>
        </main>

        <Footer />

        {/* Registration Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-gradient-to-br from-black/80 via-[#0d1b2a]/90 to-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="navy-form-bg rounded-2xl border-2 border-[#ffc107]/80 max-w-md w-full p-6 relative shadow-2xl shadow-[#1a237e]/30 animate-slideInUp">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#ffc107] via-[#ffab00] to-[#1a237e] rounded-[18px] blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              <button
                onClick={handleCloseForm}
                className="absolute top-4 right-4 text-[#ffc107] hover:text-[#ffab00] transition-colors z-20 p-1 rounded-md hover:bg-[#1a237e]/20"
                aria-label="Close form"
              >
                <X size={24} />
              </button>
              {!submitted ? (
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-[#ffc107] to-[#ffab00] bg-clip-text text-transparent">
                    🏆 Join Our Arena
                  </h2>
                  <p className="text-center text-gray-300 mb-6 text-sm">
                    Become part of the ultimate eFootball community!
                  </p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {[
                      { name: 'fullName', label: 'Full Name', type: 'text', icon: '👤' },
                      { name: 'whatsapp', label: 'WhatsApp Number', type: 'tel', icon: '📱' },
                      { name: 'club', label: 'Club You Support', type: 'text', icon: '⚽' },
                      { name: 'age', label: 'Age', type: 'number', icon: '🎂' },
                      { name: 'location', label: 'Where Are You From', type: 'text', icon: '📍' },
                      { name: 'playingSince', label: 'Playing eFootball Since', type: 'text', icon: '🎮' },
                    ].map((field) => (
                      <div key={field.name} className="relative">
                        <label htmlFor={field.name} className="block text-sm text-gray-300 mb-1.5 flex items-center gap-2">
                          <span>{field.icon}</span>
                          {field.label}
                        </label>
                        <input
                          type={field.type}
                          id={field.name}
                          name={field.name}
                          value={formData[field.name]}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2.5 bg-[#0d1b2a]/80 border border-[#1a237e]/60 rounded-lg text-white focus:outline-none focus:border-[#ffc107] focus:ring-2 focus:ring-[#ffc107]/40 focus:shadow-lg focus:shadow-[#ffc107]/20 transition-all duration-300 placeholder-gray-500 hover:border-[#1a237e]/80"
                          placeholder={`Enter your ${field.label.toLowerCase()}`}
                        />
                      </div>
                    ))}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-gradient-to-br from-[#ffc107] via-[#ffab00] to-[#e65100] hover:from-[#ffab00] hover:via-[#ffc107] hover:to-[#ff8f00] text-black font-bold rounded-lg transition-all duration-300 mt-6 flex items-center justify-center transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed border border-[#1a237e]/20"
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <Loader2 className="animate-spin mr-2" size={20} />
                          Submitting...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          🚀 Submit Application
                        </span>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="text-center py-8 relative z-10">
                  <CheckCircle className="text-green-400 mx-auto mb-4 animate-bounce" size={48} />
                  <h3 className="text-xl font-bold bg-gradient-to-r from-[#ffc107] to-[#ffab00] bg-clip-text text-transparent mb-2">
                    🎉 Thank You for Applying!
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Kindly wait for admin response. We'll contact you via WhatsApp.
                  </p>
                  <p className="text-gray-300">
                    Make sure to follow our page: {' '}
                    <a
                      href="https://instagram.com/official_90"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#ffc107] hover:text-[#ffab00] hover:underline font-semibold transition-colors"
                    >
                      📸 @official_90 on Instagram
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .gaming-navy-bg {
          background: linear-gradient(135deg, 
            #020408 0%, 
            #0d1b2a 25%, 
            #1a237e 50%, 
            #0d1b2a 75%, 
            #020408 100%
          );
          position: relative;
          overflow: hidden;
        }

        .gaming-navy-bg::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image:
            linear-gradient(rgba(255, 193, 7, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(26, 35, 126, 0.06) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(ellipse 85% 70% at 50% 20%, black 15%, transparent 75%);
          animation: subtleGridPulse 8s infinite ease-in-out;
        }

        .gaming-navy-bg::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(ellipse 60% 40% at 50% 0%, 
            rgba(26, 35, 126, 0.15) 0%, 
            rgba(255, 193, 7, 0.05) 40%, 
            transparent 70%
          );
          pointer-events: none;
        }

        .navy-card-bg {
          background: linear-gradient(145deg,
            rgba(13, 27, 42, 0.85) 0%,
            rgba(26, 35, 126, 0.25) 50%,
            rgba(13, 27, 42, 0.85) 100%
          );
        }

        .navy-form-bg {
          background: linear-gradient(145deg,
            rgba(13, 27, 42, 0.95) 0%,
            rgba(26, 35, 126, 0.85) 25%,
            rgba(13, 27, 42, 0.95) 75%,
            rgba(2, 4, 8, 0.98) 100%
          );
        }

        .navy-gold-hero-glow {
          background: radial-gradient(ellipse 90% 60% at center top, 
            rgba(26, 35, 126, 0.3) 0%,
            rgba(255, 193, 7, 0.12) 35%,
            rgba(13, 27, 42, 0.2) 60%,
            transparent 80%
          );
          filter: blur(40px);
          transform: scaleY(0.8) translateY(-15%);
          animation: heroGlow 6s infinite ease-in-out alternate;
        }

        @keyframes subtleGridPulse {
          0% { 
            opacity: 0.6; 
            mask-image: radial-gradient(ellipse 85% 70% at 50% 20%, black 15%, transparent 75%);
          }
          50% { 
            opacity: 0.9; 
            mask-image: radial-gradient(ellipse 90% 75% at 50% 25%, black 20%, transparent 80%);
          }
          100% { 
            opacity: 0.6; 
            mask-image: radial-gradient(ellipse 85% 70% at 50% 20%, black 15%, transparent 75%);
          }
        }

        @keyframes heroGlow {
          0% { 
            opacity: 0.7; 
            transform: scaleY(0.8) translateY(-15%) scaleX(1);
          }
          100% { 
            opacity: 1; 
            transform: scaleY(0.9) translateY(-10%) scaleX(1.05);
          }
        }

        @keyframes slideInUp {
          from {
            transform: translateY(50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slideInUp {
          animation: slideInUp 0.4s ease-out forwards;
        }
        
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-300 { animation-delay: 0.3s; }
        .animation-delay-500 { animation-delay: 0.5s; }
        .animation-delay-700 { animation-delay: 0.7s; }
      `}</style>
      
    </div>
  );
}