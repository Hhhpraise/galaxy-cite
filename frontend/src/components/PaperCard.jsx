import React from 'react';
import { motion } from 'framer-motion';
import { X, ExternalLink, Calendar, Users, Quote, BarChart, Tag, Link as LinkIcon } from 'lucide-react';

const PaperCard = ({ paper, onClose }) => {
  const formatAuthors = (authors) => {
    if (!authors || authors.length === 0) return 'Unknown authors';
    if (authors.length <= 3) return authors.join(', ');
    return `${authors.slice(0, 3).join(', ')} et al.`;
  };

  const formatAbstract = (abstract) => {
    if (!abstract) return 'No abstract available';
    if (abstract.length > 300) return abstract.substring(0, 300) + '...';
    return abstract;
  };

  const handleOpenPaper = () => {
    if (paper.url) {
      window.open(paper.url, '_blank', 'noopener,noreferrer');
    } else if (paper.doi) {
      window.open(`https://doi.org/${paper.doi}`, '_blank', 'noopener,noreferrer');
    } else if (paper.arxiv_id) {
      window.open(`https://arxiv.org/abs/${paper.arxiv_id}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute -top-2 -right-2 z-10 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors shadow-lg"
      >
        <X size={16} />
      </button>

      {/* Paper header */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white mb-2 pr-6">
          {paper.title}
        </h3>

        <div className="flex items-center text-sm text-gray-400 mb-3">
          <Users size={14} className="mr-1" />
          <span>{formatAuthors(paper.authors)}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Calendar size={14} className="text-blue-400" />
            <span className="text-xs text-gray-400">Year</span>
          </div>
          <span className="text-lg font-semibold">{paper.year || 'Unknown'}</span>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <BarChart size={14} className="text-green-400" />
            <span className="text-xs text-gray-400">Citations</span>
          </div>
          <span className="text-lg font-semibold">
            {paper.citation_count?.toLocaleString() || 'N/A'}
          </span>
        </div>
      </div>

      {/* Abstract */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <Quote size={14} className="text-purple-400" />
          <span className="text-sm font-medium">Abstract</span>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          {formatAbstract(paper.abstract)}
        </p>
      </div>

      {/* Fields/Tags */}
      {paper.fields && paper.fields.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Tag size={14} className="text-yellow-400" />
            <span className="text-sm font-medium">Fields</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {paper.fields.slice(0, 3).map((field, idx) => (
              <span
                key={idx}
                className="px-2 py-1 text-xs bg-gray-800 rounded-full text-gray-300"
              >
                {field}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Paper ID */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <LinkIcon size={14} className="text-cyan-400" />
          <span className="text-sm font-medium">Identifier</span>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3">
          <code className="text-xs text-gray-300 break-all">
            {paper.doi && `DOI: ${paper.doi}`}
            {paper.arxiv_id && `arXiv: ${paper.arxiv_id}`}
            {!paper.doi && !paper.arxiv_id && `ID: ${paper.id}`}
          </code>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex space-x-3">
        <button
          onClick={handleOpenPaper}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-lg transition-all"
        >
          <ExternalLink size={16} />
          <span className="font-medium">Open Paper</span>
        </button>

        <button
          onClick={onClose}
          className="px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <span className="font-medium">Close</span>
        </button>
      </div>
    </motion.div>
  );
};

export default PaperCard;