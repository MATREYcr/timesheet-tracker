import axios from 'axios'
import { API_URL, readSession } from './session'

// API client for seeding/cleanup, authenticated as the run's E2E user.
export const api = axios.create({
  baseURL: API_URL,
  headers: { cookie: readSession().cookie },
})
