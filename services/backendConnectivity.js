import axios from "axios";
import { API_BASE_URL } from "../api/axios";

export async function checkBackendConnection() {
  try {
    const start = Date.now();
    
    // Try to reach a simple endpoint
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000,
    });
    
    const duration = Date.now() - start;
    
    return {
      connected: true,
      baseURL: API_BASE_URL,
      status: response.status,
      duration: `${duration}ms`,
      message: "✅ Backend is reachable",
    };
  } catch (error) {
    return {
      connected: false,
      baseURL: API_BASE_URL,
      error: error.message,
      code: error.code,
      duration: `${error.config?.timeout || "unknown"}ms`,
      message: `❌ Cannot reach backend: ${error.message}`,
      troubleshooting: [
        "1. Verify backend is running on https://kennty-fit-tracker-backend-production.up.railway.app",
        "2. Check that backend port 8081 is open",
        "3. Verify your computer's firewall allows localhost access",
        "4. If on Android/iOS emulator, use http://10.0.2.2:8081 instead of localhost",
      ],
    };
  }
}

// Try multiple potential base URLs
export async function findWorkingBackend() {
  const potentialUrls = [
    "http://localhost:8081",
    "https://kennty-fit-tracker-backend-production.up.railway.app",
    "http://127.0.0.1:8081",
    "http://10.0.2.2:8081", // Android emulator
    "http://192.168.1.100:8081",
  ];

  const results = await Promise.all(
    potentialUrls.map(async (url) => {
      try {
        await axios.get(`${url}/api/health`, { timeout: 3000 });
        return { url, working: true };
      } catch {
        return { url, working: false };
      }
    })
  );

  const working = results.find((r) => r.working);
  return working
    ? {
        success: true,
        url: working.url,
        message: `Found working backend at ${working.url}`,
      }
    : {
        success: false,
        tried: potentialUrls,
        message: "No working backend found at any URL",
      };
}
