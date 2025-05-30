import Header from '../components/Header';
import Footer from '../components/Footer';
import { useEffect } from 'react';
import { useState } from 'react'; 
import { X,CheckCircle   } from 'lucide-react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Replace with your actual API endpoint
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/submit`, formData);
      setSubmitted(true);
    } catch (error) {
      console.error('Submission error:', error);
      alert('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0d1b2a] via-[#1a237e] to-[#0d1b2a] text-white font-sans">
      <div id="pdf-content">
        <Header />
        {/*join arena */}
              <div className="fixed bottom-8 right-8 z-50">
          {/* Pulsing ring animation */}
          <div className="absolute inset-0 rounded-full bg-[#ffc107] opacity-30 animate-ping scale-110"></div>
          <div className="absolute inset-0 rounded-full bg-[#ffc107] opacity-20 animate-ping scale-125 animation-delay-200"></div>
          
          {/* Floating particles effect */}
          <div className="absolute -inset-4 pointer-events-none">
            <div className="absolute top-0 left-1/2 w-1 h-1 bg-[#ffc107] rounded-full animate-bounce opacity-60"></div>
            <div className="absolute top-1/4 right-0 w-1 h-1 bg-[#ffab00] rounded-full animate-bounce animation-delay-300 opacity-60"></div>
            <div className="absolute bottom-1/4 left-0 w-1 h-1 bg-[#ffc107] rounded-full animate-bounce animation-delay-500 opacity-60"></div>
            <div className="absolute bottom-0 right-1/4 w-1 h-1 bg-[#ffab00] rounded-full animate-bounce animation-delay-700 opacity-60"></div>
          </div>
          
          {/* Main button with enhanced effects */}
          <button 
            onClick={() => setShowForm(true)}
            className="relative px-8 py-4 bg-gradient-to-r from-[#ffab00] to-[#ffc107] hover:from-[#ffc107] hover:to-[#ffab00] text-black rounded-full font-bold text-lg transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-[#ffc107]/60 transform hover:-translate-y-2 hover:scale-105 border-2 border-[#ffc107] overflow-hidden group/btn animate-pulse"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
            
            {/* Glowing border effect */}
            <div className="absolute inset-0 rounded-full border-2 border-white/20 group-hover/btn:border-white/40 transition-all duration-300"></div>
            
            {/* Button content */}
            <span className="relative z-10 flex items-center gap-2">
              🏆 Join Our Arena
              <span className="inline-block animate-bounce">⚽</span>
            </span>
          </button>
          
          {/* Tooltip/Call-to-action */}
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="bg-black/80 backdrop-blur-sm text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap border border-[#ffc107]/30">
              🎮 Join the Ultimate eFootball Experience!
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/80"></div>
            </div>
          </div>
        </div>

        {/* Additional floating notification badge */}
        <div className="fixed bottom-32 right-8 z-40">
          <div className="bg-red-500 text-white text-xs px-3 py-1 rounded-full animate-bounce shadow-lg border border-red-400">
            🔥 Limited Spots!
          </div>
        </div>

        {/* Attention-grabbing side banner */}
        <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-40">
          <div className="bg-gradient-to-l from-[#ffc107] to-transparent text-black font-bold text-sm px-6 py-2 transform rotate-90 origin-right shadow-lg">
            ⭐ JOIN NOW ⭐
          </div>
        </div>
        <main className="flex-grow container mx-auto px-6 py-20">
          <section className="text-center">
            {/* Hero Section */}
            <div className="relative mb-16">
              <div className="absolute inset-0 bg-gradient-to-r from-[#ffc107]/10 via-transparent to-[#ffc107]/10 blur-3xl"></div>
              <h1 className="relative text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ffab00] via-[#ffc107] to-[#ffab00] mb-6 tracking-tight leading-tight">
                Welcome to <span className="text-white drop-shadow-2xl">Official_90</span>
              </h1>

              <div className="w-32 h-1 bg-gradient-to-r from-transparent via-[#ffc107] to-transparent mx-auto mb-8"></div>

              <p className="text-2xl text-gray-300 font-light tracking-wide max-w-2xl mx-auto leading-relaxed">
                Experience the pinnacle of football gaming excellence
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* Premium Card 1 */}
              <div className="group cursor-pointer">
                <div className="relative rounded-2xl overflow-hidden h-80 border-2 border-[#ffc107]/20 hover:border-[#ffc107]/60 transition-all duration-700 shadow-2xl hover:shadow-[#ffc107]/20">
                  {/* Luxury border effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ffc107]/5 via-transparent to-[#ffc107]/5"></div>

                  <img
                    src="/assets/football.jpg"
                    alt="Football tournament"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 filter brightness-50"
                  />

                  {/* Premium overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d1b2a]/90 via-[#0d1b2a]/60 to-[#0d1b2a]/40 group-hover:from-[#0d1b2a]/80 group-hover:via-[#0d1b2a]/50 group-hover:to-[#0d1b2a]/30 transition-all duration-500" />

                  {/* Decorative corner accents */}
                  <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[#ffc107]/60"></div>
                  <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[#ffc107]/60"></div>
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-[#ffc107]/60"></div>
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[#ffc107]/60"></div>

                  <div className="relative h-full flex flex-col justify-center items-center p-10 text-center text-white z-10">
                    <div className="mb-4">
                      <div className="w-16 h-1 bg-[#ffc107] mx-auto mb-4"></div>
                      <h2 className="text-4xl font-bold mb-4 tracking-wider text-[#ffc107] group-hover:text-[#ffab00] transition-colors duration-300">
                        WEEKLY TOURNAMENTS
                      </h2>
                      <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent mx-auto mb-4"></div>
                    </div>

                    <p className="text-lg font-medium max-w-sm leading-relaxed text-gray-200 mb-6">
                      Compete against elite players for prestigious prizes every weekend
                    </p>

                    <div className="flex justify-center mt-6"> {/* Added wrapper for centering */}
                      <button className="relative px-8 py-3 w-full max-w-xs bg-gradient-to-r from-[#ffab00] to-[#ffc107] hover:from-[#ffc107] hover:to-[#ffab00] text-black rounded-full font-bold text-lg transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-[#ffc107]/40 transform hover:-translate-y-1 border-2 border-[#ffc107] overflow-hidden group/btn">
                        view tournaments
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Premium Card 2 */}
              <div className="group cursor-pointer">
                <div className="relative rounded-2xl overflow-hidden h-80 border-2 border-[#ffc107]/20 hover:border-[#ffc107]/60 transition-all duration-700 shadow-2xl hover:shadow-[#ffc107]/20">
                  {/* Luxury border effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ffc107]/5 via-transparent to-[#ffc107]/5"></div>

                  <img
                    src="/assets/social.jpg"
                    alt="Leaderboard"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 filter brightness-50"
                  />

                  {/* Premium overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d1b2a]/90 via-[#0d1b2a]/60 to-[#0d1b2a]/40 group-hover:from-[#0d1b2a]/80 group-hover:via-[#0d1b2a]/50 group-hover:to-[#0d1b2a]/30 transition-all duration-500" />

                  {/* Decorative corner accents */}
                  <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[#ffc107]/60"></div>
                  <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[#ffc107]/60"></div>
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-[#ffc107]/60"></div>
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[#ffc107]/60"></div>

                  <div className="relative h-full flex flex-col justify-center items-center p-10 text-center text-white z-10">
                    <div className="mb-4">
                      <div className="w-16 h-1 bg-[#ffc107] mx-auto mb-4"></div>
                      <h2 className="text-4xl font-bold mb-4 tracking-wider text-[#ffc107] group-hover:text-[#ffab00] transition-colors duration-300">
                        LIVE LEADERBOARDS
                      </h2>
                      <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent mx-auto mb-4"></div>
                    </div>

                    <p className="text-lg font-medium max-w-sm leading-relaxed text-gray-200 mb-6">
                      Track your progress, ascend the ranks and achieve legendary status
                    </p>

                    <div className="w-full flex justify-center mt-6">
                      <button className="relative px-8 py-3 bg-gradient-to-r from-[#ffab00] to-[#ffc107] hover:from-[#ffc107] hover:to-[#ffab00] text-black rounded-full font-bold text-lg transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-[#ffc107]/40 hover:-translate-y-1 border-2 border-[#ffc107] overflow-hidden group/btn w-full max-w-xs">
                        <span className="relative z-10">Enter Arena</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Premium decorative element */}
            <div className="mt-20 flex justify-center">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-[#ffc107]"></div>
                <div className="w-3 h-3 bg-[#ffc107] rotate-45"></div>
                <div className="w-24 h-0.5 bg-[#ffc107]"></div>
                <div className="w-3 h-3 bg-[#ffc107] rotate-45"></div>
                <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-[#ffc107]"></div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
         {showForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-[#0d1b2a] to-[#1a237e] rounded-2xl border-2 border-[#ffc107] max-w-md w-full p-6 relative shadow-2xl shadow-[#ffc107]/20 animate-slideInUp">
              {/* Glowing effect around modal */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[#ffc107] to-[#ffab00] rounded-2xl blur opacity-20"></div>
              
              <button 
                onClick={() => {
                  setShowForm(false);
                  setSubmitted(false);
                }}
                className="absolute top-4 right-4 text-[#ffc107] hover:text-[#ffab00] transition-colors z-10"
              >
                <X size={24} />
              </button>
              
              {!submitted ? (
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold text-center mb-2 text-[#ffc107]">
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
                        <label className="block text-gray-300 mb-1 flex items-center gap-2">
                          <span>{field.icon}</span>
                          {field.label}
                        </label>
                        <input
                          type={field.type}
                          name={field.name}
                          value={formData[field.name]}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 bg-gray-800/50 border border-[#ffc107]/30 rounded-lg text-white focus:outline-none focus:border-[#ffc107] focus:shadow-lg focus:shadow-[#ffc107]/20 transition-all duration-300"
                        />
                      </div>
                    ))}
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-gradient-to-r from-[#ffab00] to-[#ffc107] hover:from-[#ffc107] hover:to-[#ffab00] text-black font-bold rounded-lg transition-all duration-500 mt-6 flex items-center justify-center transform hover:scale-105 shadow-lg hover:shadow-xl"
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
                  <CheckCircle className="text-green-500 mx-auto mb-4 animate-bounce" size={48} />
                  <h3 className="text-xl font-bold text-[#ffc107] mb-2">
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
                      className="text-[#ffc107] hover:underline font-semibold"
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
      
      {/* Add custom CSS animations */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slideInUp {
          animation: slideInUp 0.5s ease-out;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-300 {
          animation-delay: 0.3s;
        }
        
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
        
        .animation-delay-700 {
          animation-delay: 0.7s;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
      
  );
}