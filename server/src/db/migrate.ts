import { pool } from './index';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the entire schema as one statement
    try {
      await pool.query(schema);
      console.log('✅ Database migrations completed successfully');
    } catch (error: any) {
      if (error.code === '42P07') {
        // Some objects already exist, but that's okay
        console.log('⚠️  Some objects already exist, continuing...');
      } else {
        throw error;
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  runMigrations();
}

export default runMigrations;