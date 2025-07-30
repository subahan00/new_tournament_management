import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import axios from 'axios'; // Import axios for making API requests
import { Trash2, Megaphone, ChevronLeft, AlertTriangle } from 'lucide-react';

//=================================================================
// 1. LIVE API FUNCTIONS
//=================================================================

// Define the base URL for your backend API.
// It's good practice to use an environment variable for this.
const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

/**
 * Fetches all announcements from the backend API.
 * @returns {Promise<Array>} A promise that resolves to an array of announcement objects.
 */
const getAnnouncements = async () => {
    console.log("Fetching announcements from API...");
    try {
        const response = await axios.get(`${API_URL}/api/announcements`);
        // The backend wraps the data in a 'data' property.
        if (response.data && response.data.success) {
            return response.data.data;
        } else {
            throw new Error('Invalid data format from server.');
        }
    } catch (error) {
        console.error("API Error fetching announcements:", error.response || error.message);
        // Re-throw the error to be caught by the component
        throw error;
    }
};

/**
 * Sends a request to delete an announcement by its ID.
 * @param {string} id The ID of the announcement to delete.
 * @returns {Promise<Object>} A promise that resolves to the API response.
 */
const deleteAnnouncementAPI = async (id) => {
    console.log(`Deleting announcement with ID: ${id} via API...`);
    try {
        const response = await axios.delete(`${API_URL}/api/announcements/${id}`);
        if (!response.data || !response.data.success) {
            throw new Error('API returned an error on deletion.');
        }
        return response.data;
    } catch (error) {
        console.error("API Error deleting announcement:", error.response || error.message);
        // Re-throw the error to be caught by the component
        throw error;
    }
};


//=================================================================
// 2. THEME-ALIGNED COMPONENTS (Reused for consistency)
//=================================================================

const ThreeNebula = () => {
    const mountRef = useRef(null);
    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        mount.appendChild(renderer.domElement);
        camera.position.z = 5;

        const starGeometry = new THREE.BufferGeometry();
        const starCount = 5000;
        const posArray = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 20;
        }
        starGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const starMaterial = new THREE.PointsMaterial({ size: 0.01, color: 0xffdf80 });
        const starField = new THREE.Points(starGeometry, starMaterial);
        scene.add(starField);
        
        const animate = () => {
            requestAnimationFrame(animate);
            starField.rotation.y += 0.0002;
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return <div ref={mountRef} className="fixed inset-0 -z-20" />;
};


//=================================================================
// 3. MANAGE ANNOUNCEMENTS PAGE COMPONENT
//=================================================================

const ManageAnnouncements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [announcementToDelete, setAnnouncementToDelete] = useState(null);

    useEffect(() => {
        const loadAnnouncements = async () => {
            try {
                setIsLoading(true);
                const data = await getAnnouncements();
                // The API already sorts by newest first, so client-side sort is not strictly needed
                // but it's harmless to keep as a fallback.
                setAnnouncements(data);
                setError(null);
            } catch (err) {
                setError('Failed to load announcements. Please try again later.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        loadAnnouncements();
    }, []);

    const handleDeleteClick = (announcement) => {
        setAnnouncementToDelete(announcement);
        setShowConfirmModal(true);
    };

    const confirmDelete = async () => {
        if (!announcementToDelete) return;

        try {
            await deleteAnnouncementAPI(announcementToDelete._id);
            // On successful deletion, filter the announcement out of the local state
            setAnnouncements(prev => prev.filter(a => a._id !== announcementToDelete._id));
            setError(null); // Clear any previous errors
        } catch (err) {
            setError('Failed to delete announcement. Please refresh and try again.');
            console.error(err);
        } finally {
            // Close the modal regardless of success or failure
            setShowConfirmModal(false);
            setAnnouncementToDelete(null);
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div className="min-h-screen flex flex-col modern-bg text-white font-serif overflow-x-hidden">
            {/* Font and Theme Setup */}
            <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Lora:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet" />
            <Suspense fallback={<div className="fixed inset-0 bg-purple-950" />}>
                <ThreeNebula />
            </Suspense>

            <header className="fixed top-0 left-0 w-full z-50 p-4 flex justify-between items-center">
                <Link to="/admin/dashboard" className="inline-flex items-center space-x-2 text-purple-300 hover:text-gold-300 transition-colors duration-300 group glass-header-light p-2 rounded-lg">
                    <ChevronLeft size={20} className="transition-transform duration-300 group-hover:-translate-x-1" />
                    <span className="font-cinzel font-bold text-sm">Back to Dashboard</span>
                </Link>
            </header>

            <main className="flex-grow container mx-auto px-4 sm:px-6 py-24 md:py-32 relative z-10">
                <div className="text-center mb-12">
                    <h1 className="modern-hero-title" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}>Manage <span className="modern-brand-accent">Announcements</span></h1>
                    <p className="modern-hero-subtitle">
                        View and remove announcements. They are automatically deleted after 7 days.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto">
                    {isLoading && <p className="text-center text-gold-300">Loading announcements...</p>}
                    {error && <p className="text-center text-red-400">{error}</p>}
                    
                    {!isLoading && !error && (
                        <div className="space-y-6">
                            {announcements.length > 0 ? announcements.map(announcement => (
                                <div key={announcement._id} className="announcement-card">
                                    <div className="flex-grow pr-4">
                                        <p className="text-lg text-purple-100">{announcement.text}</p>
                                        <p className="text-xs text-purple-300 mt-2">
                                            Posted on: {formatDate(announcement.createdAt)}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteClick(announcement)}
                                        className="delete-button"
                                        aria-label="Delete announcement"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            )) : (
                                <div className="text-center py-10 glass-card">
                                    <Megaphone size={48} className="mx-auto text-gold-300 opacity-50" />
                                    <p className="mt-4 text-purple-200">No active announcements.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="modal-content">
                        <AlertTriangle size={48} className="text-red-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-cinzel text-gold-200 text-center mb-2">Confirm Deletion</h2>
                        <p className="text-purple-200 text-center mb-6">Are you sure you want to delete this announcement? This action cannot be undone.</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setShowConfirmModal(false)} className="modal-button secondary">
                                Cancel
                            </button>
                            <button onClick={confirmDelete} className="modal-button danger">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Styles */}
            <style jsx global>{`
                :root { --purple-dark: #2c1b4b; --purple-mid: #4a2a6c; --purple-light: #8b7bb8; --gold-main: #ffdf80; --gold-dark: #e6b422; }
                .font-cinzel { font-family: 'Cinzel', serif; } .font-lora { font-family: 'Lora', serif; }
                .modern-bg { background-color: #0a0510; background-image: linear-gradient(160deg, #0a0510 0%, #1a0f2e 100%); font-family: 'Lora', serif; }
                .glass-header-light { background: rgba(10, 5, 16, 0.5); backdrop-filter: blur(10px); border: 1px solid rgba(255, 223, 128, 0.1); }
                .modern-hero-title { font-family: 'Cinzel', serif; font-weight: 900; background: linear-gradient(135deg, #fff8e7 0%, var(--gold-main) 100%); background-clip: text; -webkit-background-clip: text; color: transparent; }
                .modern-brand-accent { background: linear-gradient(135deg, var(--purple-mid) 0%, var(--purple-light) 100%); background-clip: text; -webkit-background-clip: text; color: transparent; }
                .modern-hero-subtitle { font-size: clamp(1rem, 2vw, 1.25rem); color: var(--purple-light); max-w: 42rem; margin: 1rem auto 0; }
                
                .announcement-card {
                    background: linear-gradient(135deg, rgba(44, 27, 75, 0.4), rgba(30, 42, 90, 0.3));
                    backdrop-filter: blur(15px);
                    border: 1px solid rgba(255, 223, 128, 0.15);
                    border-radius: 16px;
                    padding: 1.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    transition: all 0.3s ease;
                }
                .announcement-card:hover {
                    border-color: rgba(255, 223, 128, 0.3);
                    transform: translateY(-4px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }
                .delete-button {
                    background-color: rgba(239, 68, 68, 0.1);
                    color: #f87171; /* red-400 */
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    transition: all 0.2s ease;
                }
                .delete-button:hover {
                    background-color: rgba(239, 68, 68, 0.2);
                    color: #ef4444; /* red-500 */
                    transform: scale(1.1);
                }
                .glass-card {
                    background: rgba(44, 27, 75, 0.2);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 223, 128, 0.1);
                    border-radius: 16px;
                }
                .modal-content {
                    background: linear-gradient(145deg, #1a0f2e, #2c1b4b);
                    border: 1px solid rgba(255, 223, 128, 0.2);
                    border-radius: 16px;
                    padding: 2rem;
                    width: 90%;
                    max-width: 450px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
                }
                .modal-button {
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    font-family: 'Cinzel', serif;
                    font-weight: 700;
                    transition: all 0.2s ease;
                    border: 1px solid transparent;
                }
                .modal-button.secondary {
                    background-color: rgba(139, 123, 184, 0.2);
                    color: var(--purple-light);
                    border-color: rgba(139, 123, 184, 0.4);
                }
                .modal-button.secondary:hover {
                    background-color: rgba(139, 123, 184, 0.4);
                }
                .modal-button.danger {
                    background-color: rgba(239, 68, 68, 0.2);
                    color: #f87171;
                    border-color: rgba(239, 68, 68, 0.4);
                }
                .modal-button.danger:hover {
                    background-color: rgba(239, 68, 68, 0.4);
                    color: white;
                }
            `}</style>
        </div>
    );
};

export default ManageAnnouncements;
