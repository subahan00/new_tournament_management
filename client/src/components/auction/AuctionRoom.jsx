import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import AdminPanel from './AdminPanel';
import BidderPanel from './BidderPanel';
import ViewerPanel from './ViewerPanel';
import ChatBox from './ChatBox';
import PlayerCard from './PlayerCard';
import BiddersList from './BiddersList';
import AllPlayersModal from './AllPlayersModal'; // Import the new modal

// --- UI Icons ---
const SignalIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 20h.01" /><path d="M7 20v-4" /><path d="M12 20v-8" /><path d="M17 20V8" /><path d="M22 4v16" /></svg>
);
const GavelIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m14 13-7.5 7.5" /><path d="m16 16 6-6" /><path d="m8 8 6-6" /><path d="m9 7 8 8" /><path d="m21 11-8-8" /></svg>
);
const UsersIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
const LoadingSpinner = () => (
    <svg className="animate-spin h-8 w-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


const AuctionRoom = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const userType = searchParams.get('type');
    const token = searchParams.get('token');
    const bidderId = searchParams.get('bidderId');
    const viewerName = searchParams.get('name');

    const [socket, setSocket] = useState(null);
    const [auctionState, setAuctionState] = useState(null);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [messages, setMessages] = useState([]);
    const [bidders, setBidders] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [userStatus, setUserStatus] = useState('pending');
    const [isPlayersModalOpen, setIsPlayersModalOpen] = useState(false); // State for the modal
    const skipPlayer = (playerId) => socket?.emit('skip-player', { playerId });

    const socketRef = useRef(null);

    useEffect(() => {
        const newSocket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000');
        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on('connect', () => {
            setConnectionStatus('connected');
            const authData = {};
            if (userType === 'admin') authData.token = token;
            if (userType === 'bidder') authData.bidderId = bidderId;
            if (userType === 'viewer') authData.name = viewerName;

            newSocket.emit('join-auction', { auctionId: id, userType, authData });
        });

        newSocket.on('disconnect', () => setConnectionStatus('disconnected'));

        newSocket.on('auction-state', (state) => {
            const auctionData = state.auction || {};
            const players = auctionData.players || []; // Ensure players is always an array
            console.log('players are', players);
            setAuctionState({ ...auctionData, players });

            const currentPlayerObj = players.find(p => p._id === auctionData.currentPlayerId);
            setCurrentPlayer(currentPlayerObj || null);

            setMessages(state.messages || []);
            setBidders(state.bidders || []);
        });

        newSocket.on('auction-started', () => setAuctionState(prev => ({ ...prev, status: 'active' })));
        newSocket.on('auction-paused', (data) => setAuctionState(prev => ({ ...prev, status: data.paused ? 'paused' : 'active' })));

        newSocket.on('player-up-for-bid', (data) => {
            setCurrentPlayer(data.player);
            setAuctionState(prev => {
                if (!prev || !prev.players) return prev;
                return {
                    ...prev,
                    players: prev.players.map(p => p._id === data.player._id ? data.player : p)
                };
            });
        });

        newSocket.on('bid-placed', (data) => {
            // Assuming the backend sends `playerId` with the bid data, which is crucial for robustness.
            const { playerId, amount } = data.bid;

            setCurrentPlayer(prevPlayer => {
                if (prevPlayer && prevPlayer._id === playerId) {
                    return { ...prevPlayer, currentPrice: amount };
                }
                return prevPlayer;
            });

            setAuctionState(prev => {
                if (!prev || !prev.players) return prev;
                return {
                    ...prev,
                    players: prev.players.map(p =>
                        p._id === playerId ? { ...p, currentPrice: amount } : p
                    )
                };
            });
        });

        newSocket.on('player-sold', (data) => {
            setCurrentPlayer(null);
            setAuctionState(prev => {
                if (!prev || !prev.players) return prev;
                return {
                    ...prev,
                    players: prev.players.map(p => p._id === data.player._id ? data.player : p)
                };
            });
            setBidders(prev => prev.map(b =>
                b._id === data.soldTo._id
                    ? { ...b, remainingBudget: b.remainingBudget - data.soldPrice, playersWon: [...b.playersWon, data.player] }
                    : b
            ));
        });

        newSocket.on('player-unsold', (data) => {
            setCurrentPlayer(null);
            setAuctionState(prev => {
                if (!prev || !prev.players) return prev;
                return {
                    ...prev,
                    players: prev.players.map(p => p._id === data.playerId ? { ...p, status: 'unsold' } : p)
                };
            });
        });

        newSocket.on('new-message', (data) => setMessages(prev => [...prev, data.message]));
        newSocket.on('bidder-joined', (newBidder) => {
            setBidders(prevBidders => {
                if (prevBidders.find(b => b._id === newBidder._id)) return prevBidders;
                return [...prevBidders, newBidder];
            });
        });
        newSocket.on('bidder-status-updated', (data) => setBidders(prev => prev.map(b => b._id === data.bidder._id ? data.bidder : b)));
        newSocket.on('approval-status', (data) => setUserStatus(data.approved ? 'approved' : 'rejected'));
        newSocket.on('auth-error', (data) => {
            alert(data.message);
            navigate(`/auction/${id}`);
        });
        newSocket.on('bid-error', (data) => alert(data.message));
        newSocket.on('error', (data) => console.error('Socket error:', data.message));

        return () => { newSocket.close(); };
    }, [id, userType, token, bidderId, viewerName, navigate]); // FIX: Removed `currentPlayer` from dependency array

    const sendMessage = (message) => socket?.emit('send-message', { message });
    const placeBid = (amount) => socket?.emit('place-bid', { playerId: currentPlayer?._id, amount: parseInt(amount) });
    const startAuction = () => socket?.emit('start-auction', { auctionId: id });
    const pauseAuction = (pause) => socket?.emit('pause-auction', { auctionId: id, pause });
    const nextPlayer = () => socket?.emit('next-player', { auctionId: id });
    const sellPlayer = () => socket?.emit('sell-player', { playerId: currentPlayer?._id });
    const approveBidder = (bidderId, approved) => socket?.emit('approve-bidder', { bidderId, approved });

    if (!auctionState) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-slate-300 font-sans">
                <LoadingSpinner />
                <p className="mt-4 text-lg">
                    {connectionStatus === 'connecting' ? 'Connecting to Auction Room...' : 'Loading Auction Data...'}
                </p>
                <p className="text-sm text-slate-500">Please wait a moment.</p>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-gray-900 text-slate-200 font-sans p-4 lg:p-6 flex flex-col">
                {/* Header */}
                <header className="mb-4">
                    <div className="flex justify-between items-start bg-black/20 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white">{auctionState.name}</h1>
                            <div className="flex items-center space-x-3 mt-2">
                                <span className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold ${auctionState.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                    auctionState.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-gray-500/20 text-gray-400'
                                    }`}>
                                    <span className={`h-2 w-2 rounded-full ${auctionState.status === 'active' ? 'bg-green-400 animate-pulse' :
                                        auctionState.status === 'paused' ? 'bg-yellow-400' : 'bg-gray-400'
                                        }`}></span>
                                    <span>{auctionState.status.toUpperCase()}</span>
                                </span>
                                <span className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold ${connectionStatus === 'connected' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    <SignalIcon className="h-3 w-3" />
                                    <span>{connectionStatus.toUpperCase()}</span>
                                </span>
                            </div>
                        </div>
                        <div className="text-right flex items-center gap-6">
                            <button
                                onClick={() => setIsPlayersModalOpen(true)}
                                className="flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-lg transition-all duration-200 bg-slate-700/80 text-slate-300 hover:bg-slate-700"
                            >
                                <UsersIcon className="h-4 w-4" />
                                All Players
                            </button>

                        </div>
                    </div>
                </header>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 min-h-0">
                    {/* Center Column */}
                    <main className="lg:col-span-2 flex flex-col gap-4 lg:gap-6">
                        <div className="flex-grow bg-black/20 backdrop-blur-sm border border-slate-700 rounded-xl p-4 sm:p-6 flex flex-col justify-center items-center w-full">
                            {currentPlayer ? (
                                <PlayerCard
                                    player={currentPlayer}
                                    userType={userType}
                                    userStatus={userStatus}
                                    onBid={placeBid}
                                    canBid={userType === 'bidder' && userStatus === 'approved' && auctionState.status === 'active'}
                                    className="w-full max-w-md"
                                />
                            ) : (
                                <div className="text-center">
                                    <GavelIcon className="h-16 w-16 mx-auto text-slate-600 mb-4" />
                                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Waiting for Next Player</h2>
                                    <p className="text-slate-400 text-sm sm:text-base">The auction block is currently empty.</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-black/20 backdrop-blur-sm border border-slate-700 rounded-xl p-4 w-full">
                            {userType === 'admin' && (
                                <AdminPanel
                                    auction={auctionState}
                                    currentPlayer={currentPlayer}
                                    bidders={bidders}
                                    onStart={startAuction}
                                    onPause={pauseAuction}
                                    onNext={nextPlayer}
                                    onSell={sellPlayer}
                                    onApproveBidder={approveBidder}
                                    onSkip={skipPlayer}
                                />
                            )}
                            {userType === 'bidder' && (
                                <BidderPanel
                                    bidder={bidders.find(b => b._id === bidderId)}
                                    currentPlayer={currentPlayer}
                                    canBid={userStatus === 'approved' && auctionState.status === 'active'}
                                    onBid={placeBid}
                                    className="w-full"
                                />
                            )}
                            {userType === 'viewer' && <ViewerPanel currentPlayer={currentPlayer} />}
                        </div>
                    </main>

                    {/* Right Sidebar */}
                    <aside className="lg:col-span-1 bg-black/20 backdrop-blur-sm border border-slate-700 rounded-xl flex flex-col overflow-hidden min-h-0 w-full">
                        <div className="flex-1 overflow-y-auto">
                            <BiddersList bidders={bidders} />
                        </div>
                        <div className="flex-shrink-0 h-96 border-t border-slate-700">
                            <ChatBox
                                messages={messages}
                                onSendMessage={sendMessage}
                                userType={userType}
                            />
                        </div>
                    </aside>
                </div>

            </div>

            {/* Render the modal conditionally */}
            {isPlayersModalOpen && (
                <AllPlayersModal
                    players={auctionState.players || []}
                    currentPlayerId={currentPlayer?._id}
                    onClose={() => setIsPlayersModalOpen(false)}
                />
            )}
        </>
    );
};

export default AuctionRoom;
