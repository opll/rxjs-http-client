import axios from 'axios';

export const HttpClient = axios.create({ baseURL: '/api/' });
