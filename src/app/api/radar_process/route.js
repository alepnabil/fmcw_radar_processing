import fetch from "node-fetch";

export async function POST(req) {
  try {
    const mpsUrl = "http://localhost:9910/radar_processing_with_azure/radar_processing_with_azure"; // <== changed to http

    const mpsResponse = await fetch(mpsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nargout: 1,
        rhs: [""],
      }),
    });

    const text = await mpsResponse.text();
    console.log("MPS Local Response:", text);

    if (!mpsResponse.ok) {
      throw new Error(`MPS Error ${mpsResponse.status}: ${text}`);
    }

    const data = JSON.parse(text);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Radar API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
