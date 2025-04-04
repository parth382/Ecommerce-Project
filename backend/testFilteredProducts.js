import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/productModel.js";

dotenv.config();

const testFilteredProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        // Get all products
        const products = await Product.find({}).sort({ createdAt: -1 });
        
        console.log("Total products found:", products.length);
        console.log("Products:", JSON.stringify(products, null, 2));

        process.exit();
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

testFilteredProducts(); 