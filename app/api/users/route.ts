import { NextRequest, NextResponse } from 'next/server'
import { sql } from '../../../lib/db'
import bcrypt from 'bcryptjs'
import { verifyToken } from '../../../lib/auth'

// GET /api/users - List all users (admin only)
export async function GET(request: NextRequest) {
  try {
    console.log('=== USERS API GET REQUEST ===')
    console.log('Request URL:', request.url)
    console.log('Request method:', request.method)
    
    const authorization = request.headers.get('authorization')
    console.log('Authorization header:', authorization ? 'Present' : 'Missing')
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header')
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    const token = authorization.substring(7)
    console.log('Token extracted, length:', token.length)
    
    const decoded = verifyToken(token)
    console.log('Token decoded:', decoded ? 'Success' : 'Failed')
    console.log('User role:', decoded?.role)

    if (!decoded || decoded.role !== 'admin') {
      console.log('Access denied - not admin or token invalid')
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      )
    }
    
    console.log('Admin access granted, fetching users...')
    const users = await sql()`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        u.created_at,
        u.updated_at,
        COUNT(ci.id) as content_count
      FROM users u
      LEFT JOIN content_items ci ON u.id = ci.author_id
      GROUP BY u.id, u.email, u.name, u.role, u.created_at, u.updated_at
      ORDER BY u.created_at DESC
    `;
    
    console.log('Found', users.length, 'users')
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create new user (admin only)
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

    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      )
    }

    const { email, name, password, role } = await request.json()

    if (!email || !name || !password || !role) {
      return NextResponse.json(
        { error: 'Email, name, password, and role are required' },
        { status: 400 }
      )
    }

    if (!['admin', 'editor', 'user'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin, editor, or user' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await sql()`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const result = await sql()`
      INSERT INTO users (email, name, password_hash, role)
      VALUES (${email}, ${name}, ${hashedPassword}, ${role})
      RETURNING id, email, name, role, created_at
    `

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
} 
