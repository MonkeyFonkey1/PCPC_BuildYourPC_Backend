import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db';
import testRoutes from './routes/test';
import componentsRoutes from './routes/componentsRoute';
import sessionBuildsRoutes from './routes/sessionBuildsRoute';
import autoBuildRoutes from './routes/autoBuildRoute';

dotenv.config();
connectDB();

const app = express();
// Middleware
app.use(express.json());

// Default Route
app.get('/', (req, res) => {
    res.send('PCPC-Build-Your-PC Backend is Running');
});

app.use('/api/components', componentsRoutes);
app.use('/api/session-builds', sessionBuildsRoutes);
app.use('/api/automatic-builds', autoBuildRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

//start the application with npm run dev !! (nodemon)
