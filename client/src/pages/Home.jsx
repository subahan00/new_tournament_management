import Header from '../components/Header';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import html2pdf from 'html2pdf.js';

export default function Home() {
  const downloadPDF = () => {
    const element = document.getElementById('pdf-content');
    const opt = {
      margin: 0,
      filename: 'Official90_Tournament.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, backgroundColor: null },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white font-sans">
      <div id="pdf-content">
        <Header />

        <main className="flex-grow container mx-auto px-4 py-16">
          <section className="text-center">
            <motion.h1
              className="text-5xl font-extrabold text-[#FFD700] mb-4 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Welcome to <span className="text-white">Official_90</span>
            </motion.h1>

            <motion.p
              className="text-xl text-gray-300 mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Join the ultimate football gaming experience
            </motion.p>

            <div className="grid md:grid-cols-2 gap-10">
              {/* Card 1 */}
              <motion.div
                className="relative rounded-xl shadow-xl overflow-hidden h-72 border border-[#FFD700]/30 group transform hover:scale-[1.02] hover:shadow-[#FFD700]/40 transition duration-500"
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <img
                  src="/assets/football.jpg"
                  alt="Football tournament"
                  className="absolute inset-0 w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-500 blur-[1.5px]"
                />
                <div className="absolute inset-0 bg-black/70 group-hover:bg-black/60 transition duration-300" />

                <div className="relative h-full flex flex-col justify-center items-center p-8 text-center text-white z-10">
                  <h2 className="text-3xl font-bold mb-3 tracking-wide group-hover:text-[#FFD700] transition duration-300">
                    WEEKLY TOURNAMENTS
                  </h2>
                  <p className="text-lg font-medium max-w-md">
                    Compete against top players for exciting prizes every weekend
                  </p>
                  <button className="mt-6 px-6 py-2 bg-[#FFD700] hover:bg-yellow-400 hover:scale-105 text-black rounded-full font-semibold transition-all duration-300 shadow-md shadow-yellow-400/30">
                    Register Now
                  </button>
                </div>
              </motion.div>

              {/* Card 2 */}
              <motion.div
                className="relative rounded-xl shadow-xl overflow-hidden h-72 border border-[#FFD700]/30 group transform hover:scale-[1.02] hover:shadow-[#FFD700]/40 transition duration-500"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <img
                  src="/assets/social.jpg"
                  alt="Leaderboard"
                  className="absolute inset-0 w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-500 blur-[1.5px]"
                />
                <div className="absolute inset-0 bg-black/70 group-hover:bg-black/60 transition duration-300" />

                <div className="relative h-full flex flex-col justify-center items-center p-8 text-center text-white z-10">
                  <h2 className="text-3xl font-bold mb-3 tracking-wide group-hover:text-[#FFD700] transition duration-300">
                    LIVE LEADERBOARDS
                  </h2>
                  <p className="text-lg font-medium max-w-md">
                    Track your progress, rise through the ranks and earn fame
                  </p>
                  <button className="mt-6 px-6 py-2 bg-[#FFD700] hover:bg-yellow-400 hover:scale-105 text-black rounded-full font-semibold transition-all duration-300 shadow-md shadow-yellow-400/30">
                    View Standings
                  </button>
                </div>
              </motion.div>
            </div>
          </section>
        </main>

        <Footer />
      </div>

      <div className="text-center my-6">
        <button
          onClick={downloadPDF}
          className="px-6 py-2 bg-[#FFD700] text-black font-bold rounded hover:bg-yellow-400 transition shadow-lg shadow-yellow-400/20"
        >
          Download This Page as PDF
        </button>
      </div>
    </div>
  );
}
