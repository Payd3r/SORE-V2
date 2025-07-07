import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

const getKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('La variabile d\'ambiente ENCRYPTION_KEY non è impostata.')
  }
  if (Buffer.from(key, 'hex').length !== 32) {
    throw new Error('ENCRYPTION_KEY deve essere una stringa esadecimale di 64 caratteri (32 byte).')
  }
  return Buffer.from(key, 'hex')
}

export const encrypt = (text: string): string => {
  try {
    const key = getKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
    const authTag = cipher.getAuthTag()
    return Buffer.concat([iv, authTag, encrypted]).toString('hex')
  } catch (error) {
    console.error("Errore durante la crittografia:", error)
    throw new Error("Impossibile criptare i dati.")
  }
}

export const decrypt = (encryptedText: string): string => {
  try {
    const key = getKey()
    const data = Buffer.from(encryptedText, 'hex')
    const iv = data.slice(0, IV_LENGTH)
    const authTag = data.slice(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
    const encrypted = data.slice(IV_LENGTH + AUTH_TAG_LENGTH)
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    return decrypted.toString('utf8')
  } catch (error) {
    console.error("Errore durante la decrittografia:", error)
    throw new Error("Impossibile decriptare i dati. Il testo cifrato potrebbe essere corrotto o la chiave errata.")
  }
}