import React, { useState, useCallback } from 'react';
import { Upload, X, Check, AlertCircle, Image, Tag, Type, FileText, Star, Grid3X3, Crown, ArrowLeft } from 'lucide-react';
import { uploadWallpaper } from '../services/wallpaperService';
import { Link } from 'react-router-dom';

const AdminUploadPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    category: 'players',
    featured: false
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const categories = [
    { value: 'players', label: 'Players' },
    { value: 'teams', label: 'Teams' },
    { value: 'stadiums', label: 'Stadiums' },
    { value: 'action', label: 'Action' },
    { value: 'vintage', label: 'Vintage' },
    { value: 'logos', label: 'Logos' },
    { value: 'abstract', label: 'Abstract' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setError('');

      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setError('Please select a valid image file');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setError('Please select an image to upload');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('wallpaper', selectedFile);
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('tags', formData.tags);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('featured', formData.featured.toString());

      await uploadWallpaper(formDataToSend);

      setUploadSuccess(true);
      setFormData({
        title: '',
        description: '',
        tags: '',
        category: 'players',
        featured: false
      });
      setSelectedFile(null);
      setPreview(null);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-8">
      <div className="mb-6">
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 text-amber-300 hover:text-amber-200 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-amber-500/20">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-6 border-b border-amber-500/30">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-amber-400 flex items-center gap-3">
                  <Upload className="w-8 h-8" />
                  Wallpaper Upload
                </h1>
                <p className="text-amber-100/80 mt-2 font-light">Add exclusive football wallpapers to the collection</p>
              </div>
              <div className="hidden md:block bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-full">
                <span className="text-amber-300 text-sm font-medium flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  Admin Privileges
                </span>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Success Message */}
            {uploadSuccess && (
              <div className="bg-emerald-900/50 border border-emerald-500/30 rounded-lg p-4 flex items-center gap-3 backdrop-blur-sm">
                <Check className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-100 font-medium">Wallpaper uploaded successfully!</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/50 border border-red-500/30 rounded-lg p-4 flex items-center gap-3 backdrop-blur-sm">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-100">{error}</span>
              </div>
            )}

            {/* File Upload */}
            <div className="space-y-4">
              <label className="block text-lg font-semibold text-amber-300 flex items-center gap-2">
                <Image className="w-5 h-5" />
                Wallpaper Image
              </label>

              <div
                className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${dragActive
                    ? 'border-amber-500 bg-amber-900/20'
                    : selectedFile
                      ? 'border-emerald-500 bg-emerald-900/10'
                      : 'border-gray-600 hover:border-amber-500/50 bg-gray-700/50'
                  }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {preview ? (
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg shadow-lg border border-gray-600/50"
                    />
                    <button
                      type="button"
                      onClick={removeFile}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-all transform hover:scale-110 border border-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-300">
                        {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-amber-500/50 mx-auto mb-4" />
                    <p className="text-gray-400 mb-2">
                      <span className="text-amber-400">Drag & drop</span> your image here, or{' '}
                      <label className="text-amber-400 hover:text-amber-300 cursor-pointer underline decoration-amber-500/50 hover:decoration-amber-400 transition-colors">
                        browse files
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </p>
                    <p className="text-sm text-gray-500">Maximum file size: 10MB • JPG, PNG, WEBP</p>
                  </div>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-amber-300 flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-gray-100 placeholder-gray-400"
                  placeholder="Enter wallpaper title"
                  maxLength={100}
                  required
                />
                <p className="text-xs text-gray-400">{formData.title.length}/100 characters</p>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-amber-300 flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4" />
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-gray-100"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value} className="bg-gray-800">
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-amber-300 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-gray-100 placeholder-gray-400"
                placeholder="Describe the wallpaper..."
                rows={4}
                maxLength={500}
                required
              />
              <p className="text-xs text-gray-400">{formData.description.length}/500 characters</p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-amber-300 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-gray-100 placeholder-gray-400"
                placeholder="Enter tags separated by commas (e.g., messi, barcelona, football)"
              />
              <p className="text-xs text-gray-400">Separate multiple tags with commas</p>
            </div>

            {/* Featured Toggle */}
            <div className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-lg border border-gray-600/50">
              <div className="relative">
                <input
                  type="checkbox"
                  id="featured"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </div>
              <label htmlFor="featured" className="text-sm font-semibold text-amber-300 flex items-center gap-2 cursor-pointer">
                <Star className="w-4 h-4 fill-amber-400/50 text-amber-400" />
                Mark as Featured
                {formData.featured && (
                  <span className="ml-2 bg-amber-500/20 text-amber-300 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    Premium
                  </span>
                )}
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={uploading || !selectedFile}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-3 ${uploading || !selectedFile
                    ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                    : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 transform hover:scale-[1.02] shadow-lg hover:shadow-amber-500/20'
                  }`}
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload Wallpaper
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUploadPage;
