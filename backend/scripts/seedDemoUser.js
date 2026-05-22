const dotenv = require("dotenv");
const connectDB = require("../config/db");
const User = require("../models/User");

dotenv.config();

const demoUser = {
    name: process.env.DEMO_NAME || "SmartSpend Demo",
    email: process.env.DEMO_EMAIL || "demo@smartspend.app",
    password: process.env.DEMO_PASSWORD || "Demo@12345",
    currency: "INR",
    monthlyBudget: 30000,
};

const seedDemoUser = async () => {
    await connectDB();

    const existingUser = await User.findOne({ email: demoUser.email }).select("+password");

    if (existingUser) {
        existingUser.name = demoUser.name;
        existingUser.password = demoUser.password;
        existingUser.currency = demoUser.currency;
        existingUser.monthlyBudget = demoUser.monthlyBudget;
        await existingUser.save();
        console.log(`Demo user updated: ${demoUser.email}`);
    } else {
        await User.create(demoUser);
        console.log(`Demo user created: ${demoUser.email}`);
    }

    process.exit(0);
};

seedDemoUser().catch((error) => {
    console.error(`Demo user seed failed: ${error.message}`);
    process.exit(1);
});
