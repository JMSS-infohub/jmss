import { NextRequest, NextResponse } from 'next/server'
import { sql } from '../../../../../lib/db'

export async function GET(
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

    console.log(`Fetching content for section ID: ${sectionId}`)
    
    // Add a small delay if this is called via cache-busting (after updates)
    const url = new URL(request.url)
    if (url.searchParams.has('t')) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // First, let's check if there's ANY content for this section (debug query)
    const allContentForSection = await sql`
      SELECT id, title, section_id, published, order_index, created_at
      FROM content_items 
      WHERE section_id = ${sectionId}
    `
    
    console.log(`Debug: Found ${allContentForSection.length} total content items for section ${sectionId}:`, 
      allContentForSection.map((item: any) => ({ 
        id: item.id, 
        title: item.title, 
        published: item.published,
        order_index: item.order_index,
        created_at: item.created_at 
      }))
    )

    const contentItems = await sql`
      SELECT 
        id,
        title,
        description,
        content,
        container_type,
        published,
        order_index,
        created_at,
        updated_at
      FROM content_items 
      WHERE section_id = ${sectionId}
      ORDER BY COALESCE(order_index, 0) ASC, created_at ASC
    `

    console.log(`Main query found ${contentItems.length} content items for section ${sectionId}`)
    
    // Log the actual content structure
    if (contentItems.length > 0) {
      console.log('FULL CONTENT STRUCTURE FOR DEBUGGING:')
      contentItems.forEach((item: any) => {
        console.log(`Item ID ${item.id} (${item.title}):`)
        console.log('  - container_type:', item.container_type)
        console.log('  - content:', typeof item.content === 'string' ? 'STRING' : 'OBJECT', item.content)
        console.log('  ---')
      })
    }
    
    // If there's a discrepancy, let's debug it
    if (allContentForSection.length !== contentItems.length) {
      console.log('DISCREPANCY DETECTED!')
      console.log('Debug query found:', allContentForSection.length)
      console.log('Main query found:', contentItems.length)
      console.log('All content order_index values:', allContentForSection.map((item: any) => ({ 
        id: item.id, 
        order_index: item.order_index 
      })))
    }

    return NextResponse.json(contentItems)
  } catch (error) {
    console.error('Error fetching section content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 