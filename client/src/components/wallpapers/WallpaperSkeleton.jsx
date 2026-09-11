import React, { useMemo } from 'react';

const HEIGHTS = [200, 250, 300, 350, 180, 280];

const pseudoRandom = (seed) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

const WallpaperSkeleton = ({ count = 8, columns = 2 }) => {
  const skeletonColumns = useMemo(() => {
    const cols = Array.from({ length: columns }, () => []);
    const heights = new Array(columns).fill(0);

    for (let i = 0; i < count; i++) {
      const hIdx = Math.floor(pseudoRandom(i + 1) * HEIGHTS.length);
      const randomHeight = HEIGHTS[hIdx];
      
      const shortestIdx = heights.indexOf(Math.min(...heights));
      cols[shortestIdx].push({ id: i, height: randomHeight });
      heights[shortestIdx] += randomHeight;
    }

    return cols;
  }, [count, columns]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 w-full">
      {skeletonColumns.map((col, colIdx) => (
        <div key={colIdx} className="flex flex-col gap-2 sm:gap-3 lg:gap-4">
          {col.map(item => (
            <div
              key={item.id}
              className="w-full rounded-xl bg-zinc-900 animate-shimmer bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 bg-[length:200%_100%]"
              style={{ height: `${item.height}px` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default WallpaperSkeleton;
