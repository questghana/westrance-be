import bcrypt from "bcrypt";

export const generateBetterAuthPasswordHash = async (password: string): Promise<string> => {
  try {
    // Generate bcrypt hash with salt rounds (same as Better-Auth config)
    const saltRounds = 12;
    const hash = await bcrypt.hash(password, saltRounds);
    
    return hash;
  } catch (error) {
    console.error("Error generating password hash:", error);
    throw new Error("Failed to generate password hash");
  }
}; 