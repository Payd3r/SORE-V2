import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { encrypt, decrypt } from './crypto'
import { PrismaClient } from '@prisma/client'
import { Adapter, AdapterAccount } from 'next-auth/adapters'

export function EncryptedPrismaAdapter(p: PrismaClient): Adapter {
  const defaultAdapter = PrismaAdapter(p)
  
  return {
    ...defaultAdapter,
    linkAccount: (account: AdapterAccount) => {
      const encryptedAccount = { ...account }

      if (encryptedAccount.access_token) {
        encryptedAccount.access_token = encrypt(encryptedAccount.access_token)
      }
      if (encryptedAccount.refresh_token) {
        encryptedAccount.refresh_token = encrypt(encryptedAccount.refresh_token)
      }
      if (encryptedAccount.id_token) {
        encryptedAccount.id_token = encrypt(encryptedAccount.id_token)
      }

      return defaultAdapter.linkAccount(encryptedAccount)
    },
    async getUserByAccount(providerAccountId) {
      const account = await p.account.findUnique({
        where: { provider_providerAccountId: providerAccountId },
      })

      if (!account) {
        return null
      }

      if (account.access_token) {
        account.access_token = decrypt(account.access_token)
      }
      if (account.refresh_token) {
        account.refresh_token = decrypt(account.refresh_token)
      }
      if (account.id_token) {
        account.id_token = decrypt(account.id_token)
      }
      
      const user = await p.user.findUnique({
        where: { id: account.userId },
      })

      return user
    },
  }
} 