import React, { useState, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Swords, Star } from 'lucide-react';
import ThreeNebula from '../components/background/ThreeNebula';
import Header from '../components/Header';
import Footer from '../components/Footer';
import InteractiveCard from '../components/ui/InteractiveCard';
import AnnouncementSection from '../components/sections/AnnouncementSection';
import StatsSection from '../components/sections/StatsSections';
import RegistrationForm from '../components/sections/RegistrationForm';
import '../components/Styles.css';

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const handleCloseForm = () => setShowForm(false);

  return (
    <div className="min-h-screen flex flex-col modern-bg text-white font-serif overflow-x-hidden">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Orbitron:wght@400;700;900&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <Suspense fallback={<div className="fixed inset-0 bg-purple-950" />}>
        <ThreeNebula />
      </Suspense>

      <Header onQuestClick={() => setShowForm(true)} />

      <main className="flex-grow relative z-10 w-full">
        <section id="home" className="min-h-screen flex items-center justify-center text-center px-4 sm:px-6 relative">
          <div className="modern-hero-content">
            <h1 className="modern-hero-title">Welcome to <span className="modern-brand-accent">Official_90</span></h1>
            <p className="modern-hero-subtitle">MORE THAN A GAME </p>
            <div className="modern-hero-cta">
              <button id="join" onClick={() => setShowForm(true)} className="modern-cta-button">
                <span className="relative z-10">⚔️ Join The Arena</span>
                <div className="modern-cta-glow"></div>
              </button>
            </div>
          </div>
        </section>

        <AnnouncementSection />

        <section id="tournaments" className="container mx-auto px-4 sm:px-6 py-24">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto">
            <InteractiveCard className="group cursor-pointer">
              <div className="modern-info-card">
                <div className="modern-card-icon-wrapper"><Swords size={48} className="modern-card-icon" /></div>
                <h2 className="modern-card-title">Weekly Arenas</h2>
                <p className="modern-card-desc">Battle strong opponents every weekend for glory, rewards, and a place in the hall of legends.
                </p>
                <Link to="/view" className="modern-card-button">Enter The Arena</Link>
              </div>
            </InteractiveCard>
            <InteractiveCard className="group cursor-pointer" style={{ transitionDelay: '200ms' }}>
              <div className="modern-info-card">
                <div className="modern-card-icon-wrapper"><Star size={48} className="modern-card-icon" /></div>
                <h2 className="modern-card-title">Wallpapers</h2>
                <p className="modern-card-desc">Decorate your devices with stunning HD art featuring legendary football heroes.
                </p>
                <Link to="/wallpaper" className="modern-card-button">Browse Gallery</Link>
              </div>
            </InteractiveCard>
            <InteractiveCard className="group cursor-pointer" style={{ transitionDelay: '200ms' }}>
              <div className="modern-info-card">
                <div className="modern-card-icon-wrapper"><Star size={48} className="modern-card-icon" /></div>
                <h2 className="modern-card-title">Live Links</h2>
                <p className="modern-card-desc">Browse and enjoy live match links hassle-free
                </p>
                <Link to="/links-view" className="modern-card-button">Browse links</Link>
              </div>
            </InteractiveCard>
          </div>
        </section>

        <StatsSection />
      </main>

      <Footer />

      <RegistrationForm isOpen={showForm} onClose={handleCloseForm} />
    </div>
  );
}