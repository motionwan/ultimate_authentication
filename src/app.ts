import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';

// load environment variables
config();

// create express app
const app = express();

// optional settings for react or any front end application
// const corsOption = {
//     credentials: true,
//     origin: ['http://localhost:3000', 'https://127.0.0.1:3000'],
//   };

// use json and cookie
app.use(express.json());
app.use(cookieParser());

// connection to mongodb
//NB: ANY DATABASE CAN BE CONNECTED HERE

const databaseuri = process.env.DATABASE_URL;
console.log(databaseuri);

async function connectToMongoDB() {
  try {
    const mongoUri = process.env.DATABASE_URL;

    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not defined!');
    }

    await mongoose.connect(mongoUri);

    console.log('MongoDB connected successfully!');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1); // Exit the process on connection error
  }
}

connectToMongoDB();
//import the routes
import userRoutes from './routers/users.router';

//call the router imported above
app.use('/users', userRoutes);

export default app;
