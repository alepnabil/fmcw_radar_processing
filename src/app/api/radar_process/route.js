// src/app/api/radar_process/route.js
import { NextResponse } from 'next/server';
import https from "https"; // Import https for self-signed cert handling
import fetch from "node-fetch"; // Use node-fetch for server-side fetch with agent option

export async function POST(req) {
  let processAnimalActivity;
  try {
    const requestBody = await req.json();
    processAnimalActivity = requestBody.processAnimalActivity;

    if (typeof processAnimalActivity === 'undefined') {
      console.error("API Route: Missing 'processAnimalActivity' in request body. Received:", requestBody);
      return NextResponse.json({ error: "Missing 'processAnimalActivity' in request body." }, { status: 400 });
    }

    const mpsUrl = "";

    // Create an HTTPS agent to accept self-signed certificates
    const agent = new https.Agent({
      rejectUnauthorized: false, // Accept self-signed cert
    });

    console.log(`API Route: Attempting to call MPS at ${mpsUrl} with processAnimalActivity: ${processAnimalActivity}`);

    const mpsResponse = await fetch(mpsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nargout: 1,
        rhs: [
          {
            "processAnimalActivity": processAnimalActivity // Pass the processAnimalActivity to MATLAB
          }
        ],
      }),
      agent, // Apply the agent for self-signed certs (works with node-fetch)
    });

    const mpsResponseText = await mpsResponse.text();
    console.log("API Route: MPS Response Status:", mpsResponse.status);
    console.log("API Route: MPS Raw Response Text (truncated):", mpsResponseText.substring(0, 500) + (mpsResponseText.length > 500 ? '...' : ''));


    if (!mpsResponse.ok) {
      let mpsErrorMessage = `MPS returned a non-OK status: ${mpsResponse.status}.`;
      try {
        const errorDetails = JSON.parse(mpsResponseText);
        mpsErrorMessage += ` Details: ${errorDetails.message || JSON.stringify(errorDetails)}`;
      } catch (e) {
        mpsErrorMessage += ` Raw response was not JSON: ${mpsResponseText}`;
      }
      console.error("API Route: MPS returned error:", mpsErrorMessage);
      return NextResponse.json({ error: mpsErrorMessage }, { status: mpsResponse.status });
    }

    let mpsData;
    try {
      mpsData = JSON.parse(mpsResponseText);
      console.log("API Route: Successfully parsed MPS response.");
    } catch (parseError) {
      console.error("API Route: Error parsing MPS response as JSON. This is likely the cause of the client's '<!DOCTYPE' error.", parseError);
      console.error("API Route: The problematic MPS response text was:", mpsResponseText);
      return NextResponse.json({
        error: "MATLAB Production Server returned data that is not valid JSON.",
        details: mpsResponseText.substring(0, 200) + (mpsResponseText.length > 200 ? '...' : ''),
        originalErrorMessage: parseError.message
      }, { status: 500 });
    }

    return NextResponse.json(mpsData, { status: 200 });

  } catch (outerError) {
    console.error("API Route: An unexpected error occurred in the outer try-catch block:", outerError);
    return NextResponse.json({ error: outerError.message || "An unhandled server error occurred." }, { status: 500 });
  }
}