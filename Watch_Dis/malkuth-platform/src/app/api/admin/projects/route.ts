import { NextResponse } from 'next/server'
import { loadProjects } from '@/lib/storage'

// GET /api/admin/projects - Get ALL projects (including unpublished)
export async function GET() {
  try {
    const projects = await loadProjects()
    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching all projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}