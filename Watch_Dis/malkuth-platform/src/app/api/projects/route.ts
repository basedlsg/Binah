import { NextRequest, NextResponse } from 'next/server'
import { getPublishedProjects, addProject, loadProjects } from '@/lib/storage'

// GET /api/projects - Get all published projects
export async function GET() {
  try {
    const projects = await getPublishedProjects()
    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      title,
      subtitle,
      description,
      type,
      thumbnail,
      mediaUrl,
      duration,
      creator,
      creatorAvatar,
      published = false
    } = body
    
    // Validate required fields
    if (!title || !description || !type || !creator) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, type, creator' },
        { status: 400 }
      )
    }
    
    const project = await addProject({
      title,
      subtitle,
      description,
      type,
      thumbnail: thumbnail || '/uploads/default-thumbnail.jpg',
      mediaUrl,
      duration,
      creator,
      creatorAvatar: creatorAvatar || '/uploads/default-avatar.jpg',
      published
    })
    
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}