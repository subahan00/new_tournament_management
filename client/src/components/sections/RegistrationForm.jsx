import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, CheckCircle, Loader2, Instagram } from 'lucide-react';

const RegistrationFormModal = ({ isOpen, onClose }) => {
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

  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setLoading(false);
      setFormData({
        fullName: '', 
        whatsapp: '', 
        club: '', 
        age: '',
        location: '', 
        playingSince: '',
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Use environment variable for backend URL, fallback to localhost
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      await axios.post(`${backendUrl}/submit`, formData);
      setSubmitted(true);
    } catch (error) {
      console.error('Submission error:', error);
      // Here you could set an error state to show a message to the user
    } finally {
      setLoading(false);
    }
  };

  const formFields = [
    { name: 'fullName', label: 'Full Name', type: 'text', icon: '👤' },
    { name: 'whatsapp', label: 'WhatsApp Number', type: 'tel', icon: '📱' },
    { name: 'club', label: 'Club You Support', type: 'text', icon: '⚽' },
    { name: 'age', label: 'Age', type: 'number', icon: '🎂' },
    { name: 'location', label: 'Where Are You From', type: 'text', icon: '📍' },
    { name: 'playingSince', label: 'Playing eFootball Since', type: 'text', icon: '🎮' },
  ];

  return (
    <div 
      className="fixed inset-0 modern-modal-backdrop z-[100] flex items-start justify-center p-4 overflow-y-auto md:items-center" 
      onClick={onClose}
    >
      <div 
        className="modern-form-container max-w-sm w-full my-4 relative" 
        onClick={e => e.stopPropagation()}
      >
        <div className="modern-form-glow"></div>
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gold-300 hover:text-gold-100 transition-all duration-300 z-20 p-1 rounded-full hover:bg-purple-800/30 hover:scale-110" 
          aria-label="Close form"
        >
          <X size={18} />
        </button>

        <div className="max-h-[calc(100vh-2rem)] overflow-y-auto p-4 sm:p-5">
          {!submitted ? (
            <div className="relative z-10">
              <div className="text-center mb-4">
                <h2 className="text-xl font-title font-black modern-gradient-text mb-2">
                  ⚔️ Join The Arena
                </h2>
                <p className="text-purple-200 text-sm leading-relaxed">
                  Enter the arena and prove your worth
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                {formFields.map((field) => (
                  <div key={field.name} className="relative group">
                    <label 
                      htmlFor={field.name} 
                      className="block text-xs text-purple-200 mb-1 flex items-center gap-1 font-heading font-semibold"
                    >
                      <span className="text-sm">{field.icon}</span>
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      id={field.name}
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleInputChange}
                      required
                      className="modern-input text-sm px-3 py-1.5 h-9"
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  </div>
                ))}
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full py-2 modern-submit-button flex items-center justify-center text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={16} />
                      Submitting...
                    </>
                  ) : (
                    <span className="flex items-center gap-1.5">🚀 Submit Registration</span>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center py-4 relative z-10">
              <div className="relative mb-3">
                <CheckCircle className="relative text-green-400 mx-auto animate-bounce" size={40} />
              </div>
              <h3 className="text-lg font-title font-black modern-gradient-text mb-2">
                🎉 Registration Complete!
              </h3>
              <p className="text-purple-200 mb-3 text-sm leading-relaxed">
                We'll contact you via WhatsApp within 24 hours
              </p>
              <div className="modern-success-card p-3">
                <a 
                  href="https://www.instagram.com/official.t90__/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1.5 text-gold-400 hover:text-gold-300 font-semibold transition-colors text-sm"
                >
                  <Instagram size={14} />
                  Follow for Updates
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationFormModal;