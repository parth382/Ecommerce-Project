import bcrypt from "bcrypt";

export const hashPassword = async (password) => {
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {
        console.log(`Error in hashing password- ${error}`);
        throw error;
    }
};

export const comparePassword = async (password, hashedPassword) => {
    try {
        if (!password || !hashedPassword) {
            return false;
        }
        return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
        console.log(`Error in comparing password- ${error}`);
        return false;
    }
};
