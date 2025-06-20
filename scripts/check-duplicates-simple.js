require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function checkDuplicates() {
  try {
    console.log('Checking for duplicate content items...\n');
    
    // Check for exact title duplicates
    const titleDuplicates = await sql`
      SELECT title, section_id, COUNT(*) as count
      FROM content_items 
      GROUP BY title, section_id 
      HAVING COUNT(*) > 1
      ORDER BY count DESC, title
    `;
    
    if (titleDuplicates.length > 0) {
      console.log('=== TITLE DUPLICATES FOUND ===');
      for (const dup of titleDuplicates) {
        console.log(`"${dup.title}" - Section ${dup.section_id}: ${dup.count} copies`);
        
        // Get the actual duplicate records
        const records = await sql`
          SELECT id, title, created_at 
          FROM content_items 
          WHERE title = ${dup.title} AND section_id = ${dup.section_id}
          ORDER BY created_at
        `;
        
        records.forEach((record, index) => {
          console.log(`  ${index + 1}. ID: ${record.id}, Created: ${record.created_at}`);
        });
        console.log('');
      }
    } else {
      console.log('No title duplicates found.');
    }
    
    // Check Swim Programs specifically
    console.log('\n=== SWIM PROGRAMS CONTENT ===');
    const swimPrograms = await sql`
      SELECT ci.id, ci.title, ci.description, ci.created_at
      FROM content_items ci
      JOIN sections s ON ci.section_id = s.id
      WHERE s.name = 'Swim Programs'
      ORDER BY ci.title, ci.created_at
    `;
    
    console.log(`Total Swim Programs items: ${swimPrograms.length}`);
    
    let previousTitle = '';
    swimPrograms.forEach((item, index) => {
      const isDuplicate = item.title === previousTitle;
      console.log(`${index + 1}. ${isDuplicate ? '🔄 DUP:' : '   '} "${item.title}" (ID: ${item.id})`);
      previousTitle = item.title;
    });
    
    // Check all sections for content counts
    console.log('\n=== CONTENT COUNT BY SECTION ===');
    const sectionCounts = await sql`
      SELECT s.name, COUNT(ci.id) as content_count
      FROM sections s
      LEFT JOIN content_items ci ON s.id = ci.section_id
      GROUP BY s.id, s.name
      ORDER BY s.name
    `;
    
    sectionCounts.forEach(section => {
      console.log(`${section.name}: ${section.content_count} items`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDuplicates(); 