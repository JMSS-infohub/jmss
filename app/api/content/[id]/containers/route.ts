import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

// GET /api/content/[id]/containers - Get all container instances for a content item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contentId = parseInt(params.id)
    
    if (isNaN(contentId)) {
      return NextResponse.json({ error: 'Invalid content ID' }, { status: 400 })
    }

    const containers = await sql()`
      SELECT 
        cci.id,
        cci.content_item_id,
        cci.container_type,
        cci.content,
        cci.order_index,
        cci.created_at,
        cci.updated_at
      FROM content_container_instances cci
      WHERE cci.content_item_id = ${contentId}
      ORDER BY cci.order_index ASC
    `

    return NextResponse.json(containers)
  } catch (error) {
    console.error('Error fetching container instances:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/content/[id]/containers - Add a new container instance
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    if (isNaN(contentId)) {
      return NextResponse.json({ error: 'Invalid content ID' }, { status: 400 })
    }

    const body = await request.json()
    const { container_type, content, order_index = 0 } = body

    if (!container_type || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the content item exists and user has permission
    const contentItem = await sql()`
      SELECT id, author_id FROM content_items WHERE id = ${contentId}
    `
    
    if (contentItem.length === 0) {
      return NextResponse.json({ error: 'Content item not found' }, { status: 404 })
    }

    if (contentItem[0].author_id !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const newContainer = await sql()`
      INSERT INTO content_container_instances 
        (content_item_id, container_type, content, order_index)
      VALUES 
        (${contentId}, ${container_type}, ${content}, ${order_index})
      RETURNING *
    `

    return NextResponse.json(newContainer[0], { status: 201 })
  } catch (error) {
    console.error('Error creating container instance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 