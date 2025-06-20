import { NextRequest, NextResponse } from 'next/server'
import { sql } from '../../../lib/db'
import { verifyToken } from '../../../lib/auth'

export async function GET(request: NextRequest) {
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

    const contents = await sql`
      SELECT 
        ci.*,
        s.name as section_name
      FROM content_items ci
      LEFT JOIN sections s ON ci.section_id = s.id
      ORDER BY ci.created_at DESC
    `

    // Parse JSON content for each item
    const parsedContents = contents.map((item: any) => {
      if (typeof item.content === 'string') {
        try {
          item.content = JSON.parse(item.content)
        } catch (error) {
          console.error('Error parsing content JSON for item:', item.id, error)
          item.content = {}
        }
      }
      return item
    })

    return NextResponse.json(parsedContents)
  } catch (error) {
    console.error('Error fetching content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const {
      title,
      description,
      section_id,
      emoji,
      content,
      container_type,
      published
    } = await request.json()

    console.log('Creating content with data:', {
      title,
      description,
      section_id,
      emoji,
      container_type,
      published
    })

    if (!title || !section_id || !container_type) {
      return NextResponse.json(
        { error: 'Title, section_id, and container_type are required' },
        { status: 400 }
      )
    }

    // Check if section exists
    console.log('Checking if section exists for section_id:', section_id)
    const sectionCheck = await sql`
      SELECT id FROM sections WHERE id = ${section_id}
    `
    
    if (sectionCheck.length === 0) {
      console.error('Section does not exist for section_id:', section_id)
      return NextResponse.json(
        { error: `Section with id ${section_id} does not exist` },
        { status: 400 }
      )
    }

    console.log('Section exists, creating content item...')
    const result = await sql`
      INSERT INTO content_items (
        title, description, section_id, emoji, content, 
        container_type, author_id, published
      ) VALUES (
        ${title}, ${description}, ${section_id}, ${emoji}, 
        ${JSON.stringify(content)}, ${container_type}, 
        ${decoded.id}, ${published}
      ) RETURNING *
    `

    console.log('Content created successfully:', result[0]?.id)
    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error creating content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 