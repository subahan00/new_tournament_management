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
      {Array.from({ length: 15 }, (_, i) => (
        <div key={i} className="absolute">
          <div
            className={`w-2 h-2 rounded-full ${
              i % 4 === 0 ? 'bg-cyan-400' : 
              i % 4 === 1 ? 'bg-purple-400' : 
              i % 4 === 2 ? 'bg-pink-400' : 'bg-indigo-400'
            } opacity-30`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${6 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
              filter: 'blur(0.5px)'
            }}
          />
        </div>
      ))}
      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) rotate(0deg) scale(1); 
            opacity: 0.3; 
          }
          25% { 
            transform: translateY(-20px) translateX(10px) rotate(90deg) scale(1.3); 
            opacity: 0.6; 
          }
          50% { 
            transform: translateY(-15px) translateX(-15px) rotate(180deg) scale(0.8); 
            opacity: 0.8; 
          }
          75% { 
            transform: translateY(-25px) translateX(5px) rotate(270deg) scale(1.1); 
            opacity: 0.4; 
          }
        }
      `}</style>
    </div>
  ), []);

  const LoadingScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.3),rgba(0,0,0,0))]" />
      <FloatingParticles />
      
      <div className="text-center z-10 relative">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 rounded-full blur-xl opacity-40 animate-pulse" />
          <Trophy className="w-20 h-20 text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text relative z-10 animate-bounce" />
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
            <Sparkles className="w-6 h-6 text-purple-400 absolute -top-2 -right-2" />
            <Sparkles className="w-4 h-4 text-cyan-400 absolute -bottom-1 -left-1" />
          </div>
        </div>
        
        <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-4">
          Loading Champions...
        </div>
        
        <div className="flex justify-center space-x-2 mb-6">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="w-3 h-3 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        
        <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full animate-pulse" style={{ width: '70%' }} />
        </div>
      </div>
    </div>
  );

  const ErrorScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-red-900/50 via-slate-900 to-red-900/50 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.1),rgba(0,0,0,0))]" />
      <div className="text-center p-8 relative z-10">
        <div className="relative mb-6">
          <Zap className="w-16 h-16 text-red-400 mx-auto animate-pulse" />
          <div className="absolute inset-0 bg-red-400/20 rounded-full blur-xl animate-ping" />
        </div>
        <div className="text-red-400 text-xl font-semibold mb-2">Connection Failed</div>
        <div className="text-red-300 text-sm">{error}</div>
      </div>
    </div>
  );

  const getRankIcon = useCallback((index) => {
    const icons = {
      0: <Crown className="w-6 h-6 text-purple-300 drop-shadow-lg" />,
      1: <Trophy className="w-6 h-6 text-pink-300 drop-shadow-lg" />,
      2: <Medal className="w-6 h-6 text-cyan-300 drop-shadow-lg" />
    };
    return icons[index] || <Star className="w-5 h-5 text-slate-400" />;
  }, []);

  const getRankBg = useCallback((index, isHovered = false) => {
    const baseClasses = "border transition-all duration-500 transform backdrop-blur-sm";
    const hoverScale = isHovered ? "scale-[1.01] shadow-2xl" : "";
    
    const styles = {
      0: `${baseClasses} bg-gradient-to-r from-purple-500/20 via-pink-500/15 to-purple-500/20 border-purple-400/40 shadow-lg shadow-purple-500/20 ${hoverScale}`,
      1: `${baseClasses} bg-gradient-to-r from-pink-500/15 via-cyan-500/10 to-pink-500/15 border-pink-400/30 shadow-lg shadow-pink-500/15 ${hoverScale}`,
      2: `${baseClasses} bg-gradient-to-r from-cyan-500/15 via-indigo-500/10 to-cyan-500/15 border-cyan-400/30 shadow-lg shadow-cyan-500/15 ${hoverScale}`
    };
    
    return styles[index] || `${baseClasses} bg-slate-800/30 border-slate-600/20 hover:bg-slate-700/40 ${hoverScale}`;
  }, []);

  const WinnersTable = () => (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900/40 backdrop-blur-2xl border border-purple-400/20 shadow-2xl shadow-purple-500/10">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5" />
      
      {/* Enhanced Header */}
      <div className="relative bg-gradient-to-r from-slate-800/80 via-slate-900/90 to-slate-800/80 border-b border-purple-400/30 px-8 py-6">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/5 via-pink-400/3 to-cyan-400/5" />
        <div className="grid grid-cols-12 gap-6 items-center text-sm font-bold text-purple-200 relative z-10">
          <div className="col-span-1 text-center">RANK</div>
          <div className="col-span-3">COMPETITION</div>
          <div className="col-span-3">CHAMPION</div>
          <div className="col-span-2 text-center">PRIZE</div>
          <div className="col-span-2 text-center">DATE</div>
          <div className="col-span-1 text-center">DETAILS</div>
        </div>
      </div>

      {/* Winners List */}
      <div className="divide-y divide-purple-400/10">
        {winners.map((winner, index) => (
          <div 
            key={winner._id}
            className={`grid grid-cols-12 gap-6 items-center px-8 py-6 hover:bg-gradient-to-r hover:from-purple-500/8 hover:to-cyan-500/8 transition-all duration-500 group ${getRankBg(index, hoveredIndex === index)}`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Enhanced Rank */}
            <div className="col-span-1 flex justify-center">
              <div className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${
                index === 0 ? 'bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/40' :
                index === 1 ? 'bg-gradient-to-br from-pink-500 to-cyan-500 shadow-lg shadow-pink-500/40' :
                index === 2 ? 'bg-gradient-to-br from-cyan-500 to-indigo-500 shadow-lg shadow-cyan-500/40' :
                'bg-gradient-to-br from-slate-700 to-slate-800'
              } group-hover:scale-110 group-hover:rotate-12`}>
                {getRankIcon(index)}
                {index < 3 && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-sm" />
                )}
              </div>
            </div>

            {/* Competition */}
            <div className="col-span-3">
              <h3 className={`font-bold text-lg transition-all duration-300 ${
                index === 0 ? 'text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text' : 'text-white group-hover:text-purple-200'
              }`}>
                {winner.competitionName}
              </h3>
              <div className="flex items-center mt-2">
                <Award className="w-4 h-4 mr-2 text-purple-400" />
                <p className="text-purple-300 text-sm font-medium">{winner.season}</p>
              </div>
            </div>

            {/* Champion */}
            <div className="col-span-3">
              <div className="flex items-center space-x-4">
                <div className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${
                  index === 0 ? 'bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/50' :
                  index === 1 ? 'bg-gradient-to-br from-pink-500 to-cyan-500 shadow-lg shadow-pink-500/50' :
                  index === 2 ? 'bg-gradient-to-br from-cyan-500 to-indigo-500 shadow-lg shadow-cyan-500/50' :
                  'bg-gradient-to-br from-slate-600 to-slate-700'
                }`}>
                  <User className="w-6 h-6 text-white" />
                  <div className="absolute -inset-1 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                </div>
                <div>
                  <p className="font-bold text-white text-lg group-hover:text-purple-200 transition-colors duration-300">{winner.winnerName}</p>
                  {winner.runnerUp && (
                    <p className="text-slate-400 text-sm flex items-center mt-1">
                      <span className="w-1 h-1 bg-slate-500 rounded-full mr-2" />
                      defeated {winner.runnerUp}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Prize */}
            <div className="col-span-2 text-center">
              <div className="flex items-center justify-center space-x-2 p-3 rounded-xl bg-gradient-to-r from-purple-500/15 to-cyan-500/15 border border-purple-400/30 group-hover:from-purple-500/25 group-hover:to-cyan-500/25 transition-all duration-300">
                <DollarSign className="w-5 h-5 text-purple-300" />
                <span className="font-bold text-purple-300 text-lg">
                  {winner.prize.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Date */}
            <div className="col-span-2 text-center">
              <div className="flex items-center justify-center space-x-2 text-slate-300 group-hover:text-purple-200 transition-colors duration-300">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">
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
                className="group/btn relative p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-400/30 hover:from-purple-500/30 hover:to-cyan-500/30 transition-all duration-300 transform hover:scale-110 hover:rotate-3"
              >
                <Eye className="w-5 h-5 text-purple-300 group-hover/btn:text-white transition-colors duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-xl opacity-0 group-hover/btn:opacity-20 transition-opacity duration-300 blur-sm" />
              </button>
            </div>

            {/* Hover Effect Line */}
            <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-purple-400 via-pink-400 to-cyan-400 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center" />
          </div>
        ))}
      </div>
    </div>
  );

  const MobileTable = () => (
    <div className="space-y-6">
      {winners.map((winner, index) => (
        <div 
          key={winner._id}
          className={`relative rounded-2xl p-6 ${getRankBg(index)} backdrop-blur-xl transition-all duration-500 hover:scale-105 transform cursor-pointer group shadow-xl`}
          onClick={() => setSelectedWinner(winner)}
        >
          {/* Rank Badge */}
          <div className="absolute -top-3 -right-3 z-10">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-slate-900 shadow-lg ${
              index === 0 ? 'bg-gradient-to-br from-purple-500 to-pink-600' :
              index === 1 ? 'bg-gradient-to-br from-pink-500 to-cyan-500' :
              index === 2 ? 'bg-gradient-to-br from-cyan-500 to-indigo-500' :
              'bg-gradient-to-br from-slate-600 to-slate-700'
            }`}>
              {getRankIcon(index)}
            </div>
          </div>

          {/* Competition Info */}
          <div className="mb-4">
            <h3 className={`font-bold text-xl mb-2 ${
              index === 0 ? 'text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text' : 'text-white'
            }`}>
              {winner.competitionName}
            </h3>
            <p className="text-purple-300 text-sm font-medium flex items-center">
              <Award className="w-4 h-4 mr-2" />
              {winner.season}
            </p>
          </div>

          {/* Champion Info */}
          <div className="flex items-center space-x-4 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              index === 0 ? 'bg-gradient-to-br from-purple-500 to-pink-600' :
              index === 1 ? 'bg-gradient-to-br from-pink-500 to-cyan-500' :
              index === 2 ? 'bg-gradient-to-br from-cyan-500 to-indigo-500' :
              'bg-gradient-to-br from-slate-600 to-slate-700'
            }`}>
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-lg">{winner.winnerName}</p>
              {winner.runnerUp && (
                <p className="text-slate-400 text-sm">defeated {winner.runnerUp}</p>
              )}
            </div>
          </div>

          {/* Prize and Date */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center space-x-2 p-3 rounded-xl bg-gradient-to-r from-purple-500/15 to-cyan-500/15 border border-purple-400/20">
              <DollarSign className="w-5 h-5 text-purple-300" />
              <span className="text-purple-300 font-bold">${winner.prize.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-2 p-3 rounded-xl bg-slate-800/50 border border-slate-600/30">
              <Calendar className="w-5 h-5 text-slate-400" />
              <span className="text-slate-300 font-medium text-sm">{new Date(winner.date).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Description */}
          {winner.description && (
            <div className="p-4 bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-600/30">
              <p className="text-slate-300 italic text-sm leading-relaxed">"{winner.description}"</p>
            </div>
          )}

          {/* View More Arrow */}
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <ChevronRight className="w-6 h-6 text-purple-400" />
          </div>
        </div>
      ))}
    </div>
  );

  const Modal = ({ winner, onClose }) => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-xl rounded-2xl p-8 max-w-lg w-full border border-purple-400/30 shadow-2xl shadow-purple-500/20 transform animate-in zoom-in duration-300 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/50 hover:bg-slate-700/50 transition-colors duration-200"
        >
          <X className="w-5 h-5 text-slate-400 hover:text-white" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="relative w-20 h-20 bg-gradient-to-br from-purple-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/50">
            <Trophy className="w-10 h-10 text-white" />
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full opacity-20 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text mb-2">
            {winner.winnerName}
          </h2>
          <p className="text-purple-300 font-medium">{winner.competitionName}</p>
        </div>
        
        {/* Details */}
        <div className="space-y-4 mb-6">
          {[
            { label: 'Season', value: winner.season, icon: Award },
            { label: 'Prize', value: `$${winner.prize.toLocaleString()}`, icon: DollarSign, special: true },
            { label: 'Date', value: new Date(winner.date).toLocaleDateString(), icon: Calendar },
            ...(winner.runnerUp ? [{ label: 'Defeated', value: winner.runnerUp, icon: User }] : [])
          ].map(({ label, value, icon: Icon, special }) => (
            <div key={label} className="flex justify-between items-center p-4 rounded-xl bg-slate-800/50 border border-slate-600/30">
              <div className="flex items-center space-x-3">
                <Icon className={`w-5 h-5 ${special ? 'text-purple-400' : 'text-slate-400'}`} />
                <span className="text-slate-400 font-medium">{label}:</span>
              </div>
              <span className={`font-bold ${special ? 'text-purple-400' : 'text-white'}`}>{value}</span>
            </div>
          ))}
        </div>
        
        {/* Description */}
        {winner.description && (
          <div className="p-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-xl border border-purple-400/20 mb-6">
            <p className="text-slate-300 italic text-center leading-relaxed">"{winner.description}"</p>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(139,92,246,0.4),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(236,72,153,0.3),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.2),transparent_70%)]" />
      <div className="absolute inset-0 bg-[conic-gradient(from_90deg_at_50%_50%,transparent,rgba(139,92,246,0.05),transparent)]" />
      
      <FloatingParticles />
      
      {/* Enhanced Header */}
      <div className="relative z-10 pt-16 pb-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 rounded-full blur-3xl opacity-30 animate-pulse" />
            <Trophy className="w-20 h-20 text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text mx-auto relative z-10" />
            <div className="absolute -inset-4 animate-spin" style={{ animationDuration: '8s' }}>
              <Sparkles className="w-8 h-8 text-purple-400 absolute -top-2 -right-2 animate-pulse" />
              <Sparkles className="w-6 h-6 text-cyan-400 absolute -bottom-2 -left-2 animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text mb-4 tracking-tight">
            HALL OF LEGENDS
          </h1>
          
          <p className="text-slate-300 text-lg md:text-xl mb-8 max-w-3xl mx-auto leading-relaxed">
            Where champions transcend greatness and legends illuminate eternity. Witness the pinnacle of competitive mastery.
          </p>
          
          <div className="flex justify-center items-center space-x-4 mb-6">
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
            <Sparkles className="w-6 h-6 text-purple-400" />
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="hidden lg:block">
            <WinnersTable />
          </div>
          
          <div className="lg:hidden">
            <MobileTable />
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedWinner && (
        <Modal winner={selectedWinner} onClose={() => setSelectedWinner(null)} />
      )}

      {/* Enhanced Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-purple-400 rounded-full animate-spin" style={{ animationDuration: '20s' }} />
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 border border-pink-400 rounded-full animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
        <div className="absolute top-1/2 right-1/3 w-16 h-16 border border-cyan-400 rounded-full animate-spin" style={{ animationDuration: '25s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 border border-indigo-400 rounded-full animate-spin" style={{ animationDuration: '18s', animationDirection: 'reverse' }} />
      </div>
    </div>
  );
};

export default HallOfFame;