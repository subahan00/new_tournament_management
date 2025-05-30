// src/pages/ApplicantList.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ApplicantList = () => {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p className="text-center mt-4">Loading...</p>;
  if (applicants.length === 0) return <p className="text-center mt-4">No applicants found</p>;

  return (
    <div className="max-w-5xl mx-auto mt-10 p-4">
      <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">All Applicants</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {applicants.map(applicant => (
          <div key={applicant._id} className="p-5 bg-white rounded-xl shadow-lg hover:shadow-2xl transition">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{applicant.fullName}</h2>
            <p><strong>WhatsApp:</strong> {applicant.whatsapp}</p>
            <p><strong>Club:</strong> {applicant.club}</p>
            <p><strong>Age:</strong> {applicant.age}</p>
            <p><strong>Location:</strong> {applicant.location}</p>
            <p><strong>Playing Since:</strong> {applicant.playingSince}</p>
            <p className="text-sm text-gray-500 mt-2">Joined: {new Date(applicant.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApplicantList;
