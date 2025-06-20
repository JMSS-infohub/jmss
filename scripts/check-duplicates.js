require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

console.log('Database URL exists:', !!process.env.DATABASE_URL);
const sql = neon(process.env.DATABASE_URL);

async function checkDuplicates() {
  try {
    console.log('Checking for duplicates in Swim Programs section...');
    
    // First get the section ID for Swim Programs
    const sections = await sql`SELECT id, name FROM sections WHERE name = 'Swim Programs'`;
    if (sections.length === 0) {
      console.log('Swim Programs section not found');
      return;
    }
    
    const sectionId = sections[0].id;
    console.log(`Swim Programs section ID: ${sectionId}`);
    
    // Get all content items in Swim Programs
    const contentItems = await sql`
      SELECT id, title, description, created_at 
      FROM content_items 
      WHERE section_id = ${sectionId} 
      ORDER BY title, created_at
    `;
    
    console.log(`Total content items in Swim Programs: ${contentItems.length}`);
    
    // Group by title to find duplicates
    const titleGroups = {};
    contentItems.forEach(item => {
      if (!titleGroups[item.title]) {
        titleGroups[item.title] = [];
      }
      titleGroups[item.title].push(item);
    });
    
    // Show duplicates
    let duplicatesFound = false;
    for (const [title, items] of Object.entries(titleGroups)) {
      if (items.length > 1) {
        duplicatesFound = true;
        console.log(`\nDUPLICATE FOUND - "${title}": ${items.length} copies`);
        items.forEach((item, index) => {
          console.log(`  ${index + 1}. ID: ${item.id}, Created: ${item.created_at}`);
        });
      }
    }
    
    if (!duplicatesFound) {
      console.log('No duplicates found in titles');
    }
    
    // Also show all items for manual inspection
    console.log('\nAll Swim Programs content items:');
    contentItems.forEach(item => {
      console.log(`ID: ${item.id} | Title: "${item.title}" | Desc: "${item.description?.substring(0, 50)}..."`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDuplicates(); 