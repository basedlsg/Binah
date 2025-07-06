'use client'

import React, { useState, useEffect } from 'react'
import PageLayout from '@/components/ui/templates/PageLayout'
import ProjectGrid from '@/components/ui/organisms/ProjectGrid'
import Card from '@/components/ui/molecules/Card'
import FileUpload from '@/components/ui/molecules/FileUpload'
import Button from '@/components/ui/atoms/Button'
import Input from '@/components/ui/atoms/Input'
import Textarea from '@/components/ui/atoms/Textarea'
import Typography from '@/components/ui/atoms/Typography'

interface Project {
  id: string
  title: string
  subtitle?: string
  description: string
  type: 'image' | 'video' | 'document' | 'audio'
  thumbnail: string
  mediaUrl?: string
  duration?: string
  creator: string
  creatorAvatar: string
  uploadTime: string
  views: number
  likes: number
  comments: number
  botEngagements: number
  published: boolean
}

interface UploadResponse {
  filename: string
  url: string
  size: number
  type: string
}

export default function AdminPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [currentProject, setCurrentProject] = useState<Partial<Project> | null>(null)
  const [uploadedThumbnail, setUploadedThumbnail] = useState<string | null>(null)
  const [uploadedMedia, setUploadedMedia] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/admin/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const uploadFile = async (file: File): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Upload failed')
    }
    
    return response.json()
  }

  const getFileType = (file: File): 'image' | 'video' | 'document' | 'audio' => {
    if (file.type.startsWith('image/')) return 'image'
    if (file.type.startsWith('video/')) return 'video'
    if (file.type.startsWith('audio/')) return 'audio'
    return 'document'
  }

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return
    
    const file = files[0]
    setIsUploading(true)
    
    try {
      const uploadResult = await uploadFile(file)
      const fileType = getFileType(file)
      
      // Start creating a new project
      setCurrentProject({
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
        type: fileType,
        thumbnail: fileType === 'image' ? uploadResult.url : '',
        mediaUrl: uploadResult.url,
        creator: 'Admin',
        creatorAvatar: '',
        description: '',
        published: false
      })
      
      if (fileType === 'image') {
        setUploadedThumbnail(uploadResult.url)
      }
      setUploadedMedia(uploadResult.url)
      
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleThumbnailUpload = async (files: FileList) => {
    if (files.length === 0) return
    
    const file = files[0]
    
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file for the thumbnail')
      return
    }
    
    try {
      const uploadResult = await uploadFile(file)
      setUploadedThumbnail(uploadResult.url)
      if (currentProject) {
        setCurrentProject({ ...currentProject, thumbnail: uploadResult.url })
      }
    } catch (error) {
      console.error('Thumbnail upload error:', error)
      alert('Thumbnail upload failed. Please try again.')
    }
  }

  const saveProject = async () => {
    if (!currentProject || !currentProject.title || !currentProject.description) {
      alert('Please fill in all required fields')
      return
    }
    
    setSaving(true)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentProject)
      })
      
      if (!response.ok) {
        throw new Error('Failed to save project')
      }
      
      const savedProject = await response.json()
      setProjects(prev => [savedProject, ...prev])
      setCurrentProject(null)
      setUploadedThumbnail(null)
      setUploadedMedia(null)
      
      alert('Project saved successfully!')
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save project. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const publishProject = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: true })
      })
      
      if (!response.ok) {
        throw new Error('Failed to publish project')
      }
      
      await fetchProjects()
      alert('Project published successfully!')
    } catch (error) {
      console.error('Publish error:', error)
      alert('Failed to publish project. Please try again.')
    }
  }

  const deleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return
    
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete project')
      }
      
      setProjects(prev => prev.filter(p => p.id !== id))
      alert('Project deleted successfully!')
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete project. Please try again.')
    }
  }

  const handleProjectEdit = (project: Project) => {
    setCurrentProject(project)
    setUploadedThumbnail(project.thumbnail)
    setUploadedMedia(project.mediaUrl || '')
  }

  const publishedCount = projects.filter(p => p.published).length
  const draftCount = projects.filter(p => !p.published).length

  return (
    <PageLayout
      title="MALKUTH ADMIN"
      subtitle="Content Management Portal"
      headerActions={
        <div className="flex items-center space-x-3">
          <div className="hidden sm:block text-right">
            <Typography variant="small" color="secondary">
              {publishedCount} published • {draftCount} drafts
            </Typography>
            <Typography variant="caption" color="muted">
              🤖 AI Bots Ready
            </Typography>
          </div>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => window.location.href = '/admin/bots'}
          >
            🤖 Manage Bots
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => window.location.href = '/'}
          >
            View Site
          </Button>
        </div>
      }
      maxWidth="2xl"
    >
      {/* Upload Section */}
      {!currentProject && (
        <div className="mb-12">
          <div className="mb-6">
            <Typography variant="h3" className="mb-2">
              Upload New Project
            </Typography>
            <Typography variant="body" color="secondary">
              Upload images, videos, documents, or audio files to create new projects
            </Typography>
          </div>
          
          <FileUpload
            onFileSelect={handleFileUpload}
            loading={isUploading}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          />
        </div>
      )}

      {/* Project Editor */}
      {currentProject && (
        <Card className="mb-12" padding="lg">
          <div className="mb-6">
            <Typography variant="h3" className="mb-2">
              Edit Project Details
            </Typography>
            <Typography variant="body" color="secondary">
              Configure your project settings and metadata
            </Typography>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Fields */}
            <div className="space-y-6">
              <Input
                label="Title *"
                value={currentProject.title || ''}
                onChange={(e) => setCurrentProject({...currentProject, title: e.target.value})}
                placeholder="Enter project title"
              />
              
              <Input
                label="Subtitle"
                value={currentProject.subtitle || ''}
                onChange={(e) => setCurrentProject({...currentProject, subtitle: e.target.value})}
                placeholder="Enter project subtitle (optional)"
              />
              
              <Textarea
                label="Description *"
                value={currentProject.description || ''}
                onChange={(e) => setCurrentProject({...currentProject, description: e.target.value})}
                placeholder="Describe your project"
                rows={4}
              />
              
              <Input
                label="Creator Name"
                value={currentProject.creator || ''}
                onChange={(e) => setCurrentProject({...currentProject, creator: e.target.value})}
                placeholder="Enter creator name"
              />

              {(currentProject.type === 'video' || currentProject.type === 'audio') && (
                <Input
                  label="Duration"
                  value={currentProject.duration || ''}
                  onChange={(e) => setCurrentProject({...currentProject, duration: e.target.value})}
                  placeholder="e.g., 5:42"
                  helperText="Format: MM:SS or HH:MM:SS"
                />
              )}
            </div>
            
            {/* Preview and Thumbnail */}
            <div className="space-y-6">
              <div>
                <Typography variant="h6" className="mb-3">
                  Thumbnail Image
                </Typography>
                {uploadedThumbnail ? (
                  <div className="space-y-3">
                    <img 
                      src={uploadedThumbnail} 
                      alt="Thumbnail" 
                      className="w-full aspect-video object-cover rounded-lg"
                    />
                    <FileUpload
                      onFileSelect={handleThumbnailUpload}
                      accept="image/*"
                    >
                      <Button variant="secondary" size="sm">
                        Change Thumbnail
                      </Button>
                    </FileUpload>
                  </div>
                ) : (
                  <FileUpload
                    onFileSelect={handleThumbnailUpload}
                    accept="image/*"
                  >
                    <div className="text-center py-8">
                      <div className="w-12 h-12 mx-auto bg-gray-700 rounded-full flex items-center justify-center mb-3">
                        🖼️
                      </div>
                      <Typography variant="body" color="secondary" className="mb-3">
                        Upload thumbnail image
                      </Typography>
                      <Button variant="secondary" size="sm">
                        Choose Image
                      </Button>
                    </div>
                  </FileUpload>
                )}
              </div>
              
              <Card variant="bordered" padding="md">
                <Typography variant="h6" className="mb-3">
                  Project Info
                </Typography>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white capitalize">{currentProject.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Media:</span>
                    <span className={uploadedMedia ? "text-green-400" : "text-gray-400"}>
                      {uploadedMedia ? "Uploaded" : "Not uploaded"}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-800">
            <Button
              onClick={saveProject}
              loading={saving}
              className="flex-1 sm:flex-none"
            >
              Save Project
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setCurrentProject(null)
                setUploadedThumbnail(null)
                setUploadedMedia(null)
              }}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Projects List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Typography variant="h3" className="mb-2">
              Your Projects
            </Typography>
            <Typography variant="body" color="secondary">
              Manage your uploaded projects and content
            </Typography>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchProjects}
          >
            Refresh
          </Button>
        </div>
        
        <ProjectGrid
          projects={projects}
          showAdminActions={true}
          onProjectEdit={handleProjectEdit}
          onProjectDelete={deleteProject}
          onProjectPublish={publishProject}
          emptyMessage="No projects yet. Upload your first project to get started!"
        />
      </div>
    </PageLayout>
  )
}