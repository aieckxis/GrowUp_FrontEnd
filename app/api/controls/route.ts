export async function POST(request: Request) {
  const body = await request.json();

  try {
    // Forward the command to your Raspberry Pi control endpoint
    const response = await fetch("http://192.168.210.142:8000/api/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error("Pi rejected command");

    return Response.json({
      status: "success",
      data: body,
      message: "Hardware successfully updated",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ 
      status: "error", 
      message: "Hardware communication failed" 
    }, { status: 500 });
  }
}