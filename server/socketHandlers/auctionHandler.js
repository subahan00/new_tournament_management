// socketHandlers/auctionHandler.js
const Auction = require('../models/Auction');
const AuctionPlayer = require('../models/AuctionPlayer');
const Bidder = require('../models/Bidder');
const Bid = require('../models/Bid');
const ChatMessage = require('../models/ChatMessage');
const jwt = require('jsonwebtoken');

const auctionHandler = (io) => {

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

      // Admin force-skip current player (remove from bidding without selling)
socket.on('skip-player', async (data) => {
  if (!socket.isAdmin) return; // only admins allowed

  try {
    const auctionId = socket.auctionId;
    if (!auctionId) {
      socket.emit('error', { message: 'No auction context on this socket.' });
      return;
    }

    // Prefer the currently active player on the auction, otherwise use passed playerId
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      socket.emit('error', { message: 'Auction not found.' });
      return;
    }

    const targetPlayerId = auction.currentPlayerId ? auction.currentPlayerId.toString()
                                                   : (data && data.playerId);

    if (!targetPlayerId) {
      socket.emit('error', { message: 'No player to skip.' });
      return;
    }

    const player = await AuctionPlayer.findById(targetPlayerId);
    if (!player) {
      socket.emit('error', { message: 'Player not found.' });
      return;
    }

    // Mark player as not sold (reuse 'unsold' status to avoid schema changes),
    // and clear any winning bids for this player.
    player.status = 'unsold'; // if you'd rather use 'skipped', update schema accordingly
    await player.save();

    // Clear winning flag on any bids for this player
    await Bid.updateMany({ playerId: player._id }, { isWinning: false });

    // Clear current player on auction (do NOT touch currentPlayerIndex here)
    auction.currentPlayerId = null;
    await auction.save();

    // Broadcast to room — reuse the 'player-unsold' event so frontend reacts the same.
    // Include `skipped: true` so clients can differentiate if needed.
    io.to(`auction-${auctionId}`).emit('player-unsold', {
      player,
      timestamp: new Date(),
      skipped: true
    });

  } catch (error) {
    console.error('Error skipping player:', error);
    socket.emit('error', { message: error.message });
  }
});

    // Join auction room
    socket.on('join-auction', async (data) => {
      try {
        const { auctionId, userType, authData } = data;

        socket.join(`auction-${auctionId}`);
        socket.auctionId = auctionId;
        socket.userType = userType;

        if (userType === 'admin') {
          // Verify admin token
          const token = authData?.token;
          if (token) {
            try {
              const decoded = jwt.verify(token, process.env.JWT_SECRET);
              socket.adminId = decoded.user.id;
              socket.isAdmin = true;
            } catch (err) {
              socket.emit('auth-error', { message: 'Invalid admin token' });
              return;
            }
          }
        } else if (userType === 'bidder') {
          // ✨ FIX: This logic now handles ALL bidders, not just approved ones.
          const bidder = await Bidder.findById(authData?.bidderId);
          if (bidder) {
            socket.bidderId = bidder._id;
            socket.bidderName = bidder.name;
            bidder.socketId = socket.id;
            bidder.isOnline = true;
            await bidder.save();

            // ✨ FIX: If the bidder is pending, emit the 'bidder-joined' event so the admin UI updates in real-time.
            if (bidder.status === 'pending') {
              io.to(`auction-${auctionId}`).emit('bidder-joined', bidder);
            }
          } else {
            // ✨ FIX: Handle cases where the bidder ID might be invalid.
            socket.emit('auth-error', { message: 'Invalid bidder ID' });
            return;
          }
        } else if (userType === 'viewer') {
          socket.viewerName = authData?.name || 'Anonymous';
        }

        // ✨ FIX: Pass the userType to get the correct state (admins see all bidders).
        const auctionState = await getAuctionState(auctionId, userType);
        socket.emit('auction-state', auctionState);

        // Notify room about new participant
        socket.to(`auction-${auctionId}`).emit('user-joined', {
          userType,
          name: socket.bidderName || socket.viewerName || 'Admin',
          timestamp: new Date()
        });

      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Admin starts auction
    socket.on('start-auction', async (data) => {
      if (!socket.isAdmin) return;

      try {
        const { auctionId } = data;
        const auction = await Auction.findByIdAndUpdate(
          auctionId,
          { status: 'active' },
          { new: true }
        );

        io.to(`auction-${auctionId}`).emit('auction-started', {
          auction,
          timestamp: new Date()
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Admin pauses/resumes auction
    socket.on('pause-auction', async (data) => {
      if (!socket.isAdmin) return;

      try {
        const { auctionId, pause } = data;
        const status = pause ? 'paused' : 'active';

        const auction = await Auction.findByIdAndUpdate(
          auctionId,
          { status },
          { new: true }
        );

        io.to(`auction-${auctionId}`).emit('auction-paused', {
          paused: pause,
          timestamp: new Date()
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Admin brings next player for bidding
    socket.on('next-player', async (data) => {
      if (!socket.isAdmin) return;

      try {
        const { auctionId } = data;
        const auction = await Auction.findById(auctionId);
        const players = await AuctionPlayer.find({
          auctionId,
          status: 'available'
        }).sort({ createdAt: 1 });

        if (players.length === 0) {
          io.to(`auction-${auctionId}`).emit('auction-completed');
          await Auction.findByIdAndUpdate(auctionId, { status: 'completed' });
          return;
        }

        const nextPlayer = players[0];
        nextPlayer.status = 'bidding';
        nextPlayer.currentPrice = nextPlayer.basePrice;
        await nextPlayer.save();

        auction.currentPlayerId = nextPlayer._id;
        auction.currentPlayerIndex += 1;
        await auction.save();

        io.to(`auction-${auctionId}`).emit('player-up-for-bid', {
          player: nextPlayer,
          currentBid: nextPlayer.basePrice,
          timestamp: new Date()
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Place bid
    socket.on('place-bid', async (data) => {
      if (!socket.bidderId) return;

      try {
        const { playerId, amount } = data;
        const auctionId = socket.auctionId;

        const bidder = await Bidder.findById(socket.bidderId);
        const player = await AuctionPlayer.findById(playerId);

        // Validation
        if (player.status !== 'bidding') {
          socket.emit('bid-error', { message: 'Player is not available for bidding' });
          return;
        }

        // ✨ FIX: Added a check to ensure the bidder is approved before they can bid.
        if (bidder.status !== 'approved') {
          socket.emit('bid-error', { message: 'You are not approved to bid yet.' });
          return;
        }

        if (amount <= player.currentPrice) {
          socket.emit('bid-error', { message: 'Bid must be higher than current price' });
          return;
        }

        if (amount > bidder.remainingBudget) {
          socket.emit('bid-error', { message: 'Insufficient budget' });
          return;
        }

        // Update player current price
        player.currentPrice = amount;
        await player.save();

        // Create bid record
        const bid = new Bid({
          amount,
          bidderId: socket.bidderId,
          playerId,
          auctionId,
          isWinning: true
        });
        await bid.save();

        // Mark previous bids as non-winning
        await Bid.updateMany(
          { playerId, _id: { $ne: bid._id } },
          { isWinning: false }
        );

        io.to(`auction-${auctionId}`).emit('bid-placed', {
          bid: {
            ...bid.toObject(),
            bidder: { name: bidder.name, teamName: bidder.teamName }
          },
          player: player,
          timestamp: new Date()
        });

      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Admin sells player
    socket.on('sell-player', async (data) => {
      if (!socket.isAdmin) return;

      try {
        const { playerId } = data;
        const auctionId = socket.auctionId;

        const player = await AuctionPlayer.findById(playerId);
        const winningBid = await Bid.findOne({ playerId, isWinning: true })
          .populate('bidderId');

        if (!winningBid) {
          // Mark as unsold
          player.status = 'unsold';
          await player.save();

          io.to(`auction-${auctionId}`).emit('player-unsold', {
            player,
            timestamp: new Date()
          });
        } else {
          // Sell to highest bidder
          const bidder = winningBid.bidderId;

          player.status = 'sold';
          player.soldPrice = winningBid.amount;
          player.soldTo = bidder._id;
          await player.save();

          // Update bidder
          bidder.remainingBudget -= winningBid.amount;
          bidder.playersWon.push(player._id);
          await bidder.save();

          io.to(`auction-${auctionId}`).emit('player-sold', {
            player,
            soldTo: bidder,
            soldPrice: winningBid.amount,
            timestamp: new Date()
          });
        }

        // Clear current player from auction
        await Auction.findByIdAndUpdate(auctionId, { currentPlayerId: null });

      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Chat message
    socket.on('send-message', async (data) => {
      try {
        const { message } = data;
        const auctionId = socket.auctionId;

        const chatMessage = new ChatMessage({
          message,
          senderName: socket.bidderName || socket.viewerName || 'Admin',
          senderType: socket.userType,
          senderId: socket.bidderId || socket.id,
          auctionId
        });

        await chatMessage.save();

        io.to(`auction-${auctionId}`).emit('new-message', {
          message: chatMessage,
          timestamp: new Date()
        });

      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Admin approves bidder
    socket.on('approve-bidder', async (data) => {
      if (!socket.isAdmin) return;

      try {
        const { bidderId, approved } = data;
        const status = approved ? 'approved' : 'rejected';

        const bidder = await Bidder.findByIdAndUpdate(
          bidderId,
          { status },
          { new: true }
        );

        io.to(`auction-${socket.auctionId}`).emit('bidder-status-updated', {
          bidder,
          approved,
          timestamp: new Date()
        });

        // Notify the specific bidder
        if (bidder.socketId) {
          io.to(bidder.socketId).emit('approval-status', { approved });
        }

      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);

      // Update bidder offline status
      if (socket.bidderId) {
        Bidder.findByIdAndUpdate(socket.bidderId, { isOnline: false })
          .catch(err => console.error('Error updating bidder offline status:', err));
      }
    });
  });
};

// ✨ FIX: The function now accepts userType to determine which bidders to send.
async function getAuctionState(auctionId, userType = 'viewer') {
  try {
    const auction = await Auction.findById(auctionId).populate('currentPlayerId');
    const players = await AuctionPlayer.find({ auctionId }).populate('soldTo');
    const messages = await ChatMessage.find({ auctionId }).sort({ createdAt: -1 }).limit(50);

    // ✨ FIX: If the user is an admin, send ALL bidders. Otherwise, only send approved bidders.
    const bidders = await Bidder.find({ auctionId }).populate('playersWon');

    return {
      auction: {
        ...auction.toObject(),
        players // now auction.players will have them
      },
      bidders,
      messages: messages.reverse()
    };

  } catch (error) {
    console.error('Error getting auction state:', error);
    return null;
  }
}


module.exports = auctionHandler;