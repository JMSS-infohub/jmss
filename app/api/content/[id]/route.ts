import { NextRequest, NextResponse } from 'next/server'
import { sql } from '../../../../lib/db'
import { verifyToken } from '../../../../lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authorization = request.headers.get('authorization')
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    const token = authorization.substring(7)
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const contentId = parseInt(params.id)
    
    if (isNaN(contentId)) {
      return NextResponse.json(
        { error: 'Invalid content ID' },
        { status: 400 }
      )
    }

    const result = await sql`
      SELECT 
        ci.*,
        s.name as section_name
      FROM content_items ci
      LEFT JOIN sections s ON ci.section_id = s.id
      WHERE ci.id = ${contentId}
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    const contentItem = result[0]
    
    // Parse the JSON content if it's a string
    if (typeof contentItem.content === 'string') {
      try {
        contentItem.content = JSON.parse(contentItem.content)
      } catch (error) {
        console.error('Error parsing content JSON:', error)
        contentItem.content = {}
      }
    }

    return NextResponse.json(contentItem)
  } catch (error) {
    console.error('Error fetching content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authorization = request.headers.get('authorization')
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    const token = authorization.substring(7)
    const decoded = verifyToken(token)

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'editor')) {
      return NextResponse.json(
        { error: 'Editor privileges required' },
        { status: 403 }
      )
    }

    const contentId = parseInt(params.id)
    
    if (isNaN(contentId)) {
      return NextResponse.json(
        { error: 'Invalid content ID' },
        { status: 400 }
      )
    }

    const {
      title,
      description,
      section_id,
      emoji,
      content,
      container_type,
      published
    } = await request.json()

    console.log(`=== CONTENT UPDATE API CALLED ===`)
    console.log(`Content ID: ${contentId}`)
    console.log(`Title: ${title}`)
    console.log(`Section ID: ${section_id}`)
    console.log(`Container Type: ${container_type}`)
    console.log(`Content:`, content)
    console.log(`Content JSON:`, JSON.stringify(content))
    console.log(`Published: ${published}`)

    if (!title || !section_id || !container_type) {
      return NextResponse.json(
        { error: 'Title, section_id, and container_type are required' },
        { status: 400 }
      )
    }

    const result = await sql`
      UPDATE content_items SET
        title = ${title},
        description = ${description},
        section_id = ${section_id},
        emoji = ${emoji},
        content = ${JSON.stringify(content)},
        container_type = ${container_type},
        published = ${published},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${contentId}
      RETURNING *
    `

    console.log(`UPDATE RESULT:`, result)
    console.log(`Rows updated: ${result.length}`)

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    console.log(`Successfully updated content item ${contentId}`)
    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error updating content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authorization = request.headers.get('authorization')
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    const token = authorization.substring(7)
    const decoded = verifyToken(token)

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'editor')) {
      return NextResponse.json(
        { error: 'Editor privileges required' },
        { status: 403 }
      )
    }

    const contentId = parseInt(params.id)
    
    if (isNaN(contentId)) {
      return NextResponse.json(
        { error: 'Invalid content ID' },
        { status: 400 }
      )
    }

    const result = await sql`
      DELETE FROM content_items 
      WHERE id = ${contentId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Content deleted successfully' })
  } catch (error) {
    console.error('Error deleting content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 