// Simple file-based storage for development
// In production, this would be replaced with a database
import fs from 'fs/promises'
import path from 'path'

export interface Project {
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

const STORAGE_PATH = path.join(process.cwd(), 'data')
const PROJECTS_FILE = path.join(STORAGE_PATH, 'projects.json')
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')

// Ensure storage directories exist
export async function ensureStorageExists() {
  try {
    await fs.access(STORAGE_PATH)
  } catch {
    await fs.mkdir(STORAGE_PATH, { recursive: true })
  }
  
  try {
    await fs.access(UPLOADS_DIR)
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true })
  }
}

// Load all projects
export async function loadProjects(): Promise<Project[]> {
  try {
    await ensureStorageExists()
    const data = await fs.readFile(PROJECTS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    // Return empty array if file doesn't exist
    return []
  }
}

// Save all projects
export async function saveProjects(projects: Project[]): Promise<void> {
  await ensureStorageExists()
  await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2))
}

// Get published projects only
export async function getPublishedProjects(): Promise<Project[]> {
  const projects = await loadProjects()
  return projects.filter(project => project.published)
}

// Get project by ID
export async function getProjectById(id: string): Promise<Project | null> {
  const projects = await loadProjects()
  return projects.find(project => project.id === id) || null
}

// Add new project
export async function addProject(project: Omit<Project, 'id' | 'uploadTime' | 'views' | 'likes' | 'comments' | 'botEngagements'>): Promise<Project> {
  const projects = await loadProjects()
  
  const newProject: Project = {
    ...project,
    id: generateId(),
    uploadTime: new Date().toISOString(),
    views: 0,
    likes: 0,
    comments: 0,
    botEngagements: 0,
  }
  
  projects.unshift(newProject) // Add to beginning
  await saveProjects(projects)
  
  return newProject
}

// Update project
export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
  const projects = await loadProjects()
  const index = projects.findIndex(project => project.id === id)
  
  if (index === -1) return null
  
  projects[index] = { ...projects[index], ...updates }
  await saveProjects(projects)
  
  return projects[index]
}

// Delete project
export async function deleteProject(id: string): Promise<boolean> {
  const projects = await loadProjects()
  const filteredProjects = projects.filter(project => project.id !== id)
  
  if (filteredProjects.length === projects.length) return false
  
  await saveProjects(filteredProjects)
  return true
}

// Increment views
export async function incrementViews(id: string): Promise<void> {
  const projects = await loadProjects()
  const project = projects.find(p => p.id === id)
  
  if (project) {
    project.views += 1
    await saveProjects(projects)
  }
}

// Update engagement metrics
export async function updateEngagement(id: string, type: 'likes' | 'comments' | 'botEngagements', increment: number = 1): Promise<void> {
  const projects = await loadProjects()
  const project = projects.find(p => p.id === id)
  
  if (project) {
    project[type] += increment
    await saveProjects(projects)
  }
}

// Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}