import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql, User } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  console.log('verifyPassword: Comparing password...');
  console.log('verifyPassword: Password length:', password.length);
  console.log('verifyPassword: Hash starts with:', hashedPassword?.substring(0, 10));
  const result = await bcrypt.compare(password, hashedPassword);
  console.log('verifyPassword: Comparison result:', result);
  return result;
}

export function generateToken(user: { id: number; email: string; role: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await sql()`
      SELECT * FROM users WHERE email = ${email} LIMIT 1
    `;
    return result[0] || null;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const result = await sql()`
      SELECT * FROM users WHERE id = ${id} LIMIT 1
    `;
    return result[0] || null;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }
}

export async function createUser(email: string, password: string, name: string, role: string = 'user'): Promise<User | null> {
  try {
    console.log('createUser: Starting user creation for email:', email);
    console.log('createUser: Hashing password...');
    const hashedPassword = await hashPassword(password);
    console.log('createUser: Password hashed successfully');
    
    console.log('createUser: Inserting into database...');
    const result = await sql()`
      INSERT INTO users (email, password_hash, name, role)
      VALUES (${email}, ${hashedPassword}, ${name}, ${role})
      RETURNING *
    `;
    console.log('createUser: Database insertion successful, result:', result.length > 0 ? 'found' : 'empty');
    return result[0] || null;
  } catch (error) {
    console.error('createUser: Error creating user:', error);
    console.error('createUser: Error details:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
} 
