import * as fs from 'fs'
import * as path from 'path'

export const API_URL = process.env.API_URL ?? 'http://localhost:3333'
export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'

// Written by global-setup.ts; Playwright loads it as storageState for every test context.
export const STORAGE_STATE = path.join(__dirname, '../../.auth/user.json')
const SESSION_FILE = path.join(__dirname, '../../.auth/session.json')

export interface E2eSession {
  cookie: string
  email: string
  password: string
  name: string
}

export function saveSession(session: E2eSession): void {
  fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true })
  fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2))
}

export function readSession(): E2eSession {
  return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8')) as E2eSession
}
