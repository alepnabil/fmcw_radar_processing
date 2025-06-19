export async function processRadarData() {
  try {
    const response = await fetch("/api/radar_process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({}) // if needed
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Radar processing failed");
    }

    // Your backend should return already-processed mwdata here.
    return result; // or result.mwdata depending on your API design

  } catch (error) {
    throw error;
  }
}
