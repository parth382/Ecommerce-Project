import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/userModel.js";
import Product from "./models/productModel.js";
import Order from "./models/orderModel.js";

dotenv.config();

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        // Clear existing data
        await User.deleteMany({});
        await Product.deleteMany({});
        await Order.deleteMany({});

        // Create a sample user with all fields
        const user = await User.create({
            name: "John Doe",
            email: "john@example.com",
            password: "password123",
            phone: "1234567890",
            address: "123 Main St",
            role: 1,
            pan: {
                number: "ABCDE1234F",
                name: "John Doe"
            },
            wishlist: []
        });

        // Create a sample product with all fields
        const product = await Product.create({
            name: "Sample Product",
            description: "This is a sample product description",
            highlights: ["Feature 1", "Feature 2", "Feature 3"],
            specifications: [
                {
                    title: "Specification 1",
                    description: "Description for spec 1"
                },
                {
                    title: "Specification 2",
                    description: "Description for spec 2"
                }
            ],
            price: 100,
            discountPrice: 90,
            images: [
                {
                    public_id: "sample1",
                    url: "https://example.com/image1.jpg"
                },
                {
                    public_id: "sample2",
                    url: "https://example.com/image2.jpg"
                }
            ],
            brand: {
                name: "Sample Brand",
                logo: {
                    public_id: "logo1",
                    url: "https://example.com/logo.jpg"
                }
            },
            category: "Electronics",
            stock: 10,
            warranty: 1,
            ratings: 4.5,
            numOfReviews: 2,
            reviews: [
                {
                    user: user._id,
                    name: "Reviewer 1",
                    rating: 5,
                    comment: "Great product!"
                },
                {
                    user: user._id,
                    name: "Reviewer 2",
                    rating: 4,
                    comment: "Good product"
                }
            ],
            seller: user._id
        });

        // Create a sample order with all fields
        await Order.create({
            paymentId: "sample_payment_123",
            products: [
                {
                    name: product.name,
                    image: product.images[0].url,
                    brandName: product.brand.name,
                    price: product.price,
                    discountPrice: product.discountPrice,
                    quantity: 2,
                    productId: product._id,
                    seller: user._id
                }
            ],
            buyer: user._id,
            shippingInfo: {
                address: "123 Main St",
                city: "Sample City",
                state: "Sample State",
                country: "Sample Country",
                pincode: 123456,
                phoneNo: 1234567890,
                landmark: "Near Park"
            },
            orderStatus: "Processing",
            amount: product.discountPrice * 2,
            deliveredAt: null,
            shippedAt: null,
            createdAt: new Date()
        });

        console.log("Database seeded successfully with complete schema data");
        process.exit();
    } catch (error) {
        console.error("Error seeding database:", error);
        process.exit(1);
    }
};

seedDatabase(); 