import bcrypt from "bcryptjs";

export function validatePassword(password: string): string | null {
  if (password.length <= 8) {
    return "Password must be more than eight characters.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must include an uppercase letter.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must include a lowercase letter.";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must include a special character.";
  }
  return null;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
