'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Project {
  id: string
  title: string
  subtitle?: string
  description: string
  type: 'image' | 'video' | 'document' | 'audio'
  thumbnail: string
  mediaUrl?: string
  duration?: string
  uploadTime: string
  views: number
  likes: number
  comments: number
  botEngagements: number
  creator: string
  creatorAvatar: string
  published: boolean
}

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/projects')
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }
      const data = await response.json()
      setProjects(data)
    } catch (err) {
      setError('Failed to load projects. Please try again.')
      console.error('Error fetching projects:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = selectedFilter === 'all' || project.type === selectedFilter
    return matchesSearch && matchesFilter
  })

  const getTypeEmoji = (type: string) => {
    switch (type) {
      case 'image': return '🎨'
      case 'video': return '🎬'
      case 'document': return '📄'
      case 'audio': return '🎵'
      default: return '💫'
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-128 h-128 bg-gradient-radial from-white/5 to-transparent rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                MALKUTH
              </h1>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-400">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span>{projects.length} projects</span>
                </span>
                <span className="mx-2">•</span>
                <span>🤖 AI Engaged</span>
              </div>
              <button 
                onClick={() => window.location.href = '/admin'}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg border border-white/20 transition-all duration-200 hover:scale-105"
              >
                Admin
              </button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Hero Section */}
          <motion.section 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <motion.h2 
              className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-8 leading-tight"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Creative
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Universe
              </span>
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Explore cutting-edge projects where artificial intelligence meets creative expression.
              <br />
              Each piece represents a unique fusion of technology and artistry.
            </motion.p>
          </motion.section>

          {/* Search and Filter Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mb-12"
          >
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-2">
                {['all', 'image', 'video', 'document', 'audio'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedFilter === filter
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {filter === 'all' ? '✨ All' : `${getTypeEmoji(filter)} ${filter}`}
                  </button>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Projects Grid */}
          <motion.section
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={i}
                    variants={itemVariants}
                    className="group relative"
                  >
                    <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl animate-pulse" />
                    <div className="mt-4 space-y-3">
                      <div className="h-6 bg-gray-800 rounded-lg animate-pulse" />
                      <div className="h-4 bg-gray-800 rounded-lg w-2/3 animate-pulse" />
                      <div className="flex items-center space-x-4">
                        <div className="h-3 bg-gray-800 rounded w-16 animate-pulse" />
                        <div className="h-3 bg-gray-800 rounded w-12 animate-pulse" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : error ? (
              <motion.div 
                variants={itemVariants}
                className="text-center py-20"
              >
                <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
                  <span className="text-3xl">⚠️</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Error Loading Projects</h3>
                <p className="text-gray-400 mb-6">{error}</p>
                <button
                  onClick={fetchProjects}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors duration-200"
                >
                  Try Again
                </button>
              </motion.div>
            ) : filteredProjects.length === 0 ? (
              <motion.div 
                variants={itemVariants}
                className="text-center py-20"
              >
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-4xl opacity-50">📂</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {projects.length === 0 ? 'No Projects Yet' : 'No Matching Projects'}
                </h3>
                <p className="text-gray-400">
                  {projects.length === 0 
                    ? 'Start creating your first project to see it appear here.'
                    : 'Try adjusting your search or filter criteria.'
                  }
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                <AnimatePresence>
                  {filteredProjects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.1 }}
                      className="group relative cursor-pointer"
                      onClick={() => {
                        fetch(`/api/projects/${project.id}`, { method: 'GET' })
                        setProjects(prev => prev.map(p => 
                          p.id === project.id ? { ...p, views: p.views + 1 } : p
                        ))
                      }}
                    >
                      {/* Card */}
                      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 hover:border-white/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-purple-500/20">
                        {/* Thumbnail */}
                        <div className="aspect-video relative overflow-hidden">
                          <img 
                            src={project.thumbnail || '/api/placeholder/400/225'} 
                            alt={project.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                          
                          {/* Type badge */}
                          <div className="absolute top-3 left-3">
                            <span className="px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-xs font-medium text-white">
                              {getTypeEmoji(project.type)} {project.type}
                            </span>
                          </div>
                          
                          {/* Duration for videos */}
                          {project.duration && (
                            <div className="absolute bottom-3 right-3">
                              <span className="px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs text-white">
                                {project.duration}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="p-6">
                          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition-colors duration-200">
                            {project.title}
                          </h3>
                          <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                            {project.description}
                          </p>
                          
                          {/* Stats */}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center space-x-4">
                              <span className="flex items-center space-x-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                </svg>
                                <span>{project.views}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                </svg>
                                <span>{project.likes}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                </svg>
                                <span>{project.comments}</span>
                              </span>
                            </div>
                            <span className="text-purple-400 text-xs font-medium">
                              🤖 {project.botEngagements}
                            </span>
                          </div>
                        </div>
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-purple-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.section>

          {/* Stats Section */}
          {projects.length > 0 && !loading && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="mt-20 pt-12 border-t border-white/10"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                    {projects.length}
                  </div>
                  <div className="text-gray-400 text-sm">
                    Projects Published
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-900/20 to-green-900/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent mb-2">
                    {projects.reduce((sum, project) => sum + project.views, 0).toLocaleString()}
                  </div>
                  <div className="text-gray-400 text-sm">
                    Total Views
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-900/20 to-purple-900/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    {projects.reduce((sum, project) => sum + project.likes, 0).toLocaleString()}
                  </div>
                  <div className="text-gray-400 text-sm">
                    Total Likes
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </div>
      </main>
    </div>
  )
}