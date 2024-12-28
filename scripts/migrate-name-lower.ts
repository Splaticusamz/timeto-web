import { config } from 'dotenv';
import { migrateNameLowerField } from '../src/utils/migrations/addNameLowerField';

// Load environment variables from .env file
config();

async function main() {
  try {
    await migrateNameLowerField();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main(); 