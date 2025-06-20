import { NextRequest, NextResponse } from 'next/server'
import { sql } from '../../../../lib/db'
import bcrypt from 'bcryptjs'
import { verifyToken } from '../../../../lib/auth'

// PUT /api/users/[id] - Update user (admin only)
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

    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      )
    }

    const userId = parseInt(params.id)
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const { email, name, role, password } = await request.json()

    if (!email || !name || !role) {
      return NextResponse.json(
        { error: 'Email, name, and role are required' },
        { status: 400 }
      )
    }

    if (!['admin', 'editor', 'user'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin, editor, or user' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await sql`
      SELECT id FROM users WHERE id = ${userId}
    `

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if email is already taken by another user
    const emailCheck = await sql`
      SELECT id FROM users WHERE email = ${email} AND id != ${userId}
    `

    if (emailCheck.length > 0) {
      return NextResponse.json(
        { error: 'Email is already taken by another user' },
        { status: 409 }
      )
    }

    // Update user (with or without password)
    let result;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12)
      result = await sql`
        UPDATE users 
        SET email = ${email}, name = ${name}, role = ${role}, password_hash = ${hashedPassword}, updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id, email, name, role, created_at, updated_at
      `
    } else {
      result = await sql`
        UPDATE users 
        SET email = ${email}, name = ${name}, role = ${role}, updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id, email, name, role, created_at, updated_at
      `
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete user (admin only)
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

    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      )
    }

    const userId = parseInt(params.id)
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // Prevent admin from deleting themselves
    if (decoded.id === userId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await sql`
      SELECT id FROM users WHERE id = ${userId}
    `

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete user
    await sql`
      DELETE FROM users WHERE id = ${userId}
    `

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
} 