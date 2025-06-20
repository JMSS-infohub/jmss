require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function analyzeContent() {
  try {
    console.log('Analyzing content structures...\n');
    
    // Get all content items with their types and content
    const contentItems = await sql`
      SELECT 
        ci.id, 
        ci.title, 
        ci.container_type,
        ci.content,
        s.name as section_name
      FROM content_items ci 
      JOIN sections s ON ci.section_id = s.id 
      ORDER BY s.name, ci.title
    `;
    
    console.log(`Found ${contentItems.length} content items\n`);
    
    // Group by container type
    const typeGroups = {};
    contentItems.forEach(item => {
      if (!typeGroups[item.container_type]) {
        typeGroups[item.container_type] = [];
      }
      typeGroups[item.container_type].push(item);
    });
    
    // Analyze each type
    for (const [type, items] of Object.entries(typeGroups)) {
      console.log(`\n=== ${type.toUpperCase()} (${items.length} items) ===`);
      
      // Show first few examples of each type
      items.slice(0, 3).forEach((item, index) => {
        console.log(`\nExample ${index + 1}: "${item.title}" (${item.section_name})`);
        console.log(`Content structure:`, JSON.stringify(item.content, null, 2));
        
        // Analyze the content structure
        if (typeof item.content === 'object' && item.content !== null) {
          const keys = Object.keys(item.content);
          console.log(`Keys: [${keys.join(', ')}]`);
          
          // Check for complex nested structures
          keys.forEach(key => {
            const value = item.content[key];
            if (typeof value === 'object' && value !== null) {
              if (Array.isArray(value)) {
                console.log(`  ${key}: Array with ${value.length} items`);
                if (value.length > 0) {
                  console.log(`    First item type: ${typeof value[0]}`);
                  if (typeof value[0] === 'object') {
                    console.log(`    First item keys: [${Object.keys(value[0]).join(', ')}]`);
                  }
                }
              } else {
                console.log(`  ${key}: Object with keys [${Object.keys(value).join(', ')}]`);
              }
            } else {
              console.log(`  ${key}: ${typeof value}`);
            }
          });
        }
      });
    }
    
    // Find problematic content
    console.log(`\n\n=== POTENTIALLY PROBLEMATIC CONTENT ===`);
    const problematic = contentItems.filter(item => {
      const content = item.content;
      
      // Check for deeply nested structures
      if (typeof content === 'object' && content !== null) {
        const hasComplexNesting = Object.values(content).some(value => {
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            return Object.values(value).some(nestedValue => 
              typeof nestedValue === 'object' && nestedValue !== null
            );
          }
          return false;
        });
        
        return hasComplexNesting;
      }
      
      return false;
    });
    
    problematic.forEach(item => {
      console.log(`\nProblematic: "${item.title}" (${item.section_name}) - ${item.container_type}`);
      console.log(`Structure: ${JSON.stringify(item.content, null, 2).substring(0, 200)}...`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

analyzeContent(); 