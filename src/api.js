import axios from 'axios';

// Replace this with your real base URL
const API_BASE_URL = 'http://172.16.227.173:8000/api';

// Get JWT token from localStorage or any auth store
const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vMTcyLjE2LjIyNy4xNzM6ODAwMC9hcGkvbG9naW4iLCJpYXQiOjE3NTUwNzk0NDMsImV4cCI6MTc1NTE2NTg0MywibmJmIjoxNzU1MDc5NDQzLCJqdGkiOiJ2S1VCRTM5VGRzTmhRdkVjIiwic3ViIjoiMSIsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.2WyZWsjqlf41oSWEcJYmxTvtnRrzE8UyMu3OwjPkpSM";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Authorization: `Bearer ${token}`,  // Send token with every request
    'Content-Type': 'application/json',
  },
});

export default api;