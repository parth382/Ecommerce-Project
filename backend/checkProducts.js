import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/productModel.js";
import User from "./models/userModel.js";

dotenv.config();

const checkProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        // Get all products with populated seller data
        const products = await Product.find({})
            .populate('seller', 'name email');

        console.log("Products found:", products.length);
        console.log("First product details:", JSON.stringify(products[0], null, 2));

        process.exit();
    } catch (error) {
        console.error("Error checking products:", error);
        process.exit(1);
    }
};

checkProducts(); 