import mongoose from "mongoose";
import dotenv from "dotenv";
import userModel from "./models/userModel.js";
import { comparePassword } from "./helper/authHelper.js";

dotenv.config();

const testUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const email = "john@example.com";
        const password = "password123";

        // Find user
        const user = await userModel.findOne({ email });
        console.log("\nUser found:", user ? "Yes" : "No");
        
        if (user) {
            console.log("\nUser details:");
            console.log("Email:", user.email);
            console.log("Password hash:", user.password);
            
            // Test password
            const match = await comparePassword(password, user.password);
            console.log("\nPassword match:", match);
        }

        await mongoose.disconnect();
        console.log("\nDisconnected from MongoDB");
    } catch (error) {
        console.error("Error:", error);
    }
};

testUser(); 