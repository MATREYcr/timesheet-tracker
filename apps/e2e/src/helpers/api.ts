import axios from 'axios';
import { API_URL, readSession } from './session';

export const api = axios.create({
  baseURL: API_URL,
  headers: { cookie: readSession().cookie },
});

export const ignoreCleanupError = () => undefined;
