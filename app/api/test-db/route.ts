import { NextRequest, NextResponse } from 'next/server'
import { sql } from '../../../lib/db'

export async function GET(request: NextRequest) {
  try {
    // Test basic connection
    const testQuery = await sql`SELECT 1 as test`
    
    // Check if tables exist
    const tables: { table_name: string }[] = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    
    // Check users table structure
    const usersColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `
    
    // Count existing users
    const userCount = await sql`SELECT COUNT(*) as count FROM users`
    
    return NextResponse.json({
      status: 'connected',
      test: testQuery[0],
      tables: tables.map(t => t.table_name),
      usersTable: usersColumns,
      userCount: userCount[0].count
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json(
      { 
        error: 'Database connection failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 