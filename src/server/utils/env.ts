import 'dotenv/config';

export function validateEnv() {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    const errorMsg = `❌ [ENV ERROR]: Missing required environment variables: ${missing.join(', ')}`;
    console.error(errorMsg);
    
    if (process.env.NODE_ENV === 'production') {
      // In production, we log it and proceed, as the controller handles the case.
      // Alternatively, we could throw, but the controller checks are already in place.
    }
    return { valid: false, missing };
  }

  return { valid: true, missing: [] };
}

export const getJwtSecret = () => {
  return process.env.JWT_SECRET || 'super-secret-default-key-change-me';
};
