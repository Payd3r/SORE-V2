import NextAuth from 'next-auth'
import { JWT } from 'next-auth/jwt'
import { UserRole } from '@/lib/roles'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: UserRole
      coupleId?: string | null
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role: UserRole
    coupleId?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    coupleId?: string | null
  }
} 