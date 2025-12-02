import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, Github, Twitter, Upload, Search, ExternalLink } from 'lucide-react';

import GalaxyVisualizer from './components/GalaxyVisualizer';
import PaperCard from './components/PaperCard';
import SearchInput from './components/SearchInput';
import TimelineSlider from './components/TimelineSlider';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const [papers, setPapers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [loading, setLoading] = useState(false);
  const [yearRange, setYearRange] = useState([1990, new Date().getFullYear()]);
  const [showExamples, setShowExamples] = useState(true);

  const fetchPaperNetwork = async (input, inputType, depth = 2) => {
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input_type: inputType,
          value: input,
          depth: depth,
          max_papers: 50
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Transform data for frontend
      const papersList = Object.values(data.network.papers).map(paper => ({
        ...paper,
        id: paper.id || Math.random().toString(),
        fields: paper.fields || [],
        authors: paper.authors || [],
      }));

      return {
        papers: papersList,
        edges: data.network.edges || [],
        central_paper: data.network.central_paper,
        stats: data.network.stats || {}
      };
    } catch (error) {
      console.error('Error fetching paper network:', error);
      throw error;
    }
  };

  const handleSearch = async (input, inputType) => {
    if (!input.trim()) {
      toast.error('Please enter a paper identifier');
      return;
    }

    setLoading(true);
    setShowExamples(false);

    try {
      const result = await fetchPaperNetwork(input, inputType, 2);

      setPapers(result.papers);
      setConnections(result.edges);

      // Set central paper
      const centralPaper = result.papers.find(p => p.id === result.central_paper);
      setSelectedPaper(centralPaper || result.papers[0]);

      toast.success(`Found ${result.papers.length} papers with ${result.edges.length} connections!`);
    } catch (error) {
      console.error('Search error:', error);
      toast.error(`Error: ${error.message || 'Failed to fetch papers'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = async (example) => {
    handleSearch(example.id, example.type);
  };

  const extractTitleFromPDF = (text) => {
    const lines = text.split('\n');
    return lines[0] || '';
  };

  // Filter papers by year range
  const filteredPapers = papers.filter(paper =>
    paper.year >= yearRange[0] && paper.year <= yearRange[1]
  );

  const examples = [
    {
      id: "1706.03762",
      title: "Attention Is All You Need",
      type: "arxiv",
      description: "The original Transformer paper by Vaswani et al."
    },
    {
      id: "10.1038/s41586-020-2649-2",
      title: "A guide to deep learning in healthcare",
      type: "doi",
      description: "Nature Medicine review on deep learning applications"
    },
    {
      id: "10.1126/science.1249098",
      title: "The Human Brain Project",
      type: "doi",
      description: "Large-scale neuroscience research initiative"
    }
  ];

  return (
    <div className="min-h-screen bg-cosmic-gradient text-white overflow-x-hidden">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(30, 27, 75, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white',
          },
        }}
      />

      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-stars opacity-5"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/20 to-black"></div>
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.5 + 0.2,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-50 container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-nebula-pink to-nebula-blue rounded-full flex items-center justify-center"
            >
              <Brain size={20} className="sm:size-6" />
            </motion.div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-nebula-pink via-nebula-purple to-nebula-cyan bg-clip-text text-transparent">
                GalaxyCite
              </h1>
              <p className="text-xs sm:text-sm text-gray-400">Visualize academic paper galaxies</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <motion.a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 bg-gray-800/50 backdrop-blur-sm rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Github size={18} className="sm:size-5" />
            </motion.a>
            <motion.a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 bg-gray-800/50 backdrop-blur-sm rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Twitter size={18} className="sm:size-5" />
            </motion.a>
          </div>
        </div>
      </header>

      <main className="relative z-40 container mx-auto px-4 sm:px-6">
        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto mb-8 sm:mb-12"
        >
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold mb-2">
              Explore Academic Papers in 3D
            </h2>
            <p className="text-sm sm:text-base text-gray-400">
              Enter a paper DOI, arXiv ID, title, or upload a PDF to visualize its citation galaxy
            </p>
          </div>

          <SearchInput
            onSearch={handleSearch}
            loading={loading}
          />

          {showExamples && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 sm:mt-8"
            >
              <h3 className="text-sm sm:text-base font-medium mb-3 text-gray-300">Try these examples:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {examples.map((example, idx) => (
                  <motion.button
                    key={example.id}
                    onClick={() => handleExampleClick(example)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="text-left p-4 bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-700 hover:border-purple-500/50 transition-all hover:bg-gray-800/60 group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
                          {example.title}
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">{example.description}</p>
                      </div>
                      <ExternalLink size={14} className="text-gray-500 group-hover:text-purple-400 mt-1" />
                    </div>
                    <div className="flex items-center mt-3">
                      <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                        {example.type.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">{example.id}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Paper Details & Controls */}
          <div className="lg:col-span-1 space-y-6">
            <AnimatePresence>
              {selectedPaper && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass-panel rounded-2xl p-4 sm:p-6"
                >
                  <PaperCard
                    paper={selectedPaper}
                    onClose={() => setSelectedPaper(null)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Timeline Filter */}
            {papers.length > 0 && (
              <div className="glass-panel rounded-2xl p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center">
                  <Sparkles size={16} className="mr-2 text-yellow-400" />
                  Timeline Explorer
                </h3>
                <TimelineSlider
                  yearRange={yearRange}
                  onChange={setYearRange}
                  papers={papers}
                />

                <div className="mt-6 space-y-3">
                  <div className="flex justify-between text-xs sm:text-sm text-gray-400">
                    <span>Filtered: {filteredPapers.length} papers</span>
                    <span>Total: {papers.length} papers</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <button
                      onClick={() => setYearRange([1990, new Date().getFullYear()])}
                      className="px-3 py-2 text-xs sm:text-sm bg-gray-800/50 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Reset Timeline
                    </button>
                    <button
                      onClick={() => {
                        const recentYear = new Date().getFullYear();
                        setYearRange([recentYear - 5, recentYear]);
                      }}
                      className="px-3 py-2 text-xs sm:text-sm bg-blue-600/30 hover:bg-blue-600/50 rounded-lg transition-colors"
                    >
                      Last 5 Years
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Galaxy Visualization */}
          <div className="lg:col-span-2 relative">
            <div className="absolute inset-0 rounded-2xl overflow-hidden border border-cyan-500/20 shadow-2xl min-h-[500px] sm:min-h-[600px]">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-900/80">
                  <LoadingSpinner />
                </div>
              ) : papers.length > 0 ? (
                <GalaxyVisualizer
                  papers={filteredPapers}
                  connections={connections}
                  onPaperSelect={setSelectedPaper}
                  selectedPaperId={selectedPaper?.id}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900/80 to-purple-900/20">
                  <div className="text-center space-y-4 px-4">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-full flex items-center justify-center">
                      <Brain size={32} className="sm:size-12 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold mb-2">
                        Enter a paper to begin exploration
                      </h3>
                      <p className="text-sm sm:text-base text-gray-400 max-w-md">
                        Visualize citation networks as interactive 3D galaxies.
                        Discover connections you never knew existed.
                      </p>
                    </div>
                    <div className="pt-4">
                      <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                        <Search size={14} />
                        <span>Search by DOI, arXiv ID, or title</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-30 mt-12 pb-8 text-center text-gray-500 text-xs sm:text-sm px-4">
        <p>Built with ❤️ for researchers. GalaxyCite v1.0</p>
        <p className="mt-1">
          Powered by Semantic Scholar, Crossref, and ArXiv APIs
        </p>
      </footer>
    </div>
  );
}

export default App;