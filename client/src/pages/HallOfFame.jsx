import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Trophy, Crown, Star, Medal, Zap, Award, Calendar, DollarSign, User, Sparkles, ChevronRight, Eye, X } from 'lucide-react';

const HallOfFame = () => {
  const [winners, setWinners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [showDesktopTip, setShowDesktopTip] = useState(false);

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setShowDesktopTip(window.innerWidth < 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fetch winners data
  useEffect(() => {
    const fetchWinners = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/result`);
        if (!response.ok) throw new Error('Failed to fetch winners');
        const data = await response.json();
        setWinners(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWinners();
  }, []);

  // Floating particles component
  const FloatingParticles = useMemo(() => () => (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {Array.from({ length: 25 }, (_, i) => (
        <div key={i} className="absolute">
          <div
            className={`w-2 h-2 rounded-full ${
              i % 6 === 0 ? 'bg-amber-400' : 
              i % 6 === 1 ? 'bg-yellow-300' : 
              i % 6 === 2 ? 'bg-orange-400' : 
              i % 6 === 3 ? 'bg-amber-300' :
              i % 6 === 4 ? 'bg-purple-400' :
              'bg-blue-300'
            } opacity-60 shadow-lg`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${8 + Math.random() * 6}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`,
              filter: 'blur(0.8px)',
              boxShadow: '0 0 12px currentColor'
            }}
          />
        </div>
      ))}
      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) rotate(0deg) scale(1); 
            opacity: 0.6; 
          }
          25% { 
            transform: translateY(-30px) translateX(15px) rotate(90deg) scale(1.5); 
            opacity: 0.8; 
          }
          50% { 
            transform: translateY(-20px) translateX(-20px) rotate(180deg) scale(0.9); 
            opacity: 1; 
          }
          75% { 
            transform: translateY(-35px) translateX(8px) rotate(270deg) scale(1.2); 
            opacity: 0.7; 
          }
        }
      `}</style>
    </div>
  ), []);

  // Desktop mode tip component
  const DesktopTip = useMemo(() => () => (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ${
      showDesktopTip ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
    }`}>
      <div className="bg-gradient-to-r from-amber-500 to-purple-500 px-6 py-3 rounded-full shadow-xl flex items-center space-x-3 animate-pulse">
        <div className="bg-white/20 rounded-full p-1">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <p className="text-white font-bold text-sm sm:text-base">
          Tip: Switch to <span className="font-black">Desktop Mode</span> for best experience
        </p>
        <ChevronRight className="w-5 h-5 text-white" />
      </div>
    </div>
  ), [showDesktopTip]);

  // Loading screen component
  const LoadingScreen = useMemo(() => () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/30 to-amber-900/40 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.15),rgba(0,0,0,0))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(217,119,6,0.15),transparent_50%)]" />
      <FloatingParticles />
      
      <div className="text-center z-10 relative">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-purple-500 rounded-full blur-2xl opacity-60 animate-pulse" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSg0NSkiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEuNSIgZmlsbD0icmdiYSgxNjgsODUsMjQ3LDAuMSkiIC8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3BhdHRlcm4pIiAvPjwvc3ZnPg==')] opacity-20" />
          <Trophy className="w-24 h-24 text-transparent bg-gradient-to-r from-amber-400 via-yellow-300 to-purple-400 bg-clip-text relative z-10 animate-bounce drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s' }}>
            <Sparkles className="w-8 h-8 text-amber-400 absolute -top-3 -right-3 animate-pulse" />
            <Sparkles className="w-6 h-6 text-yellow-400 absolute -bottom-2 -left-2 animate-pulse" style={{ animationDelay: '0.5s' }} />
            <Crown className="w-7 h-7 text-purple-400 absolute -top-1 -left-3 animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </div>
        
        <div className="text-3xl font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-purple-400 bg-clip-text text-transparent mb-6 tracking-wide drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">
          Loading Hall of Legends...
        </div>
        
        <div className="flex justify-center space-x-3 mb-8">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="w-4 h-4 bg-gradient-to-r from-amber-500 to-purple-500 rounded-full animate-bounce shadow-lg shadow-amber-400/50"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
        
        <div className="w-80 h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner">
          <div className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-purple-500 rounded-full animate-pulse shadow-lg" style={{ width: '75%' }} />
        </div>
      </div>
    </div>
  ), []);

  // Error screen component
  const ErrorScreen = useMemo(() => () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900/30 via-slate-900 to-amber-900/30 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.1),rgba(0,0,0,0))]" />
      <div className="text-center p-8 relative z-10">
        <div className="relative mb-6">
          <div className="absolute -inset-4 bg-gradient-to-r from-amber-500 to-purple-500 rounded-full blur-xl opacity-30 animate-pulse" />
          <Zap className="w-20 h-20 text-amber-400 mx-auto animate-pulse drop-shadow-lg" />
          <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-2xl animate-ping" />
        </div>
        <div className="text-amber-400 text-2xl font-bold mb-3 drop-shadow-[0_0_4px_rgba(245,158,11,0.3)]">Connection to the Legends Failed</div>
        <div className="text-amber-300 text-base font-medium">{error}</div>
      </div>
    </div>
  ), [error]);

  // Rank icon helper
  const getRankIcon = useCallback((index) => {
    const icons = {
      0: <Crown className="w-8 h-8 text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" />,
      1: <Trophy className="w-7 h-7 text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" />,
      2: <Medal className="w-7 h-7 text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
    };
    return icons[index] || <Star className="w-6 h-6 text-amber-300 drop-shadow-[0_0_4px_rgba(245,158,11,0.3)]" />;
  }, []);

  // Rank background helper
  const getRankBg = useCallback((isHovered = false) => {
    const baseClasses = "border transition-all duration-700 transform backdrop-blur-sm";
    const hoverScale = isHovered ? "scale-[1.02] shadow-2xl" : "";
    
    return `${baseClasses} bg-slate-900/60 border-slate-700/60 hover:bg-slate-800/70 ${hoverScale}`;
  }, []);

  // Winners table component
  const WinnersTable = useMemo(() => () => (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/80 to-purple-900/30 backdrop-blur-3xl border border-amber-500/40 shadow-2xl shadow-amber-500/30">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-purple-500/10" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSg0NSkiPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjIiIGZpbGw9InJnYmEoMjQ1LDE1OCwxMSwwLjA1KSIgLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjcGF0dGVybikiIC8+PC9zdmc+')] opacity-20" />
      
      {/* Enhanced Header */}
      <div className="relative bg-gradient-to-r from-slate-800/90 via-purple-900/40 to-slate-800/90 border-b border-amber-500/40 px-4 py-4 md:px-8 md:py-6">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 via-purple-400/10 to-amber-400/10" />
        <div className="grid grid-cols-12 gap-3 items-center text-xs sm:text-base font-black text-amber-200 relative z-10 tracking-wide uppercase">
          <div className="col-span-1 text-center">RANK</div>
          <div className="col-span-3">COMPETITION</div>
          <div className="col-span-3">CHAMPION</div>
          <div className="col-span-2 text-center">DATE</div>
          <div className="col-span-1 text-center">DETAILS</div>
        </div>
      </div>

      {/* Winners List */}
      <div className="divide-y divide-amber-500/20">
        {winners.map((winner, index) => (
          <div 
            key={winner._id}
            className={`grid grid-cols-12 gap-3 items-center px-4 py-4 md:px-8 md:py-6 hover:bg-gradient-to-r hover:from-amber-500/15 hover:to-purple-500/15 transition-all duration-700 group ${getRankBg(hoveredIndex === index)}`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Enhanced Rank */}
            <div className="col-span-1 flex justify-center">
              <div className={`relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl transition-all duration-500 
                bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg shadow-slate-700/40
                group-hover:scale-125 group-hover:rotate-12 border-2 border-amber-500/30`}>
                {getRankIcon(index)}
                <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 to-purple-400 rounded-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 blur-sm" />
              </div>
            </div>

            {/* Competition */}
            <div className="col-span-3">
              <h3 className={`font-black text-base sm:text-xl transition-all duration-500 text-white group-hover:text-amber-300 drop-shadow-[0_0_4px_rgba(0,0,0,0.3)]`}>
                {winner.competitionName}
              </h3>
              <div className="flex items-center mt-1 sm:mt-3">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-3 text-amber-400" />
                <p className="text-amber-300 text-xs sm:text-base font-bold tracking-wide">{winner.season}</p>
              </div>
            </div>

            {/* Champion */}
            <div className="col-span-3">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-125 border-2 
                  bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg shadow-slate-800/50 border-amber-500/30`}>
                  <User className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-md" />
                  <div className="absolute -inset-2 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
                </div>
                <div>
                  <p className="font-black text-white text-base sm:text-xl group-hover:text-amber-300 transition-colors duration-500 tracking-wide drop-shadow-[0_0_4px_rgba(0,0,0,0.3)]">{winner.winnerName}</p>
                  {winner.runnerUp && (
                    <p className="text-slate-400 text-xs sm:text-sm flex items-center mt-1 font-medium">
                      <span className="w-1 h-1 sm:w-2 sm:h-2 bg-amber-500 rounded-full mr-1 sm:mr-3 animate-pulse" />
                      defeated {winner.runnerUp}
                    </p>
                  )}
                </div>
              </div>
            </div>

           

            {/* Date */}
            <div className="col-span-2 text-center">
              <div className="flex items-center justify-center space-x-2 sm:space-x-3 text-slate-300 group-hover:text-amber-300 transition-colors duration-500">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
                <span className="font-bold text-xs sm:text-base">
                  {new Date(winner.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
            </div>

            {/* Action */}
            <div className="col-span-1 text-center">
              <button
                onClick={() => setSelectedWinner(winner)}
                className="group/btn relative p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500/30 to-purple-500/30 border border-amber-500/50 hover:from-amber-500/40 hover:to-purple-500/40 transition-all duration-500 transform hover:scale-125 hover:rotate-6 shadow-lg shadow-amber-500/30"
              >
                <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 group-hover/btn:text-white transition-colors duration-500" />
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-purple-400 rounded-2xl opacity-0 group-hover/btn:opacity-30 transition-opacity duration-500 blur-sm" />
              </button>
            </div>

            {/* Hover Effect Line */}
            <div className="absolute left-0 top-0 w-1 sm:w-2 h-full bg-gradient-to-b from-amber-400 via-purple-400 to-amber-400 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-700 origin-center shadow-lg shadow-amber-400/50" />
          </div>
        ))}
      </div>
    </div>
  ), [winners, getRankIcon, getRankBg, hoveredIndex]);

  // Modal component
  const Modal = useMemo(() => ({ winner, onClose }) => (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900/98 via-purple-900/30 to-slate-900/98 backdrop-blur-3xl rounded-3xl p-6 sm:p-10 max-w-2xl w-full border-2 border-amber-500/50 shadow-2xl shadow-amber-500/40 transform animate-in zoom-in duration-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB3aWR0aD0iODAiIGhlaWdodD0iODAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSg0NSkiPjxjaXJjbGUgY3g9IjQwIiBjeT0iNDAiIHI9IjMuNSIgZmlsbD0icmdiYSgyNDUsMTU4LDExLDAuMDcpIiAvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXR0ZXJuKSIgLz48L3N2Zz4=')] opacity-30" />
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 sm:p-3 rounded-full bg-slate-800/60 hover:bg-slate-700/60 transition-colors duration-300 border border-slate-600/50 z-20"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400 hover:text-white" />
        </button>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 relative z-10">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-amber-500 via-yellow-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-2xl shadow-amber-500/60 border-4 border-amber-300/30">
            <Trophy className="w-12 h-12 sm:w-14 sm:h-14 text-white drop-shadow-lg" />
            <div className="absolute -inset-3 bg-gradient-to-r from-amber-400 to-purple-400 rounded-full opacity-30 animate-pulse" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-gradient-to-r from-amber-400 via-yellow-300 to-purple-400 bg-clip-text mb-2 sm:mb-3 tracking-wide drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]">
            {winner.winnerName}
          </h2>
          <p className="text-amber-300 font-bold text-lg sm:text-xl tracking-wide drop-shadow-[0_0_4px_rgba(0,0,0,0.3)]">{winner.competitionName}</p>
        </div>
        
        {/* Details */}
        <div className="space-y-4 sm:space-y-5 mb-6 sm:mb-8 relative z-10">
          {[
            { label: 'Season', value: winner.season, icon: Award },
            { label: 'Date', value: new Date(winner.date).toLocaleDateString(), icon: Calendar },
            ...(winner.runnerUp ? [{ label: 'Defeated', value: winner.runnerUp, icon: User }] : [])
          ].map(({ label, value, icon: Icon, special }) => (
            <div key={label} className="flex justify-between items-center p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-800/60 border border-slate-700/50 shadow-lg backdrop-blur-sm">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${special ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="text-slate-400 font-bold text-base sm:text-lg">{label}:</span>
              </div>
              <span className={`font-black text-lg sm:text-xl ${special ? 'text-amber-400' : 'text-white'} tracking-wide`}>{value}</span>
            </div>
          ))}
        </div>
        
        {/* Description */}
        {winner.description && (
          <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-500/20 to-purple-500/20 rounded-2xl border border-amber-500/40 mb-6 shadow-lg shadow-amber-500/30 relative z-10">
            <p className="text-slate-300 italic text-center leading-relaxed text-base sm:text-lg font-medium">"{winner.description}"</p>
          </div>
        )}
      </div>
    </div>
  ), []);

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-amber-900/30 relative overflow-hidden">
      {/* Desktop mode tip */}
      <DesktopTip />
      
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(245,158,11,0.2),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.2),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.15),transparent_70%)]" />
      <div className="absolute inset-0 bg-[conic-gradient(from_90deg_at_50%_50%,transparent,rgba(245,158,11,0.1),transparent)]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgcGF0dGVyblRyYW5zZm9ybT0icm90YXRlKDQ1KSI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iMiIgZmlsbD0icmdiYSgyNDUsMTU4LDExLDAuMDUpIiAvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXR0ZXJuKSIgLz48L3N2Zz4=')] opacity-10" />
      
      <FloatingParticles />
      
      {/* Enhanced Header */}
      <div className="relative z-10 pt-16 pb-12 px-4 sm:pt-20 sm:pb-16">
        <div className="max-w-7xl mx-auto text-center">
          <div className="relative mb-6 sm:mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-purple-400 rounded-full blur-3xl opacity-40 animate-pulse" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgcGF0dGVyblRyYW5zZm9ybT0icm90YXRlKDQ1KSI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iMyIgZmlsbD0icmdiYSgyNDUsMTU4LDExLDAuMSkiIC8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3BhdHRlcm4pIiAvPjwvc3ZnPg==')] opacity-30" />
            <Trophy className="w-24 h-24 sm:w-28 sm:h-28 text-transparent bg-gradient-to-r from-amber-400 via-yellow-300 to-purple-400 bg-clip-text mx-auto relative z-10 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
            <div className="absolute -inset-6 animate-spin" style={{ animationDuration: '12s' }}>
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 absolute -top-3 -right-3 animate-pulse" />
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 absolute -bottom-2 -left-2 animate-pulse" style={{ animationDelay: '0.8s' }} />
              <Crown className="w-7 h-7 sm:w-9 sm:h-9 text-purple-400 absolute -top-1 -left-3 animate-pulse" style={{ animationDelay: '1.6s' }} />
              <Medal className="w-7 h-7 sm:w-8 sm:h-8 text-amber-500 absolute -bottom-1 -right-1 animate-pulse" style={{ animationDelay: '2.4s' }} />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-gradient-to-r from-amber-400 via-yellow-300 to-purple-400 bg-clip-text mb-4 sm:mb-6 tracking-tight drop-shadow-[0_0_15px_rgba(0,0,0,0.7)]">
            HALL OF LEGENDS
          </h1>
          
          <p className="text-xl sm:text-2xl text-amber-200 font-bold mb-3 sm:mb-4 tracking-wide drop-shadow-[0_0_4px_rgba(0,0,0,0.3)]">
            Where Champions Rise to Immortality
          </p>
          
          <div className="flex justify-center items-center space-x-3 sm:space-x-4 text-slate-400">
            <div className="w-12 sm:w-16 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
            <Star className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 animate-pulse drop-shadow-[0_0_4px_rgba(245,158,11,0.3)]" />
            <span className="text-sm sm:text-base font-semibold tracking-wider text-amber-300">ETERNAL GLORY</span>
            <Star className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 animate-pulse drop-shadow-[0_0_4px_rgba(245,158,11,0.3)]" />
            <div className="w-12 sm:w-16 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 px-4 pb-16 sm:pb-20">
        <div className="max-w-7xl mx-auto">
          <WinnersTable />
        </div>
      </div>
      
      {/* Modal */}
      {selectedWinner && (
        <Modal winner={selectedWinner} onClose={() => setSelectedWinner(null)} />
      )}
      
      {/* Enhanced Footer */}
      <div className="relative z-10 mt-12 sm:mt-16 py-6 sm:py-8 border-t border-amber-500/30">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 drop-shadow-[0_0_4px_rgba(245,158,11,0.3)]" />
            <span className="text-amber-300 font-bold tracking-wide text-sm sm:text-base drop-shadow-[0_0_2px_rgba(0,0,0,0.3)]">Where legends are born and glory lives forever</span>
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 drop-shadow-[0_0_4px_rgba(245,158,11,0.3)]" />
          </div>
          <p className="text-slate-500 text-xs sm:text-sm">
            © 2025 Hall of Legends. All achievements etched in digital gold.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HallOfFame;