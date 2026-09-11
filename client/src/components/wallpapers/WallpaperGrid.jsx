import React, { useState, useEffect, useRef } from 'react';
import WallpaperCard from './WallpaperCard';
import WallpaperSkeleton from './WallpaperSkeleton';

const getColumnCount = () => {
  if (typeof window === 'undefined') return 2;
  const w = window.innerWidth;
  if (w < 640) return 2;
  if (w < 1024) return 3;
  if (w < 1280) return 4;
  return 5;
};

const WallpaperGrid = ({ wallpapers, loading, loadingMore, hasMore, onLoadMore, onSelectWallpaper, onWallpaperClick }) => {
  const isLoading = loading || loadingMore || false;
  const handleSelect = onSelectWallpaper || onWallpaperClick || (() => {});
  const [columns, setColumns] = useState([]);
  const [columnCount, setColumnCount] = useState(getColumnCount);
  const prevWallpapersRef = useRef([]);
  const columnHeightsRef = useRef([]);
  const sentinelRef = useRef(null);

  // Handle responsive column count changes
  useEffect(() => {
    const handleResize = () => {
      const newCount = getColumnCount();
      if (newCount !== columnCount) setColumnCount(newCount);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [columnCount]);

  // Distribute wallpapers into columns
  useEffect(() => {
    if (!wallpapers || !wallpapers.length) {
      setColumns(Array.from({ length: columnCount }, () => []));
      columnHeightsRef.current = new Array(columnCount).fill(0);
      prevWallpapersRef.current = [];
      return;
    }

    const prev = prevWallpapersRef.current;
    const isAppend = prev.length > 0
      && wallpapers.length > prev.length
      && columns.length === columnCount
      && wallpapers[0]?._id === prev[0]?._id;

    if (isAppend) {
      // Incremental: only distribute NEW items into existing columns
      const newItems = wallpapers.slice(prev.length);
      const newCols = columns.map(col => [...col]);
      const heights = [...columnHeightsRef.current];

      newItems.forEach(wp => {
        const shortestIdx = heights.indexOf(Math.min(...heights));
        newCols[shortestIdx].push(wp);
        heights[shortestIdx] += (wp.resolution?.height || 4) / (wp.resolution?.width || 3);
      });

      setColumns(newCols);
      columnHeightsRef.current = heights;
    } else {
      // Full redistribution (first load or column count changed)
      const newCols = Array.from({ length: columnCount }, () => []);
      const heights = new Array(columnCount).fill(0);

      wallpapers.forEach(wp => {
        const shortestIdx = heights.indexOf(Math.min(...heights));
        newCols[shortestIdx].push(wp);
        heights[shortestIdx] += (wp.resolution?.height || 4) / (wp.resolution?.width || 3);
      });

      setColumns(newCols);
      columnHeightsRef.current = heights;
    }

    prevWallpapersRef.current = wallpapers;
  }, [wallpapers, columnCount]);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || isLoading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: '300px' }
    );
    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
        {columns.map((col, colIdx) => (
          <div key={colIdx} className="flex flex-col gap-2 sm:gap-3 lg:gap-4">
            {col.map(wp => (
              <WallpaperCard
                key={wp._id}
                wallpaper={wp}
                onClick={() => handleSelect(wp)}
              />
            ))}
          </div>
        ))}
      </div>

      {isLoading && <div className="mt-4"><WallpaperSkeleton count={columnCount * 2} columns={columnCount} /></div>}

      {hasMore && !isLoading && <div ref={sentinelRef} className="h-10" />}

      {!hasMore && wallpapers?.length > 0 && (
        <p className="text-center text-zinc-600 text-sm py-8">You've seen all wallpapers</p>
      )}
    </div>
  );
};

export default WallpaperGrid;
