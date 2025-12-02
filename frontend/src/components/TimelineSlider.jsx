import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp } from 'lucide-react';

const TimelineSlider = ({ yearRange, onChange, papers }) => {
  const yearStats = useMemo(() => {
    if (!papers || papers.length === 0) {
      return { minYear: 1900, maxYear: new Date().getFullYear() };
    }

    const years = papers.map(p => p.year || 0).filter(y => y > 1900);
    if (years.length === 0) {
      return { minYear: 1900, maxYear: new Date().getFullYear() };
    }

    return {
      minYear: Math.min(...years),
      maxYear: Math.max(...years)
    };
  }, [papers]);

  const handleChange = (e) => {
    const values = e.target.value.split(',').map(Number);
    onChange(values);
  };

  const getYearDistribution = () => {
    const distribution = {};
    const range = yearStats.maxYear - yearStats.minYear + 1;
    const buckets = Math.min(range, 20);

    for (let i = 0; i < buckets; i++) {
      distribution[i] = 0;
    }

    papers.forEach(paper => {
      if (paper.year) {
        const bucket = Math.floor(
          ((paper.year - yearStats.minYear) / range) * buckets
        );
        const safeBucket = Math.max(0, Math.min(buckets - 1, bucket));
        distribution[safeBucket] = (distribution[safeBucket] || 0) + 1;
      }
    });

    return Object.values(distribution);
  };

  const distribution = getYearDistribution();
  const maxCount = Math.max(...distribution, 1);

  return (
    <div className="space-y-4">
      {/* Year range display */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Calendar size={16} className="text-blue-400" />
          <span className="text-sm font-medium">Publication Years</span>
        </div>
        <div className="text-sm font-mono bg-gray-800/50 px-3 py-1 rounded-lg">
          {yearRange[0]} - {yearRange[1]}
        </div>
      </div>

      {/* Slider */}
      <div className="relative pt-8">
        {/* Distribution visualization */}
        <div className="absolute top-0 left-0 right-0 h-6 flex items-end space-x-px">
          {distribution.map((count, idx) => {
            const height = (count / maxCount) * 20;
            const isInRange = yearStats.minYear +
              (idx / distribution.length) * (yearStats.maxYear - yearStats.minYear) >= yearRange[0] &&
              yearStats.minYear +
              (idx / distribution.length) * (yearStats.maxYear - yearStats.minYear) <= yearRange[1];

            return (
              <div
                key={idx}
                className={`flex-1 rounded-t-sm transition-all ${
                  isInRange
                    ? 'bg-gradient-to-t from-purple-500 to-purple-600'
                    : 'bg-gray-700/50'
                }`}
                style={{ height: `${Math.max(2, height)}px` }}
              />
            );
          })}
        </div>

        {/* Slider input */}
        <input
          type="range"
          min={yearStats.minYear}
          max={yearStats.maxYear}
          value={yearRange[0]}
          onChange={(e) => onChange([parseInt(e.target.value), yearRange[1]])}
          className="absolute top-6 left-0 right-0 w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-purple-500"
        />

        <input
          type="range"
          min={yearStats.minYear}
          max={yearStats.maxYear}
          value={yearRange[1]}
          onChange={(e) => onChange([yearRange[0], parseInt(e.target.value)])}
          className="absolute top-6 left-0 right-0 w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-purple-500"
        />

        {/* Year labels */}
        <div className="flex justify-between text-xs text-gray-500 mt-8">
          <span>{yearStats.minYear}</span>
          <span>{Math.floor((yearStats.minYear + yearStats.maxYear) / 2)}</span>
          <span>{yearStats.maxYear}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="bg-gray-800/30 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <TrendingUp size={14} className="text-green-400" />
            <span className="text-xs text-gray-400">Papers in range</span>
          </div>
          <span className="text-lg font-semibold">
            {papers.filter(p => p.year >= yearRange[0] && p.year <= yearRange[1]).length}
          </span>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Calendar size={14} className="text-blue-400" />
            <span className="text-xs text-gray-400">Year span</span>
          </div>
          <span className="text-lg font-semibold">
            {yearRange[1] - yearRange[0]} years
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimelineSlider;