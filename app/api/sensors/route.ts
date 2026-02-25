import { INITIAL_SENSOR_DATA } from "@/lib/constants"

export async function GET() {
  // TODO: Replace with real sensor data from IoT backend
  // This endpoint should fetch from your hardware controller or MQTT broker
  return Response.json({
    status: "success",
    data: INITIAL_SENSOR_DATA,
    timestamp: new Date().toISOString(),
  })
}
