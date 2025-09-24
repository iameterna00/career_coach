
export const webApi = window.location.hostname === "localhost"
  ? 'http://127.0.0.1:8000/api' 
  : 'https://nepwoopbackend-1.onrender.com/api' 
