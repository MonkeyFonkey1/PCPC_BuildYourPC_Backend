import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// Default Route
app.get('/', (req, res) => {
    res.send('PCPC-Build-Your-PC Backend is Running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

//start the application with npm run dev !! (nodemon)
