import mongoose from "mongoose";
import dotenv from "dotenv";
import userModel from "./models/userModel.js";
import { hashPassword } from "./helper/authHelper.js";

dotenv.config();

const updatePassword = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const email = "john@example.com";
        const password = "password123";

        // Hash the password
        const hashedPassword = await hashPassword(password);
        console.log("\nGenerated hash:", hashedPassword);

        // Update user's password
        const result = await userModel.updateOne(
            { email },
            { $set: { password: hashedPassword } }
        );

        console.log("\nUpdate result:", result.modifiedCount ? "Success" : "Failed");

        await mongoose.disconnect();
        console.log("\nDisconnected from MongoDB");
    } catch (error) {
        console.error("Error:", error);
    }
};

updatePassword(); 