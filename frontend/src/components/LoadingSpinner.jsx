import React from 'react';
import { motion } from 'framer-motion';
import { Orbit } from 'lucide-react';

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="relative"
      >
        <div className="w-20 h-20 border-4 border-purple-500/30 rounded-full"></div>
        <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-purple-500 rounded-full"></div>

        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        >
          <Orbit size={24} className="text-purple-400" />
        </motion.div>
      </motion.div>

      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Building your galaxy...</h3>
        <p className="text-sm text-gray-400 max-w-sm">
          Fetching papers and analyzing citations. This may take a moment.
        </p>

        <div className="pt-4">
          <div className="w-48 h-1 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
        <div className="text-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto mb-1"></div>
          <span>Fetching</span>
        </div>
        <div className="text-center">
          <div className="w-2 h-2 bg-purple-500 rounded-full mx-auto mb-1"></div>
          <span>Analyzing</span>
        </div>
        <div className="text-center">
          <div className="w-2 h-2 bg-pink-500 rounded-full mx-auto mb-1"></div>
          <span>Visualizing</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;