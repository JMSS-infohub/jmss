import { NextRequest, NextResponse } from 'next/server'
import { sql } from '../../../lib/db'

export async function GET(request: NextRequest) {
  try {
    const sections = await sql()`
      SELECT 
        s.id,
        s.name,
        s.description,
        s.emoji,
        s.order_index,
        s.created_at,
        s.updated_at,
        COUNT(ci.id) as content_count
      FROM sections s
      LEFT JOIN content_items ci ON s.id = ci.section_id
      GROUP BY s.id, s.name, s.description, s.emoji, s.order_index, s.created_at, s.updated_at
      ORDER BY s.order_index ASC, s.name ASC
    `;

    console.log('Fetched sections:', sections.length > 0 ? sections.map((s: any) => ({ id: s.id, name: s.name })) : 'No sections found')
    return NextResponse.json(sections)
  } catch (error) {
    console.error('Error fetching sections:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, emoji, order_index } = await request.json()
    
    if (!name) {
      return NextResponse.json(
        { error: 'Section name is required' },
        { status: 400 }
      )
    }

    const result = await sql()`
      INSERT INTO sections (name, description, emoji, order_index)
      VALUES (${name}, ${description || ''}, ${emoji || ''}, ${order_index || 0})
      RETURNING *
    `
    
    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error creating section:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
