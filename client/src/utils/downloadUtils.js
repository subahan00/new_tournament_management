import { downloadWallpaper } from '../services/wallpaperService';
import { triggerToast } from '../components/ui/Toast';

export const triggerDownload = async (wallpaper) => {
  if (!wallpaper) return;
  triggerToast('Starting download...', 'info');
  
  try {
    // Call our backend to increment download count
    await downloadWallpaper(wallpaper._id);
    
    // Fetch the best quality image from Cloudinary directly to create a blob
    const optimizedUrl = wallpaper.imageUrl.replace('/upload/', '/upload/q_auto:best,f_auto/');
    const response = await fetch(optimizedUrl);
    
    if (!response.ok) throw new Error('Network response was not ok');
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    
    // Create temporary link to trigger native download
    const a = document.createElement('a');
    a.href = url;
    
    // Extract format or default to jpg
    let ext = blob.type.split('/')[1] || 'jpg';
    if (ext === 'jpeg') ext = 'jpg';
    a.download = `wallpaper-${wallpaper.title.replace(/\s+/g, '-').toLowerCase()}.${ext}`;
    
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => { 
      document.body.removeChild(a); 
      URL.revokeObjectURL(url); 
    }, 1000);
    
    triggerToast('Download complete', 'success');
  } catch (err) {
    console.error('Download failed:', err);
    triggerToast('Failed to download wallpaper', 'error');
  }
};
