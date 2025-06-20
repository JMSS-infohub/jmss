import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

// GET /api/content/[id]/containers/[containerId] - Get a specific container instance
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; containerId: string } }
) {
  try {
    const contentId = parseInt(params.id)
    const containerId = parseInt(params.containerId)
    
    if (isNaN(contentId) || isNaN(containerId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const container = await sql`
      SELECT 
        cci.id,
        cci.content_item_id,
        cci.container_type,
        cci.content,
        cci.order_index,
        cci.created_at,
        cci.updated_at
      FROM content_container_instances cci
      WHERE cci.id = ${containerId} AND cci.content_item_id = ${contentId}
    `

    if (container.length === 0) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 })
    }

    return NextResponse.json(container[0])
  } catch (error) {
    console.error('Error fetching container instance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/content/[id]/containers/[containerId] - Update a container instance
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; containerId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const contentId = parseInt(params.id)
    const containerId = parseInt(params.containerId)
    
    if (isNaN(contentId) || isNaN(containerId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const body = await request.json()
    const { container_type, content, order_index } = body

    // Verify the content item exists and user has permission
    const contentItem = await sql`
      SELECT id, author_id FROM content_items WHERE id = ${contentId}
    `
    
    if (contentItem.length === 0) {
      return NextResponse.json({ error: 'Content item not found' }, { status: 404 })
    }

    if (contentItem[0].author_id !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify the container exists
    const existingContainer = await sql`
      SELECT id FROM content_container_instances 
      WHERE id = ${containerId} AND content_item_id = ${contentId}
    `
    
    if (existingContainer.length === 0) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (container_type !== undefined) updateData.container_type = container_type
    if (content !== undefined) updateData.content = content
    if (order_index !== undefined) updateData.order_index = order_index

    const updatedContainer = await sql`
      UPDATE content_container_instances 
      SET 
        container_type = COALESCE(${container_type}, container_type),
        content = COALESCE(${content}, content),
        order_index = COALESCE(${order_index}, order_index),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${containerId} AND content_item_id = ${contentId}
      RETURNING *
    `

    return NextResponse.json(updatedContainer[0])
  } catch (error) {
    console.error('Error updating container instance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/content/[id]/containers/[containerId] - Delete a container instance
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; containerId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const contentId = parseInt(params.id)
    const containerId = parseInt(params.containerId)
    
    if (isNaN(contentId) || isNaN(containerId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    // Verify the content item exists and user has permission
    const contentItem = await sql`
      SELECT id, author_id FROM content_items WHERE id = ${contentId}
    `
    
    if (contentItem.length === 0) {
      return NextResponse.json({ error: 'Content item not found' }, { status: 404 })
    }

    if (contentItem[0].author_id !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete the container
    const result = await sql`
      DELETE FROM content_container_instances 
      WHERE id = ${containerId} AND content_item_id = ${contentId}
    `

    if (result.count === 0) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Container deleted successfully' })
  } catch (error) {
    console.error('Error deleting container instance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 