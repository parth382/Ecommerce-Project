import mongoose from "mongoose";
import dotenv from "dotenv";
import userModel from "./models/userModel.js";
import { hashPassword } from "./helper/authHelper.js";

dotenv.config();

const registerUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const userData = {
            name: "John Doe",
            email: "john@example.com",
            password: "password123",
            phone: "1234567890",
            address: "123 Main St",
            role: 0
        };

        // Check if user already exists
        const existingUser = await userModel.findOne({ email: userData.email });
        if (existingUser) {
            console.log("User already exists");
            await mongoose.disconnect();
            return;
        }

        // Hash password
        const hashedPassword = await hashPassword(userData.password);

        // Create new user
        const user = new userModel({
            ...userData,
            password: hashedPassword
        });

        await user.save();
        console.log("User registered successfully");

        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    } catch (error) {
        console.error("Error:", error);
    }
};

registerUser(); 