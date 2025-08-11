import React, { useState, useRef, useEffect } from 'react';

// --- SVG Icons for ChatBox ---
const MessageSquareIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);
const ShieldIcon = ({ className }) => ( // For Admin
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
);
const DollarSignIcon = ({ className }) => ( // For Bidder
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);
const EyeIcon = ({ className }) => ( // For Viewer
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
);
const SendIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
);


const ChatBox = ({ messages, onSendMessage, userType }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const getSenderStyle = (senderType) => {
    switch (senderType) {
      case 'admin': return { colorClass: 'text-amber-400', Icon: ShieldIcon };
      case 'bidder': return { colorClass: 'text-cyan-400', Icon: DollarSignIcon };
      case 'viewer': return { colorClass: 'text-indigo-400', Icon: EyeIcon };
      default: return { colorClass: 'text-slate-400', Icon: MessageSquareIcon };
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-base font-semibold text-white flex items-center gap-3">
            <MessageSquareIcon className="h-5 w-5 text-slate-400" />
            Live Chat
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 pt-16">
            <MessageSquareIcon className="h-10 w-10 mx-auto mb-2" />
            <p className="text-sm">No messages yet.</p>
            <p className="text-xs">Be the first to say something!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const { colorClass, Icon } = getSenderStyle(message.senderType);
            return (
              <div key={message._id || index} className="flex items-start space-x-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline space-x-2">
                    <span className={`text-sm font-semibold ${colorClass}`}>
                      {message.senderName}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-200 text-sm mt-1 break-words">
                    {message.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-700 bg-slate-900/50">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            maxLength={500}
            className="flex-1 p-2 border border-slate-700 rounded-md bg-slate-800 text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-colors font-semibold flex items-center justify-center"
            aria-label="Send Message"
          >
            <SendIcon className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;
