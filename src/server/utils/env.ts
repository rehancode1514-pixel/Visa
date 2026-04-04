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
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
       throw new Error('JWT_SECRET is missing in production environment');
    }
    return 'super-secret-default-key-change-me';
  }
  return secret;
};
