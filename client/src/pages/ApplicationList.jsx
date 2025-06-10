// src/pages/ApplicantList.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaTrash, FaCrown, FaRegUser, FaWhatsapp, FaMapMarkerAlt, FaCalendarAlt, FaTrophy } from 'react-icons/fa';

const ApplicantList = () => {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/admin/applicants`);
        setApplicants(res.data);
      } catch (err) {
        console.error('Failed to fetch applicants:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplicants();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this applicant?')) return;
    
    setDeletingId(id);
    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/admin/applicants/${id}`);
      setApplicants(applicants.filter(applicant => applicant._id !== id));
    } catch (err) {
      console.error('Failed to delete applicant:', err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
      <div className="animate-pulse text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-amber-500 rounded-full flex items-center justify-center">
          <FaCrown className="text-xl text-amber-900" />
        </div>
        <p className="text-amber-100 font-medium">Loading Applicants...</p>
      </div>
    </div>
  );

  if (applicants.length === 0) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
      <div className="text-center p-8 border border-amber-500/30 rounded-xl bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="w-16 h-16 mx-auto mb-4 bg-amber-500 rounded-full flex items-center justify-center">
          <FaRegUser className="text-xl text-amber-900" />
        </div>
        <h2 className="text-2xl font-bold text-amber-100 mb-2">No Applicants Found</h2>
        <p className="text-amber-500/80">No applicants have registered yet.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-amber-700 mb-4">
            <FaCrown className="text-2xl text-amber-900" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent mb-2">
            Premium Applicants
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-amber-600 to-amber-800 mx-auto rounded-full"></div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {applicants.map(applicant => (
            <div 
              key={applicant._id} 
              className="relative group bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl overflow-hidden border border-amber-900/50 hover:border-amber-600 transition-all duration-300"
            >
              {/* Premium badge */}
              {applicant.isPremium && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-amber-700 text-amber-900 text-xs font-bold px-3 py-1 rounded-full flex items-center">
                  <FaCrown className="mr-1" /> PREMIUM
                </div>
              )}
              
              {/* Delete button */}
              <button 
                onClick={() => handleDelete(applicant._id)}
                disabled={deletingId === applicant._id}
                className="absolute top-4 left-4 bg-red-900/80 hover:bg-red-700 text-red-100 p-2 rounded-full transition-all group-hover:opacity-100 opacity-70"
                aria-label="Delete applicant"
              >
                {deletingId === applicant._id ? (
                  <svg className="animate-spin h-4 w-4 text-red-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <FaTrash className="text-sm" />
                )}
              </button>
              
              {/* Card content */}
              <div className="p-6 pt-12">
                <div className="flex items-center mb-4">
                  <div className="bg-gradient-to-br from-amber-600 to-amber-800 w-16 h-16 rounded-full flex items-center justify-center text-amber-100 font-bold text-xl">
                    {applicant.fullName.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <h2 className="text-xl font-bold text-amber-100">{applicant.fullName}</h2>
                    <p className="text-amber-500 text-sm">#{applicant._id.slice(-6).toUpperCase()}</p>
                  </div>
                </div>

                <div className="space-y-3 border-t border-gray-700 pt-4 mt-4">
                  <div className="flex items-center text-gray-300">
                    <FaWhatsapp className="text-amber-500 mr-3 flex-shrink-0" />
                    <span>{applicant.whatsapp}</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <FaTrophy className="text-amber-500 mr-3 flex-shrink-0" />
                    <span>{applicant.club}</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <FaRegUser className="text-amber-500 mr-3 flex-shrink-0" />
                    <span>Age: {applicant.age}</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <FaMapMarkerAlt className="text-amber-500 mr-3 flex-shrink-0" />
                    <span>{applicant.location}</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <FaCalendarAlt className="text-amber-500 mr-3 flex-shrink-0" />
                    <span>Playing since: {applicant.playingSince}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 text-sm text-amber-500/80 flex items-center border-t border-gray-700">
                  <FaCalendarAlt className="mr-2" />
                  <span>Joined: {new Date(applicant.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ApplicantList;