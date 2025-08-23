import React, { useState, useEffect } from 'react';
import axios from '../services/api';
// Import icons for a better UI
import { FaPlus, FaTrash, FaPen, FaSave, FaTimes } from 'react-icons/fa';

const LiveLinkManage = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    links: [{ platform: '', url: '' }]
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [myLinks, setMyLinks] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchMyLinks();
  }, []);

  const fetchMyLinks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/livelinks/admin/my-links', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyLinks(response.data);
    } catch (error) {
      console.error('Error fetching links:', error);
      setMessage({ type: 'error', text: 'Failed to fetch your links' });
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLinkChange = (index, field, value) => {
    const updatedLinks = [...formData.links];
    updatedLinks[index][field] = value;
    setFormData({ ...formData, links: updatedLinks });
  };

  const addLinkField = () => {
    setFormData({
      ...formData,
      links: [...formData.links, { platform: '', url: '' }]
    });
  };

  const removeLinkField = (index) => {
    const updatedLinks = formData.links.filter((_, i) => i !== index);
    setFormData({ ...formData, links: updatedLinks });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      links: [{ platform: '', url: '' }]
    });
    setImage(null);
    setImagePreview('');
    setEditingId(null);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('links', JSON.stringify(formData.links));
      
      if (image) {
        formDataToSend.append('image', image);
      }

      let response;
      if (editingId) {
        response = await axios.put(`/livelinks/${editingId}`, formDataToSend, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setMessage({ type: 'success', text: 'Live link updated successfully!' });
      } else {
        response = await axios.post('/livelinks', formDataToSend, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setMessage({ type: 'success', text: 'Live link created successfully!' });
      }

      resetForm();
      fetchMyLinks();
    } catch (error) {
      console.error('Error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to save live link' 
      });
    }

    setLoading(false);
  };

  const handleEdit = (link) => {
    setFormData({
      title: link.title,
      description: link.description,
      links: link.links
    });
    setImagePreview(link.image.url);
    setEditingId(link._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this live link?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/livelinks/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage({ type: 'success', text: 'Live link deleted successfully!' });
        fetchMyLinks();
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to delete live link' });
      }
    }
  };
  
  const isExpired = (expiresAt) => new Date(expiresAt) < new Date();

  const getTimeRemaining = (expiresAt) => {
    const diff = new Date(expiresAt) - new Date();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };
  
  // Style definitions for cleaner JSX
  const inputStyle = "w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300 placeholder-gray-500";
  const labelStyle = "block text-sm font-medium text-amber-300 mb-2";

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-gray-900 to-black text-gray-200 min-h-screen font-sans">
      
      {/* --- FORM SECTION --- */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-amber-500/20 rounded-xl shadow-2xl shadow-black/30 p-8 mb-10">
        <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
          {editingId ? 'Edit Live Link' : 'Create New Live Link'}
        </h2>

        {message.text && (
          <div className={`mb-4 p-4 rounded-lg text-sm border ${
            message.type === 'success' ? 'bg-green-900/50 text-green-300 border-green-500/50' : 'bg-red-900/50 text-red-300 border-red-500/50'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className={labelStyle}>Game Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleInputChange} required className={inputStyle} placeholder="e.g., Manchester United vs Liverpool" />
            </div>
            <div>
              <label className={labelStyle}>Game Image</label>
              <input type="file" accept="image/*" onChange={handleImageChange} required={!editingId} className={`${inputStyle} file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-900/50 file:text-amber-300 hover:file:bg-amber-800/70`} />
            </div>
          </div>

          <div>
            <label className={labelStyle}>Description</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} required rows="3" className={inputStyle} placeholder="Game details, date, time, etc." />
          </div>

          {imagePreview && (
             <img src={imagePreview} alt="Preview" className="mt-3 h-32 w-auto object-cover rounded-lg border-2 border-gray-700 shadow-lg" />
          )}

          <div>
            <label className={labelStyle}>Streaming Links</label>
            {formData.links.map((link, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-3 mb-3 items-center">
                <input type="text" value={link.platform} onChange={(e) => handleLinkChange(index, 'platform', e.target.value)} placeholder="Platform (e.g., YouTube)" className={`${inputStyle} md:w-1/3`} required />
                <input type="url" value={link.url} onChange={(e) => handleLinkChange(index, 'url', e.target.value)} placeholder="https://..." className={`${inputStyle} flex-1`} required />
                {formData.links.length > 1 && (
                  <button type="button" onClick={() => removeLinkField(index)} className="p-3 bg-red-800/50 text-red-300 rounded-full hover:bg-red-700/70 transition-colors">
                    <FaTrash />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addLinkField} className="flex items-center gap-2 px-4 py-2 bg-amber-600/20 text-amber-300 rounded-lg hover:bg-amber-600/40 border border-amber-500/30 transition-colors text-sm font-semibold">
              <FaPlus /> Add Link
            </button>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-700/50">
            <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-lg shadow-lg hover:shadow-amber-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105">
              <FaSave /> {loading ? 'Saving...' : editingId ? 'Update Link' : 'Create Link'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 bg-gray-700 text-gray-200 font-medium rounded-lg hover:bg-gray-600 transition-colors">
                <FaTimes /> Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* --- MY LINKS SECTION --- */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-amber-500/20 rounded-xl shadow-2xl shadow-black/30 p-8">
        <h3 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">My Live Links</h3>
        
        {myLinks.length === 0 ? (
          <p className="text-gray-500 text-center py-10">You haven't created any live links yet. 🔗</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {myLinks.map((link) => (
              <div key={link._id} className={`bg-gray-900/70 rounded-xl shadow-lg overflow-hidden border transition-all duration-300 hover:shadow-amber-500/20 hover:border-amber-500/50 hover:-translate-y-1 ${
                isExpired(link.expiresAt) ? 'border-red-600/30' : 'border-gray-700'
              }`}>
                <img src={link.image.url} alt={link.title} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <h4 className="font-bold text-lg text-gray-100 mb-2 truncate">{link.title}</h4>
                  <p className="text-sm text-gray-400 mb-3 h-10 line-clamp-2">{link.description}</p>
                  
                  <div className={`text-xs font-bold p-2 rounded-md mb-3 inline-block ${
                    isExpired(link.expiresAt) ? 'text-red-300 bg-red-900/50' : 'text-amber-300 bg-amber-900/50'
                  }`}>
                    {getTimeRemaining(link.expiresAt)}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {link.links.map((streamLink, idx) => (
                      <span key={idx} className="bg-gray-700 text-xs text-gray-300 px-2 py-1 rounded-full">
                        {streamLink.platform}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex gap-2 text-sm">
                    <button onClick={() => handleEdit(link)} disabled={isExpired(link.expiresAt)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 text-black font-semibold rounded-md hover:bg-amber-500 transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed">
                      <FaPen size="0.8em"/> Edit
                    </button>
                    <button onClick={() => handleDelete(link._id)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-700 text-white font-semibold rounded-md hover:bg-red-600 transition-colors">
                      <FaTrash size="0.8em"/> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveLinkManage;