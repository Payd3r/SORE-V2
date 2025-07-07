/**
 * Environment variables configuration and validation
 */

export const env = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  // NextAuth.js
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
  
  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  
  // Spotify API
  SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID || '',
  SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET || '',
  
  // OpenWeatherMap API
  OPENWEATHERMAP_API_KEY: process.env.OPENWEATHERMAP_API_KEY || '',
  
  // Security
  JWT_SECRET: process.env.JWT_SECRET || '',
  
  // App Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  
  // VAPID Keys for Web Push
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || ''
}

/**
 * Validates that all required environment variables are set
 */
export function validateEnv() {
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'JWT_SECRET'
  ]
  
  const missing = requiredVars.filter(varName => !env[varName as keyof typeof env])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

/**
 * Checks if we're in development mode
 */
export const isDevelopment = env.NODE_ENV === 'development'

/**
 * Checks if we're in production mode
 */
export const isProduction = env.NODE_ENV === 'production' 