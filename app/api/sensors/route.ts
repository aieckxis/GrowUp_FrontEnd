import { INITIAL_SENSOR_DATA } from "@/lib/constants"

export async function GET() {
  try {
    // Replace with your Raspberry Pi's IP and the port your Python script uses
    const PI_URL = "http://192.168.210.142:8000/api/sensors"; 

    const response = await fetch(PI_URL, {
      cache: 'no-store', // Crucial: ensures you get fresh data every time
      signal: AbortSignal.timeout(2000) // Don't wait forever if the Pi is off
    });

    if (!response.ok) throw new Error();

    const realData = await response.json();
    return Response.json({
      status: "success",
      data: realData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Fallback: If Pi is offline, return the initial mock data so the UI doesn't break
    return Response.json({
      status: "offline",
      data: INITIAL_SENSOR_DATA,
      message: "Using cached data - Hardware unreachable",
      timestamp: new Date().toISOString(),
    });
  }
}