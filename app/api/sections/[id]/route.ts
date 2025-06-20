import { NextRequest, NextResponse } from 'next/server'
import { sql } from '../../../../lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('PUT /api/sections/[id] - Starting request')
    console.log('Params:', params)
    
    const sectionId = parseInt(params.id)
    console.log('Parsed section ID:', sectionId)
    
    if (isNaN(sectionId)) {
      console.log('Invalid section ID')
      return NextResponse.json(
        { error: 'Invalid section ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    console.log('Request body:', body)
    
    const { name, description, emoji, order_index } = body
    
    console.log('Updating section with values:', { name, description, emoji, order_index, sectionId })
    
    // Use Neon's template literal syntax
    const result = await sql()`
      UPDATE sections 
      SET 
        name = ${name},
        description = ${description},
        emoji = ${emoji},
        order_index = ${order_index},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${sectionId}
      RETURNING *
    `
    
    console.log('Query result:', result)
    
    if (result.length === 0) {
      console.log('Section not found')
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      )
    }

    console.log('Update successful, returning:', result[0])
    return NextResponse.json(result[0])
  } catch (error: any) {
    console.error('Error updating section:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sectionId = parseInt(params.id)
    
    if (isNaN(sectionId)) {
      return NextResponse.json(
        { error: 'Invalid section ID' },
        { status: 400 }
      )
    }

    // Delete the section (content items will be deleted due to CASCADE)
    const result = await sql()`
      DELETE FROM sections 
      WHERE id = ${sectionId}
      RETURNING *
    `
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ message: 'Section deleted successfully' })
  } catch (error) {
    console.error('Error deleting section:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 