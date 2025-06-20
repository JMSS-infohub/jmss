const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  try {
    console.log('Running migration for multiple containers...');
    
    // Create the content_container_instances table
    await sql`
      CREATE TABLE IF NOT EXISTS content_container_instances (
        id SERIAL PRIMARY KEY,
        content_item_id INTEGER REFERENCES content_items(id) ON DELETE CASCADE,
        container_type VARCHAR(50) NOT NULL CHECK (container_type IN ('text', 'list', 'procedure', 'warning', 'success', 'danger', 'quiz', 'grid', 'tabs')),
        content JSONB NOT NULL DEFAULT '{}',
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log('✓ Created content_container_instances table');
    
    // Migrate existing content to the new system
    const result = await sql`
      INSERT INTO content_container_instances (content_item_id, container_type, content, order_index)
      SELECT 
        id as content_item_id,
        COALESCE(container_type, 'text') as container_type,
        content,
        0 as order_index
      FROM content_items 
      WHERE id NOT IN (
        SELECT DISTINCT content_item_id 
        FROM content_container_instances
      )
    `;
    
    console.log(`✓ Migrated ${result.count} content items to multiple container system`);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration(); 