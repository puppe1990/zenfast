import { describe, expect, it } from 'vitest'

import { hashPassword, verifyPassword } from './password'

describe('hashPassword', () => {
  it('never stores the plain password', () => {
    const hash = hashPassword('jejum-16-8')

    expect(hash).not.toContain('jejum-16-8')
    expect(hash.startsWith('scrypt$')).toBe(true)
  })

  it('salts every hash so equal passwords differ', () => {
    expect(hashPassword('mesma-senha')).not.toBe(hashPassword('mesma-senha'))
  })
})

describe('verifyPassword', () => {
  it('accepts the matching password', () => {
    const hash = hashPassword('cetose-2026')

    expect(verifyPassword('cetose-2026', hash)).toBe(true)
  })

  it('rejects a wrong password', () => {
    const hash = hashPassword('cetose-2026')

    expect(verifyPassword('cetose-2027', hash)).toBe(false)
    expect(verifyPassword('', hash)).toBe(false)
  })

  it('rejects missing or malformed hashes', () => {
    expect(verifyPassword('qualquer', null)).toBe(false)
    expect(verifyPassword('qualquer', '')).toBe(false)
    expect(verifyPassword('qualquer', 'bcrypt$sem-sal')).toBe(false)
  })
})
