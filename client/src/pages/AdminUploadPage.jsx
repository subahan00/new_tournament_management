import React, { useState, useCallback } from 'react';
import { Upload, X, Check, AlertCircle, Image, Tag, Type, FileText, Star, Grid3X3, Crown, ArrowLeft, Plus, Trash2, Images } from 'lucide-react';

const AdminBatchUploadPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    category: 'players',
    featured: false
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadMode, setUploadMode] = useState('batch'); // 'single' or 'batch'

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

  const handleFileSelect = (files) => {
    const validFiles = [];
    const newPreviews = [];
    let hasError = false;

    Array.from(files).forEach((file, index) => {
      if (file && file.type.startsWith('image/')) {
        if (file.size > 10 * 1024 * 1024) {
          setError(`File "${file.name}" is larger than 10MB`);
          hasError = true;
          return;
        }

        validFiles.push(file);

        const reader = new FileReader();
        reader.onload = (e) => {
          newPreviews[index] = {
            file,
            preview: e.target.result,
            name: file.name,
            size: file.size
          };

          // Update previews when all files are processed
          if (newPreviews.filter(Boolean).length === validFiles.length) {
            if (uploadMode === 'batch') {
              setPreviews(prev => [...prev, ...newPreviews.filter(Boolean)]);
              setSelectedFiles(prev => [...prev, ...validFiles]);
            } else {
              setPreviews(newPreviews.filter(Boolean));
              setSelectedFiles(validFiles);
            }
          }
        };
        reader.readAsDataURL(file);
      } else {
        setError(`"${file?.name || 'Unknown file'}" is not a valid image file`);
        hasError = true;
      }
    });

    if (!hasError) {
      setError('');
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    handleFileSelect(files);
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

    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, []);

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    setPreviews([]);
    setUploadProgress({});
  };

  const uploadWallpaper = async (wallpaperData) => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/wallpaper/admin/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: wallpaperData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      setError('Please select at least one image to upload');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required');
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress({});

    try {
      const uploadPromises = selectedFiles.map(async (file, index) => {
        const formDataToSend = new FormData();
        formDataToSend.append('wallpaper', file);
        
        // For batch upload, append index to title to make each unique
        const uniqueTitle = uploadMode === 'batch' && selectedFiles.length > 1 
          ? `${formData.title.trim()} ${index + 1}`
          : formData.title.trim();
        
        formDataToSend.append('title', uniqueTitle);
        formDataToSend.append('description', formData.description.trim());
        formDataToSend.append('tags', formData.tags);
        formDataToSend.append('category', formData.category);
        formDataToSend.append('featured', formData.featured.toString());

        // Update progress for this file
        setUploadProgress(prev => ({
          ...prev,
          [index]: { status: 'uploading', progress: 0 }
        }));

        try {
          const result = await uploadWallpaper(formDataToSend);
          
          setUploadProgress(prev => ({
            ...prev,
            [index]: { status: 'completed', progress: 100 }
          }));

          return { success: true, result, index };
        } catch (error) {
          setUploadProgress(prev => ({
            ...prev,
            [index]: { status: 'error', progress: 0, error: error.message }
          }));

          return { success: false, error: error.message, index };
        }
      });

      const results = await Promise.all(uploadPromises);
      
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.length - successCount;

      if (successCount > 0) {
        setUploadSuccess(true);
        
        if (errorCount === 0) {
          // All succeeded - clear form
          setFormData({
            title: '',
            description: '',
            tags: '',
            category: 'players',
            featured: false
          });
          clearAllFiles();
        }

        setTimeout(() => setUploadSuccess(false), 5000);
      }

      if (errorCount > 0) {
        const errorMessages = results
          .filter(r => !r.success)
          .map(r => `File ${r.index + 1}: ${r.error}`)
          .join('; ');
        
        setError(`${errorCount} upload(s) failed: ${errorMessages}`);
      }

    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-8">
      <div className="mb-6">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-amber-300 hover:text-amber-200 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-amber-500/20">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-6 border-b border-amber-500/30">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-amber-400 flex items-center gap-3">
                  <Images className="w-8 h-8" />
                  Batch Wallpaper Upload
                </h1>
                <p className="text-amber-100/80 mt-2 font-light">Upload multiple wallpapers with shared metadata</p>
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
            {/* Upload Mode Toggle */}
            <div className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600/50">
              <span className="text-amber-300 font-semibold">Upload Mode:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUploadMode('single');
                    if (selectedFiles.length > 1) {
                      setSelectedFiles([selectedFiles[0]]);
                      setPreviews([previews[0]]);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    uploadMode === 'single'
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  Single Upload
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('batch')}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                    uploadMode === 'batch'
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  <Images className="w-4 h-4" />
                  Batch Upload
                </button>
              </div>
            </div>

            {/* Success Message */}
            {uploadSuccess && (
              <div className="bg-emerald-900/50 border border-emerald-500/30 rounded-lg p-4 flex items-center gap-3 backdrop-blur-sm">
                <Check className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-100 font-medium">
                  {selectedFiles.length > 1 
                    ? `Successfully uploaded ${Object.values(uploadProgress).filter(p => p.status === 'completed').length} wallpaper(s)!`
                    : 'Wallpaper uploaded successfully!'
                  }
                </span>
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
              <div className="flex items-center justify-between">
                <label className="block text-lg font-semibold text-amber-300 flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Wallpaper Images {uploadMode === 'batch' && '(Multiple)'}
                </label>
                {selectedFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllFiles}
                    className="text-red-400 hover:text-red-300 flex items-center gap-1 text-sm bg-red-500/10 px-3 py-1 rounded-lg border border-red-500/30"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </button>
                )}
              </div>

              <div
                className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${
                  dragActive
                    ? 'border-amber-500 bg-amber-900/20'
                    : selectedFiles.length > 0
                      ? 'border-emerald-500 bg-emerald-900/10'
                      : 'border-gray-600 hover:border-amber-500/50 bg-gray-700/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {previews.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {previews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview.preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg shadow-lg border border-gray-600/50"
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-all transform hover:scale-110 border border-red-400 opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          
                          {/* Upload Progress */}
                          {uploadProgress[index] && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white p-2 rounded-b-lg">
                              <div className="flex items-center justify-between text-xs">
                                <span className={`${
                                  uploadProgress[index].status === 'completed' ? 'text-green-400' :
                                  uploadProgress[index].status === 'error' ? 'text-red-400' :
                                  'text-yellow-400'
                                }`}>
                                  {uploadProgress[index].status === 'completed' ? 'Completed' :
                                   uploadProgress[index].status === 'error' ? 'Error' :
                                   'Uploading...'}
                                </span>
                                {uploadProgress[index].status === 'uploading' && (
                                  <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-2 text-center">
                            <p className="text-xs text-gray-300 truncate">
                              {preview.name} ({(preview.size / (1024 * 1024)).toFixed(2)} MB)
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-center text-sm text-gray-400">
                      {selectedFiles.length} file(s) selected
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-amber-500/50 mx-auto mb-4" />
                    <p className="text-gray-400 mb-2">
                      <span className="text-amber-400">Drag & drop</span> your images here, or{' '}
                      <label className="text-amber-400 hover:text-amber-300 cursor-pointer underline decoration-amber-500/50 hover:decoration-amber-400 transition-colors">
                        browse files
                        <input
                          type="file"
                          accept="image/*"
                          multiple={uploadMode === 'batch'}
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </p>
                    <p className="text-sm text-gray-500">
                      Maximum file size: 10MB each • JPG, PNG, WEBP
                      {uploadMode === 'batch' && ' • Multiple files supported'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Shared Metadata Form */}
            <div className="space-y-6 border-t border-gray-600/50 pt-6">
              <h3 className="text-xl font-semibold text-amber-300 flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Shared Metadata
                {uploadMode === 'batch' && <span className="text-sm text-amber-100/60">(Applied to all images)</span>}
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Title */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-amber-300 flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Title {uploadMode === 'batch' && selectedFiles.length > 1 && <span className="text-xs text-amber-100/60">(will auto-number)</span>}
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-gray-100 placeholder-gray-400"
                    placeholder={uploadMode === 'batch' ? "Enter base title (e.g., 'France Team')" : "Enter wallpaper title"}
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
                  placeholder={uploadMode === 'batch' ? "Describe the collection theme (e.g., 'French national team wallpapers')" : "Describe the wallpaper..."}
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
                  placeholder={uploadMode === 'batch' ? "Enter common tags (e.g., 'france, national team, euro, world cup')" : "Enter tags separated by commas"}
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
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={uploading || selectedFiles.length === 0}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-3 ${
                  uploading || selectedFiles.length === 0
                    ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                    : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 transform hover:scale-[1.02] shadow-lg hover:shadow-amber-500/20'
                }`}
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                    Uploading {selectedFiles.length > 1 ? `${Object.values(uploadProgress).filter(p => p.status === 'completed').length}/${selectedFiles.length}` : '...'}
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload {selectedFiles.length > 1 ? `${selectedFiles.length} Wallpapers` : 'Wallpaper'}
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

export default AdminBatchUploadPage;