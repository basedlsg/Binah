import { NextRequest, NextResponse } from 'next/server'
import { getProjectById, updateProject } from '@/lib/data'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const project = await getProjectById(id)
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }
    
    // Increment likes
    const updatedProject = await updateProject(id, {
      likes: project.likes + 1
    })
    
    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error('Error liking project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}