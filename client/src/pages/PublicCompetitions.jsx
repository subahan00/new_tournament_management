import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import competitionService from '../services/competitionService';
import CompetitionCard from '../components/CompetitionCard';
import { Link } from 'react-router-dom';

const ITEMS_PER_PAGE = 10;

const Competitions = () => {
  const [competitions, setCompetitions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const data = await competitionService.getAllCompetitions();
        const sorted = [...(data || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setCompetitions(sorted);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitions();
  }, []);

  const totalPages = Math.ceil(competitions.length / ITEMS_PER_PAGE);
  const paginatedCompetitions = competitions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full shadow-yellow-500"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-cover bg-center bg-no-repeat text-white py-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: `url('/download (2).jpeg')`,
      }}
    >
      <div className=" bg-black/20 rounded-xl p-4 max-w-7xl mx-auto shadow-lg shadow-yellow-400/30">

        {/* Home Button */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-block bg-yellow-400 text-black px-4 py-2 rounded-lg shadow-md hover:bg-yellow-300 transition"
          >
            ← Home
          </Link>
        </div>

        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-5xl font-bold text-center text-yellow-300 mb-12 font-serif drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]"
        >
          Tournaments
        </motion.h1>

        {paginatedCompetitions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-yellow-200 py-10"
          >
            <p className="text-xl">No competitions available</p>
            <p className="mt-2">Be the first to create one!</p>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {paginatedCompetitions.map((comp) => (
                <motion.div
                  key={comp._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="hover:scale-[1.02] transition transform duration-300 shadow-xl shadow-yellow-300/20"
                >
                  <CompetitionCard competition={comp} />
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination */}
            <div className="flex justify-center mt-10 space-x-2">
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index + 1}
                  onClick={() => handlePageChange(index + 1)}
                  className={`px-4 py-2 rounded font-medium ${
                    currentPage === index + 1
                      ? 'bg-yellow-300 text-black shadow-md shadow-yellow-400'
                      : 'bg-gray-700 text-yellow-200 hover:bg-gray-600'
                  } transition`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default Competitions;
