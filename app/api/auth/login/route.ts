import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, verifyPassword, generateToken } from '../../../../lib/auth'

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
    // Get raw body for debugging
    const body = await request.json()
    const { email, password } = body
    
    console.log('Login attempt for email:', email)
    console.log('Request origin:', request.headers.get('origin'))
    console.log('Request host:', request.headers.get('host'))
    console.log('Content-Type:', request.headers.get('content-type'))
    
    // Normalize the password - trim whitespace and ensure consistent encoding
    const normalizedPassword = password?.trim()
    console.log('Original password length:', password?.length)
    console.log('Normalized password length:', normalizedPassword?.length)
    console.log('Password bytes (first 10):', password ? [...password.slice(0, 10)].map(c => c.charCodeAt(0)) : 'N/A')

    if (!email || !normalizedPassword) {
      console.log('Missing email or password')
      return addCorsHeaders(NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      ))
    }

    console.log('Looking up user by email...')
    const user = await getUserByEmail(email)
    if (!user) {
      console.log('User not found in database')
      return addCorsHeaders(NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      ))
    }

    console.log('User found, verifying password...')
    console.log('User data:', { id: user.id, email: user.email, name: user.name, role: user.role })
    const isValidPassword = await verifyPassword(normalizedPassword, user.password_hash)
    console.log('Password verification result:', isValidPassword)
    if (!isValidPassword) {
      console.log('Password verification failed')
      return addCorsHeaders(NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      ))
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    })

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }

    console.log('Login successful! Returning token and user data')
    return addCorsHeaders(NextResponse.json({ token, user: userData }))
  } catch (error) {
    console.error('Login error:', error)
    return addCorsHeaders(NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ))
  }
}