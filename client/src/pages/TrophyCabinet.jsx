import React, { useState, useEffect } from 'react';
import { getWinners, handleApiError } from '../services/winnerService';
import { Trophy, User, ChevronRight, ArrowLeft, AlertCircle, Loader2, Crown, Gem, Castle, Sword, ScrollText,Star,Award,Medal,Shield } from 'lucide-react';

const TrophyCabinet = () => {
    const [winners, setWinners] = useState([]);
    const [selectedWinner, setSelectedWinner] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const fetchWinners = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await getWinners();
            setWinners(response.data || []);
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };
     useEffect(() => {
        fetchWinners();
    }, []);
  const TIERS = [
        {
            name: 'GOAT',
            minTrophies: 20,
            icon: <Crown className="w-5 h-5 text-yellow-400 fill-yellow-300" />,
            rowClass: 'bg-gradient-to-r from-yellow-900/40 to-amber-900/40 border-l-4 border-yellow-400',
            textClass: 'text-yellow-300',
            bgGlow: 'shadow-yellow-400/20 shadow-lg'
        },
        {
            name: 'Pro',
            minTrophies: 15,
            icon: <Gem className="w-4 h-4 text-purple-400" />,
            rowClass: 'bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border-l-4 border-purple-400',
            textClass: 'text-purple-300',
            bgGlow: 'shadow-purple-400/20 shadow-lg'
        },
        {
            name: 'Expert',
            minTrophies: 10,
            icon: <Star className="w-4 h-4 text-emerald-400" />,
            rowClass: 'bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border-l-4 border-emerald-400',
            textClass: 'text-emerald-300',
            bgGlow: 'shadow-emerald-400/20 shadow-lg'
        },
        {
            name: 'Advanced',
            minTrophies: 5,
            icon: <Award className="w-4 h-4 text-blue-400" />,
            rowClass: 'bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border-l-4 border-blue-400',
            textClass: 'text-blue-300',
            bgGlow: 'shadow-blue-400/20 shadow-lg'
        },
        {
            name: 'Rising',
            minTrophies: 1,
            icon: <Medal className="w-4 h-4 text-orange-400" />,
            rowClass: 'bg-gradient-to-r from-orange-900/40 to-red-900/40 border-l-4 border-orange-400',
            textClass: 'text-orange-300',
            bgGlow: 'shadow-orange-400/20 shadow-lg'
        },
        {
            name: 'Rookie',
            minTrophies: 0,
            icon: <Shield className="w-4 h-4 text-gray-400" />,
            rowClass: 'bg-gradient-to-r from-gray-900/40 to-slate-900/40 border-l-4 border-gray-400',
            textClass: 'text-gray-300',
            bgGlow: 'shadow-gray-400/20 shadow-lg'
        }
    ];

    const getTierForWinner = (totalTrophies) => {
        return TIERS.find(tier => totalTrophies >= tier.minTrophies) || TIERS[TIERS.length - 1];
    };

    const sortedWinners = [...winners]
        .filter(winner => winner.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => b.totalTrophies - a.totalTrophies || a.name.localeCompare(b.name));

    const handleWinnerClick = (winner) => {
        setSelectedWinner(winner);
    };

    const handleBackClick = () => {
        setSelectedWinner(null);
    };

    const getTrophyIcon = (timesWon) => {
        if (timesWon >= 10) return <Crown className="w-5 h-5 text-yellow-400 fill-yellow-300" />;
        if (timesWon >= 5) return <Gem className="w-4 h-4 text-purple-400" />;
        if (timesWon >= 3) return <Star className="w-4 h-4 text-emerald-400" />;
        return <Trophy className="w-4 h-4 text-orange-400" />;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="relative mb-8">
                        <Crown className="w-16 h-16 text-yellow-400 mx-auto animate-pulse" />
                        <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
                    </div>
                    <p className="text-xl text-gray-300 font-medium">Loading Champions...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center p-4">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md w-full border border-white/20">
                    <div className="text-center">
                        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
                        <p className="text-gray-300 mb-6">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-gradient-to-r from-yellow-500 to-yellow-700 text-slate-900 font-bold px-6 py-3 rounded-lg hover:from-yellow-600 hover:to-yellow-800 transition-all shadow-lg"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=&quot;100&quot; height=&quot;100&quot; viewBox=&quot;0 0 100 100&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cpath d=&quot;M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z&quot; fill=&quot;%239C92AC&quot; fill-opacity=&quot;0.05&quot; fill-rule=&quot;evenodd&quot;/%3E%3C/svg%3E')] opacity-20"></div>
            
            <div className="container mx-auto px-4 py-8 relative z-10 max-w-6xl">
                {!selectedWinner ? (
                    <>
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="relative inline-block mb-4">
                                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
                                <Crown className="w-16 h-16 text-yellow-400 relative z-10 mx-auto" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 mb-3">
                               Welcome to Official90 Trophy Cabinet
                            </h1>
                            <p className="text-gray-300 text-base md:text-lg max-w-2xl mx-auto">
                                Hall of Champions and Winners
                            </p>
                            <div className="w-40 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mx-auto rounded-full my-5"></div>
                        </div>

                        {/* Search */}
                        <div className="max-w-xl mx-auto mb-8">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                                <div className="relative bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
                                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search champions..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-transparent text-white placeholder-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Champions List - Mobile Optimized */}
                        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-slate-800 to-purple-900 px-4 md:px-6 py-4 flex justify-between items-center">
                                <h2 className="text-lg md:text-xl font-bold text-white flex items-center">
                                    <Trophy className="w-5 h-5 text-yellow-400 mr-2" />
                                    Champions
                                </h2>
                                <div className="text-gray-300 text-sm">
                                    {sortedWinners.length} Total
                                </div>
                            </div>

                            {/* Mobile-First List */}
                            <div className="divide-y divide-white/10">
                                {sortedWinners.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <Crown className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
                                        <p className="text-gray-400 text-xl">
                                            {searchTerm ? 'No champions found' : 'No champions yet'}
                                        </p>
                                    </div>
                                ) : (
                                    sortedWinners.map((winner, index) => {
                                        const tier = getTierForWinner(winner.totalTrophies);
                                        return (
                                            <div
                                                key={winner._id}
                                                className={`${tier.rowClass} ${tier.bgGlow} p-4 hover:bg-white/5 transition-all duration-200 cursor-pointer`}
                                                onClick={() => handleWinnerClick(winner)}
                                            >
                                                {/* Desktop Layout */}
                                                <div className="hidden md:flex items-center justify-between">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-700/50">
                                                            <span className="font-bold text-lg">
                                                                {index === 0 && <Crown className="w-5 h-5 text-yellow-400" />}
                                                                {index !== 0 && `#${index + 1}`}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-white text-lg">{winner.name}</h3>
                                                            <div className="flex items-center space-x-3">
                                                                <span className={`text-sm font-medium ${tier.textClass} flex items-center`}>
                                                                    {tier.icon}
                                                                    <span className="ml-1">{tier.name}</span>
                                                                </span>
                                                                <div className="flex items-center text-yellow-400">
                                                                    <Trophy className="w-4 h-4 mr-1" />
                                                                    <span className="font-bold">{winner.totalTrophies}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                                </div>

                                                {/* Mobile Layout */}
                                                <div className="md:hidden">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700/50">
                                                                {index === 0 ? (
                                                                    <Crown className="w-4 h-4 text-yellow-400" />
                                                                ) : (
                                                                    <span className="font-bold text-sm">#{index + 1}</span>
                                                                )}
                                                            </div>
                                                            <h3 className="font-bold text-white">{winner.name}</h3>
                                                        </div>
                                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                    <div className="flex items-center justify-between pl-11">
                                                        <div className="flex items-center space-x-4">
                                                            <span className={`text-sm font-medium ${tier.textClass} flex items-center`}>
                                                                {tier.icon}
                                                                <span className="ml-1">{tier.name}</span>
                                                            </span>
                                                            <div className="flex items-center text-yellow-400">
                                                                <Trophy className="w-4 h-4 mr-1" />
                                                                <span className="font-bold">{winner.totalTrophies}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    /* Champion Details */
                    <div className="max-w-4xl mx-auto">
                        <button
                            onClick={handleBackClick}
                            className="group flex items-center text-yellow-400 hover:text-yellow-300 transition-colors mb-6 bg-white/10 backdrop-blur-lg rounded-xl px-4 py-2 border border-white/20"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                            Back to List
                        </button>

                        {/* Champion Profile */}
                        <div className="bg-gradient-to-br from-slate-800/80 to-purple-900/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
                            {/* Hero Section */}
                            <div className="bg-gradient-to-r from-slate-800 to-purple-900 p-6 md:p-8 text-center relative">
                                <div className="relative z-10">
                                    

                                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{selectedWinner.name}</h1>
                                    <div className="flex items-center justify-center">
                                        <Trophy className="w-6 h-6 text-yellow-400 mr-2" />
                                        <span className="text-xl md:text-2xl font-bold text-yellow-400">{selectedWinner.totalTrophies}</span>
                                        <span className="text-gray-300 ml-2 text-base md:text-lg">
                                            Trophies
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Victories */}
                            <div className="p-4 md:p-6">
                                <div className="flex items-center mb-6 border-b border-white/10 pb-3">
                                    <Trophy className="w-6 h-6 text-yellow-500 mr-2" />
                                    <h2 className="text-lg md:text-xl font-bold text-white">Victories</h2>
                                </div>

                                {selectedWinner.trophies.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
                                        <p className="text-gray-400 text-lg">No victories yet</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {selectedWinner.trophies
                                            .sort((a, b) => b.timesWon - a.timesWon || a.competition.localeCompare(b.competition))
                                            .map((trophy, index) => (
                                                <div
                                                    key={index}
                                                    className="bg-gradient-to-br from-slate-800/50 to-purple-900/50 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-yellow-400/30 transition-all duration-300"
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex-1">
                                                            <h3 className="font-bold text-white text-base md:text-lg flex items-center">
                                                                {getTrophyIcon(trophy.timesWon)}
                                                                <span className="ml-2">{trophy.competition}</span>
                                                            </h3>
                                                            <p className="text-gray-400 text-sm mt-1">
                                                                Won {trophy.timesWon} time{trophy.timesWon !== 1 ? 's' : ''}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-xl md:text-2xl font-bold text-yellow-400">{trophy.timesWon}</span>
                                                        </div>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500"
                                                            style={{ width: `${Math.min((trophy.timesWon / 15) * 100, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrophyCabinet;
