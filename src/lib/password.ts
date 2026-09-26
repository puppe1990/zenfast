import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const KEY_LENGTH = 64
const SCHEME = 'scrypt'

export function hashPassword(
  password: string,
  salt: string = randomBytes(16).toString('hex'),
): string {
  const derived = scryptSync(password, salt, KEY_LENGTH).toString('hex')

  return `${SCHEME}$${salt}$${derived}`
}

export function verifyPassword(
  password: string,
  stored: string | null,
): boolean {
  if (!stored) {
    return false
  }

  const [scheme, salt, hash] = stored.split('$')

  if (scheme !== SCHEME || !salt || !hash) {
    return false
  }

  const expected = Buffer.from(hash, 'hex')
  const derived = scryptSync(password, salt, expected.length)

  return (
    derived.length === expected.length && timingSafeEqual(derived, expected)
  )
}
