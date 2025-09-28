import db from '../config/Database.js';
import { runAllSeeders } from './seedData.js';

const runSeed = async () => {
    try {
        await db.authenticate();
        console.log('✅ Database connection established');
        
        // Sync database
        await db.sync({ force: false }); 
        console.log('✅ Database synchronized');
        
        await runAllSeeders();
        console.log('\n🎉 Seeding completed! You can now start the server.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

runSeed();