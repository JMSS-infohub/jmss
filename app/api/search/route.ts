import { NextRequest, NextResponse } from 'next/server'
import { sql } from '../../../lib/db'

interface SearchResult {
  type: string;
  id: number;
  title: string;
  content: string;
  section_name: string;
  emoji: string;
  url: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    
    if (!q || q.trim().length < 2) {
      return NextResponse.json({ results: [] })
    }

    const searchTerm = `%${q.toLowerCase()}%`
    
    // Search in sections
    const sectionsResult = await sql()`
      SELECT 
        'section' as type,
        id,
        name as title,
        description as content,
        emoji,
        name as section_name
      FROM sections 
      WHERE LOWER(name) LIKE ${searchTerm} OR LOWER(description) LIKE ${searchTerm}
    `

    // Search in content items
    const contentResult = await sql()`
      SELECT 
        'content' as type,
        ci.id,
        ci.title,
        CASE 
          WHEN ci.container_type = 'text' THEN ci.content->>'text'
          WHEN ci.container_type = 'list' AND ci.content ? 'items' THEN 
            array_to_string(ARRAY(SELECT jsonb_array_elements_text(ci.content->'items')), ', ')
          WHEN ci.container_type = 'tabs' AND ci.content ? 'tabs' THEN
            array_to_string(ARRAY(SELECT tab->>'content' FROM jsonb_array_elements(ci.content->'tabs') AS tab), ', ')
          ELSE 'Content available'
        END as content,
        s.name as section_name,
        s.emoji,
        s.id as section_id
      FROM content_items ci
      JOIN sections s ON ci.section_id = s.id
      WHERE ci.published = true 
        AND (
          LOWER(ci.title) LIKE ${searchTerm}
          OR CASE 
            WHEN ci.container_type = 'text' THEN LOWER(ci.content->>'text') LIKE ${searchTerm}
            WHEN ci.container_type = 'list' AND ci.content ? 'items' THEN 
              LOWER(array_to_string(ARRAY(SELECT jsonb_array_elements_text(ci.content->'items')), ', ')) LIKE ${searchTerm}
            WHEN ci.container_type = 'tabs' AND ci.content ? 'tabs' THEN
              LOWER(array_to_string(ARRAY(SELECT tab->>'content' FROM jsonb_array_elements(ci.content->'tabs') AS tab), ', ')) LIKE ${searchTerm}
            ELSE false
          END
        )
      ORDER BY ci.order_index
    `

    const results: SearchResult[] = [
      ...sectionsResult.map((row: any) => ({
        type: row.type,
        id: row.id,
        title: row.title,
        content: row.content?.substring(0, 200) + (row.content?.length > 200 ? '...' : ''),
        section_name: row.section_name,
        emoji: row.emoji,
        url: `/${row.section_name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')}`
      })),
      ...contentResult.map((row: any) => ({
        type: row.type,
        id: row.id,
        title: row.title,
        content: row.content?.substring(0, 200) + (row.content?.length > 200 ? '...' : ''),
        section_name: row.section_name,
        emoji: row.emoji,
        url: `/${row.section_name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')}#content-${row.id}`
      }))
    ]

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
} 
