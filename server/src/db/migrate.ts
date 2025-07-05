import { pool } from './index';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by statement (naive split by semicolon)
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      try {
        await pool.query(statement + ';');
        console.log('✓ Executed:', statement.split('\n')[0].substring(0, 50) + '...');
      } catch (error: any) {
        if (error.code === '42P07') {
          // Table already exists
          console.log('⚠️  Already exists:', statement.split('\n')[0].substring(0, 50) + '...');
        } else {
          throw error;
        }
      }
    }
    
    console.log('✅ Database migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations();
}

export default runMigrations;