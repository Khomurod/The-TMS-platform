import axios from 'axios';
const API_BASE_URL = "http://localhost:8000/api/v1";

const api = axios.create({ baseURL: API_BASE_URL });
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log("INTERCEPTOR CAUGHT:", error.response?.status, error.config.url);
    if (error.response?.status === 401 && !error.config._retry && !error.config.url?.includes("/auth/")) {
       console.log("TRIGGERING REFRESH");
    }
    return Promise.reject(error);
  }
);

async function test() {
  try {
    await api.get('/brokers?page=1&page_size=50');
  } catch(e) {
    console.log("End error");
  }
}
test();
