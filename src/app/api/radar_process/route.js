import https from "https";
import fetch from "node-fetch"; // Use node-fetch instead of global fetch

export async function POST(req) {
  try {
    const mpsUrl = "";

    const agent = new https.Agent({
      rejectUnauthorized: false, // Accept self-signed cert
    });

    const mpsResponse = await fetch(mpsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nargout: 1,
        rhs: [""],
      }),
      agent, // Works with node-fetch!
    });

    const text = await mpsResponse.text();
    console.log("MPS Raw Response:", text);

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
