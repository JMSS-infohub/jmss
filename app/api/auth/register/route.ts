import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUserByEmail } from '../../../../lib/auth'

// Add CORS headers for network access
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 200 }))
}

export async function POST(request: NextRequest) {
  try {
    console.log('Registration attempt started...')
    
    const body = await request.json()
    console.log('Request body:', { ...body, password: '[HIDDEN]' })
    console.log('Request origin:', request.headers.get('origin'))
    console.log('Request host:', request.headers.get('host'))
    
    const { email, password, name, role } = body

    // Normalize the password - trim whitespace and ensure consistent encoding
    const normalizedPassword = password?.trim()
    console.log('Original password length:', password?.length)
    console.log('Normalized password length:', normalizedPassword?.length)

    if (!email || !normalizedPassword || !name) {
      console.log('Missing required fields')
      return addCorsHeaders(NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      ))
    }

    if (normalizedPassword.length < 6) {
      console.log('Password too short')
      return addCorsHeaders(NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      ))
    }

    console.log('Checking if user exists...')
    // Check if user already exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      console.log('User already exists')
      return addCorsHeaders(NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      ))
    }

    console.log('Creating new user...')
    // Create new user
    const user = await createUser(email, normalizedPassword, name, role || 'user')
    console.log('User creation result:', user ? 'success' : 'failed')
    
    if (!user) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      ))
    }

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }

    console.log('Registration successful')
    return addCorsHeaders(NextResponse.json({ user: userData }))
  } catch (error) {
    console.error('Registration error details:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return addCorsHeaders(NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    ))
  }
} 