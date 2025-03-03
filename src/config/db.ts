import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        console.log('Connecting to MongoDB with URI:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI || '');
        console.log('MongoDB connected...');
        mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB:', mongoose.connection.name);
});

    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1); // Exit process if connection fails
    }
};

export default connectDB;
