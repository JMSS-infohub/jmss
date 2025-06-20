import { neon, neonConfig } from '@neondatabase/serverless';

neonConfig.fetchConnectionCache = true;

let sql: any;

function getSql() {
  if (!sql) {
    if (process.env.DATABASE_URL) {
      sql = neon(process.env.DATABASE_URL);
    } else {
      throw new Error('DATABASE_URL environment variable is not set');
    }
  }
  return sql;
}

export { getSql as sql };

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: 'user' | 'admin' | 'editor';
  created_at: Date;
  updated_at: Date;
}

export interface Section {
  id: number;
  name: string;
  description?: string;
  emoji?: string;
  order_index: number;
  created_at: Date;
  updated_at: Date;
}

export interface ContentItem {
  id: number;
  title: string;
  description?: string;
  section_id: number;
  emoji?: string;
  content: any; // JSONB data
  container_type: string;
  author_id: number;
  published: boolean;
  order_index: number;
  created_at: Date;
  updated_at: Date;
}

export interface ContentContainer {
  id: number;
  name: string;
  type: string;
  description?: string;
  created_at: Date;
}

export interface ContentContainerInstance {
  id: number;
  content_item_id: number;
  container_type: string;
  content: any; // JSONB data
  order_index: number;
  created_at: Date;
  updated_at: Date;
} 
