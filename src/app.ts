import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db';
import componentsRoutes from './routes/componentsRoute';
import sessionBuildsRoutes from './routes/sessionBuildsRoute';
import autoBuildRoutes from './routes/autoBuildRoute';
import cron from 'node-cron';
import { cleanupExpiredSessions } from './services/cleanupService';
import { cleanupOldCachedQueries } from './services/cleanupService';


dotenv.config();
connectDB();

const app = express();
// Middleware
app.use(express.json());

// Default Route
app.get('/', (req, res) => {
    res.send('PCPC-Build-Your-PC Backend is Running');
});

cron.schedule('0 * * * *', async () => {
    console.log('⏰ Running hourly session cleanup...');
    await cleanupOldCachedQueries();
    await cleanupExpiredSessions();
});

app.use('/api/components', componentsRoutes);
app.use('/api/session-builds', sessionBuildsRoutes);
app.use('/api/automatic-builds', autoBuildRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

