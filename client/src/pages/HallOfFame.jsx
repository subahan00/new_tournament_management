import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Trophy, Crown, Star, Medal, Zap, Award, Calendar, DollarSign, User, Sparkles, ChevronRight, Eye, X } from 'lucide-react';

const HallOfFame = () => {
  const [winners, setWinners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
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

  const FloatingParticles = useMemo(() => () => (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {Array.from({ length: 20 }, (_, i) => (
        <div key={i} className="absolute">
          <div
            className={`w-2 h-2 rounded-full ${
              i % 5 === 0 ? 'bg-amber-400' : 
              i % 5 === 1 ? 'bg-yellow-300' : 
              i % 5 === 2 ? 'bg-orange-400' : 
              i % 5 === 3 ? 'bg-amber-300' :
              'bg-yellow-400'
            } opacity-40 shadow-lg`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${8 + Math.random() * 6}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`,
              filter: 'blur(0.8px)',
              boxShadow: '0 0 10px currentColor'
            }}
          />
        </div>
      ))}
      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) rotate(0deg) scale(1); 
            opacity: 0.4; 
          }
          25% { 
            transform: translateY(-30px) translateX(15px) rotate(90deg) scale(1.5); 
            opacity: 0.7; 
          }
          50% { 
            transform: translateY(-20px) translateX(-20px) rotate(180deg) scale(0.9); 
            opacity: 0.9; 
          }
          75% { 
            transform: translateY(-35px) translateX(8px) rotate(270deg) scale(1.2); 
            opacity: 0.5; 
          }
        }
      `}</style>
    </div>
  ), []);

  const LoadingScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-900/20 to-yellow-900/30 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.15),rgba(0,0,0,0))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(217,119,6,0.1),transparent_50%)]" />
      <FloatingParticles />
      
      <div className="text-center z-10 relative">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 rounded-full blur-2xl opacity-50 animate-pulse" />
          <Trophy className="w-24 h-24 text-transparent bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text relative z-10 animate-bounce drop-shadow-2xl" />
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s' }}>
            <Sparkles className="w-8 h-8 text-amber-400 absolute -top-3 -right-3 animate-pulse" />
            <Sparkles className="w-6 h-6 text-yellow-400 absolute -bottom-2 -left-2 animate-pulse" style={{ animationDelay: '0.5s' }} />
            <Crown className="w-7 h-7 text-orange-400 absolute -top-1 -left-3 animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </div>
        
        <div className="text-3xl font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 bg-clip-text text-transparent mb-6 tracking-wide">
          Loading Hall of Legends...
        </div>
        
        <div className="flex justify-center space-x-3 mb-8">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="w-4 h-4 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full animate-bounce shadow-lg shadow-amber-400/50"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
        
        <div className="w-80 h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner">
          <div className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 rounded-full animate-pulse shadow-lg" style={{ width: '75%' }} />
        </div>
      </div>
    </div>
  );

  const ErrorScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-red-900/30 via-slate-900 to-red-800/30 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.1),rgba(0,0,0,0))]" />
      <div className="text-center p-8 relative z-10">
        <div className="relative mb-6">
          <Zap className="w-20 h-20 text-red-400 mx-auto animate-pulse drop-shadow-lg" />
          <div className="absolute inset-0 bg-red-400/20 rounded-full blur-2xl animate-ping" />
        </div>
        <div className="text-red-400 text-2xl font-bold mb-3">Connection to the Legends Failed</div>
        <div className="text-red-300 text-base font-medium">{error}</div>
      </div>
    </div>
  );

  const getRankIcon = useCallback((index) => {
    const icons = {
      0: <Crown className="w-7 h-7 text-amber-200 drop-shadow-lg" />,
      1: <Trophy className="w-7 h-7 text-gray-200 drop-shadow-lg" />,
      2: <Medal className="w-7 h-7 text-orange-300 drop-shadow-lg" />
    };
    return icons[index] || <Star className="w-6 h-6 text-slate-300" />;
  }, []);

  const getRankBg = useCallback((index, isHovered = false) => {
    const baseClasses = "border transition-all duration-700 transform backdrop-blur-sm";
    const hoverScale = isHovered ? "scale-[1.02] shadow-2xl" : "";
    
    const styles = {
      0: `${baseClasses} bg-gradient-to-r from-amber-500/25 via-yellow-400/20 to-amber-500/25 border-amber-400/50 shadow-xl shadow-amber-500/30 ${hoverScale}`,
      1: `${baseClasses} bg-gradient-to-r from-gray-400/20 via-slate-300/15 to-gray-400/20 border-gray-400/40 shadow-xl shadow-gray-500/25 ${hoverScale}`,
      2: `${baseClasses} bg-gradient-to-r from-orange-500/20 via-amber-600/15 to-orange-500/20 border-orange-400/40 shadow-xl shadow-orange-500/25 ${hoverScale}`
    };
    
    return styles[index] || `${baseClasses} bg-slate-800/40 border-slate-600/30 hover:bg-slate-700/50 ${hoverScale}`;
  }, []);

  const WinnersTable = () => (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900/50 backdrop-blur-3xl border border-amber-400/30 shadow-2xl shadow-amber-500/20">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/8 via-transparent to-orange-500/8" />
      
      {/* Enhanced Header */}
      <div className="relative bg-gradient-to-r from-slate-800/90 via-amber-900/30 to-slate-800/90 border-b border-amber-400/40 px-8 py-8">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400/8 via-yellow-400/5 to-orange-400/8" />
        <div className="grid grid-cols-12 gap-6 items-center text-base font-black text-amber-200 relative z-10 tracking-wide">
          <div className="col-span-1 text-center">RANK</div>
          <div className="col-span-3">COMPETITION</div>
          <div className="col-span-3">CHAMPION</div>
          <div className="col-span-2 text-center">PRIZE</div>
          <div className="col-span-2 text-center">DATE</div>
          <div className="col-span-1 text-center">DETAILS</div>
        </div>
      </div>

      {/* Winners List */}
      <div className="divide-y divide-amber-400/15">
        {winners.map((winner, index) => (
          <div 
            key={winner._id}
            className={`grid grid-cols-12 gap-6 items-center px-8 py-8 hover:bg-gradient-to-r hover:from-amber-500/12 hover:to-orange-500/12 transition-all duration-700 group ${getRankBg(index, hoveredIndex === index)}`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Enhanced Rank */}
            <div className="col-span-1 flex justify-center">
              <div className={`relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-500 ${
                index === 0 ? 'bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-600 shadow-xl shadow-amber-500/60' :
                index === 1 ? 'bg-gradient-to-br from-gray-400 via-slate-300 to-gray-500 shadow-xl shadow-gray-400/50' :
                index === 2 ? 'bg-gradient-to-br from-orange-500 via-amber-600 to-orange-600 shadow-xl shadow-orange-500/50' :
                'bg-gradient-to-br from-slate-700 to-slate-800 shadow-lg shadow-slate-700/30'
              } group-hover:scale-125 group-hover:rotate-12 border-2 ${
                index === 0 ? 'border-amber-300/50' :
                index === 1 ? 'border-gray-300/50' :
                index === 2 ? 'border-orange-300/50' :
                'border-slate-600/50'
              }`}>
                {getRankIcon(index)}
                {index < 3 && (
                  <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 blur-sm" />
                )}
              </div>
            </div>

            {/* Competition */}
            <div className="col-span-3">
              <h3 className={`font-black text-xl transition-all duration-500 ${
                index === 0 ? 'text-transparent bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 bg-clip-text drop-shadow-sm' : 
                index === 1 ? 'text-transparent bg-gradient-to-r from-gray-300 via-slate-200 to-gray-400 bg-clip-text' :
                index === 2 ? 'text-transparent bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text' :
                'text-white group-hover:text-amber-200'
              }`}>
                {winner.competitionName}
              </h3>
              <div className="flex items-center mt-3">
                <Award className="w-5 h-5 mr-3 text-amber-400" />
                <p className="text-amber-300 text-base font-bold tracking-wide">{winner.season}</p>
              </div>
            </div>

            {/* Champion */}
            <div className="col-span-3">
              <div className="flex items-center space-x-5">
                <div className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-125 border-2 ${
                  index === 0 ? 'bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-600 shadow-xl shadow-amber-500/70 border-amber-300/50' :
                  index === 1 ? 'bg-gradient-to-br from-gray-400 via-slate-300 to-gray-500 shadow-xl shadow-gray-400/60 border-gray-300/50' :
                  index === 2 ? 'bg-gradient-to-br from-orange-500 via-amber-600 to-orange-600 shadow-xl shadow-orange-500/60 border-orange-300/50' :
                  'bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg shadow-slate-600/40 border-slate-500/50'
                }`}>
                  <User className="w-7 h-7 text-white drop-shadow-md" />
                  <div className="absolute -inset-2 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
                </div>
                <div>
                  <p className="font-black text-white text-xl group-hover:text-amber-200 transition-colors duration-500 tracking-wide">{winner.winnerName}</p>
                  {winner.runnerUp && (
                    <p className="text-slate-400 text-sm flex items-center mt-2 font-medium">
                      <span className="w-2 h-2 bg-amber-500 rounded-full mr-3 animate-pulse" />
                      defeated {winner.runnerUp}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Prize */}
            <div className="col-span-2 text-center">
              <div className="flex items-center justify-center space-x-3 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/40 group-hover:from-amber-500/30 group-hover:to-orange-500/30 transition-all duration-500 shadow-lg shadow-amber-500/20">
                <DollarSign className="w-6 h-6 text-amber-300" />
                <span className="font-black text-amber-300 text-xl tracking-wider">
                  {winner.prize.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Date */}
            <div className="col-span-2 text-center">
              <div className="flex items-center justify-center space-x-3 text-slate-300 group-hover:text-amber-200 transition-colors duration-500">
                <Calendar className="w-6 h-6" />
                <span className="font-bold text-base">
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
                className="group/btn relative p-4 rounded-2xl bg-gradient-to-r from-amber-500/25 to-orange-500/25 border border-amber-400/40 hover:from-amber-500/40 hover:to-orange-500/40 transition-all duration-500 transform hover:scale-125 hover:rotate-6 shadow-lg shadow-amber-500/20"
              >
                <Eye className="w-6 h-6 text-amber-300 group-hover/btn:text-white transition-colors duration-500" />
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl opacity-0 group-hover/btn:opacity-30 transition-opacity duration-500 blur-sm" />
              </button>
            </div>

            {/* Hover Effect Line */}
            <div className="absolute left-0 top-0 w-2 h-full bg-gradient-to-b from-amber-400 via-yellow-400 to-orange-400 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-700 origin-center shadow-lg shadow-amber-400/50" />
          </div>
        ))}
      </div>
    </div>
  );

  const MobileTable = () => (
    <div className="space-y-8">
      {winners.map((winner, index) => (
        <div 
          key={winner._id}
          className={`relative rounded-3xl p-8 ${getRankBg(index)} backdrop-blur-xl transition-all duration-700 hover:scale-105 transform cursor-pointer group shadow-2xl border-2`}
          onClick={() => setSelectedWinner(winner)}
        >
          {/* Rank Badge */}
          <div className="absolute -top-4 -right-4 z-10">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 border-slate-900 shadow-2xl ${
              index === 0 ? 'bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-600 shadow-amber-500/60' :
              index === 1 ? 'bg-gradient-to-br from-gray-400 via-slate-300 to-gray-500 shadow-gray-400/50' :
              index === 2 ? 'bg-gradient-to-br from-orange-500 via-amber-600 to-orange-600 shadow-orange-500/50' :
              'bg-gradient-to-br from-slate-600 to-slate-700 shadow-slate-600/40'
            }`}>
              {getRankIcon(index)}
            </div>
          </div>

          {/* Competition Info */}
          <div className="mb-6">
            <h3 className={`font-black text-2xl mb-3 ${
              index === 0 ? 'text-transparent bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 bg-clip-text drop-shadow-sm' : 
              index === 1 ? 'text-transparent bg-gradient-to-r from-gray-300 via-slate-200 to-gray-400 bg-clip-text' :
              index === 2 ? 'text-transparent bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text' :
              'text-white'
            }`}>
              {winner.competitionName}
            </h3>
            <p className="text-amber-300 text-base font-bold flex items-center tracking-wide">
              <Award className="w-5 h-5 mr-3" />
              {winner.season}
            </p>
          </div>

          {/* Champion Info */}
          <div className="flex items-center space-x-5 mb-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-xl ${
              index === 0 ? 'bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-600 border-amber-300/50 shadow-amber-500/60' :
              index === 1 ? 'bg-gradient-to-br from-gray-400 via-slate-300 to-gray-500 border-gray-300/50 shadow-gray-400/50' :
              index === 2 ? 'bg-gradient-to-br from-orange-500 via-amber-600 to-orange-600 border-orange-300/50 shadow-orange-500/50' :
              'bg-gradient-to-br from-slate-600 to-slate-700 border-slate-500/50 shadow-slate-600/40'
            }`}>
              <User className="w-8 h-8 text-white drop-shadow-md" />
            </div>
            <div>
              <p className="font-black text-white text-2xl tracking-wide">{winner.winnerName}</p>
              {winner.runnerUp && (
                <p className="text-slate-400 text-base font-medium mt-1">defeated {winner.runnerUp}</p>
              )}
            </div>
          </div>

          {/* Prize and Date */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="flex items-center space-x-3 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 shadow-lg shadow-amber-500/20">
              <DollarSign className="w-6 h-6 text-amber-300" />
              <span className="text-amber-300 font-black text-lg">${winner.prize.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-2xl bg-slate-800/60 border border-slate-600/40 shadow-lg">
              <Calendar className="w-6 h-6 text-slate-400" />
              <span className="text-slate-300 font-bold text-base">{new Date(winner.date).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Description */}
          {winner.description && (
            <div className="p-5 bg-gradient-to-r from-slate-800/60 to-slate-900/60 rounded-2xl border border-slate-600/40 shadow-inner">
              <p className="text-slate-300 italic text-base leading-relaxed font-medium">"{winner.description}"</p>
            </div>
          )}

          {/* View More Arrow */}
          <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <ChevronRight className="w-8 h-8 text-amber-400 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );

  const Modal = ({ winner, onClose }) => (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900/98 via-amber-900/20 to-slate-900/98 backdrop-blur-2xl rounded-3xl p-10 max-w-2xl w-full border-2 border-amber-400/40 shadow-2xl shadow-amber-500/30 transform animate-in zoom-in duration-500 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-3 rounded-full bg-slate-800/60 hover:bg-slate-700/60 transition-colors duration-300 border border-slate-600/50"
        >
          <X className="w-6 h-6 text-slate-400 hover:text-white" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative w-24 h-24 bg-gradient-to-br from-amber-500 via-yellow-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-amber-500/60 border-4 border-amber-300/30">
            <Trophy className="w-12 h-12 text-white drop-shadow-lg" />
            <div className="absolute -inset-3 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-30 animate-pulse" />
          </div>
          <h2 className="text-4xl font-black text-transparent bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 bg-clip-text mb-3 tracking-wide">
            {winner.winnerName}
          </h2>
          <p className="text-amber-300 font-bold text-xl tracking-wide">{winner.competitionName}</p>
        </div>
        
        {/* Details */}
        <div className="space-y-5 mb-8">
          {[
            { label: 'Season', value: winner.season, icon: Award },
            { label: 'Prize', value: `$${winner.prize.toLocaleString()}`, icon: DollarSign, special: true },
            { label: 'Date', value: new Date(winner.date).toLocaleDateString(), icon: Calendar },
            ...(winner.runnerUp ? [{ label: 'Defeated', value: winner.runnerUp, icon: User }] : [])
          ].map(({ label, value, icon: Icon, special }) => (
            <div key={label} className="flex justify-between items-center p-5 rounded-2xl bg-slate-800/60 border border-slate-600/40 shadow-lg backdrop-blur-sm">
              <div className="flex items-center space-x-4">
                <Icon className={`w-6 h-6 ${special ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="text-slate-400 font-bold text-lg">{label}:</span>
              </div>
              <span className={`font-black text-xl ${special ? 'text-amber-400' : 'text-white'} tracking-wide`}>{value}</span>
            </div>
          ))}
        </div>
        
        {/* Description */}
        {winner.description && (
          <div className="p-6 bg-gradient-to-r from-amber-500/15 to-orange-500/15 rounded-2xl border border-amber-400/30 mb-6 shadow-lg shadow-amber-500/20">
            <p className="text-slate-300 italic text-center leading-relaxed text-lg font-medium">"{winner.description}"</p>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-900/10 to-orange-900/20 relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(245,158,11,0.2),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(217,119,6,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.1),transparent_70%)]" />
      <div className="absolute inset-0 bg-[conic-gradient(from_90deg_at_50%_50%,transparent,rgba(245,158,11,0.08),transparent)]" />
      
      <FloatingParticles />
      
      {/* Enhanced Header */}
      <div className="relative z-10 pt-20 pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 rounded-full blur-3xl opacity-40 animate-pulse" />
            <Trophy className="w-28 h-28 text-transparent bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 bg-clip-text mx-auto relative z-10 drop-shadow-2xl" />
            <div className="absolute -inset-6 animate-spin" style={{ animationDuration: '12s' }}>
              <Sparkles className="w-10 h-10 text-amber-400 absolute -top-3 -right-3 animate-pulse" />
              <Sparkles className="w-8 h-8 text-yellow-400 absolute -bottom-2 -left-2 animate-pulse" style={{ animationDelay: '0.8s' }} />
              <Crown className="w-9 h-9 text-orange-400 absolute -top-1 -left-3 animate-pulse" style={{ animationDelay: '1.6s' }} />
              <Medal className="w-8 h-8 text-amber-500 absolute -bottom-1 -right-1 animate-pulse" style={{ animationDelay: '2.4s' }} />
            </div>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-black text-transparent bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 bg-clip-text mb-6 tracking-tight drop-shadow-2xl">
            HALL OF LEGENDS
          </h1>
          
          <p className="text-2xl text-amber-200 font-bold mb-4 tracking-wide">
            Where Champions Rise to Immortality
          </p>
          
          <div className="flex justify-center items-center space-x-4 text-slate-400">
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
            <Star className="w-6 h-6 text-amber-400 animate-pulse" />
            <span className="text-base font-semibold tracking-wider">ETERNAL GLORY</span>
            <Star className="w-6 h-6 text-amber-400 animate-pulse" />
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Desktop Table */}
          <div className="hidden lg:block">
            <WinnersTable />
          </div>
          
          {/* Mobile Cards */}
          <div className="lg:hidden">
            <MobileTable />
          </div>
        </div>
      </div>
                {/* Modal */}
      {selectedWinner && (
        <Modal winner={selectedWinner} onClose={() => setSelectedWinner(null)} />
      )}
      {/* Enhanced Footer */}
      <div className="relative z-10 mt-16 py-8 border-t border-amber-400/20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center space-x-3 mb-4">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-amber-300 font-bold tracking-wide">Where legends are born and glory lives forever</span>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-slate-500 text-sm">
            © 2025 Hall of Legends. All achievements etched in digital gold.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HallOfFame;