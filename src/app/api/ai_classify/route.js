// src/app/api/ai_classify/route.js
import { NextResponse } from 'next/server';

export async function POST(req) { // <--- ENSURE THIS FUNCTION IS EXPORTED
  let imageFilename;
  try {
    const requestBody = await req.json();
    imageFilename = requestBody.image_filename;

    if (typeof imageFilename === 'undefined') {
      console.error("AI Classify API Route: Missing 'image_filename' in request body. Received:", requestBody);
      return NextResponse.json({ error: "Missing 'image_filename' in request body." }, { status: 400 });
    }

    const azureApiUrl = "";

    console.log(`AI Classify API Route: Attempting to call Azure API at ${azureApiUrl} with image_filename: ${imageFilename}`);

    const azureResponse = await fetch(azureApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_filename: imageFilename
      }),
    });

    const azureResponseText = await azureResponse.text();
    console.log("AI Classify API Route: Azure API Response Status:", azureResponse.status);
    console.log("AI Classify API Route: Azure API Raw Response Text (truncated):", azureResponseText.substring(0, 500) + (azureResponseText.length > 500 ? '...' : ''));

    if (!azureResponse.ok) {
      let azureErrorMessage = `Azure API returned a non-OK status: ${azureResponse.status}.`;
      try {
        const errorDetails = JSON.parse(azureResponseText);
        azureErrorMessage += ` Details: ${errorDetails.message || JSON.stringify(errorDetails)}`;
      } catch (e) {
        azureErrorMessage += ` Raw response was not JSON: ${azureResponseText}`;
      }
      console.error("AI Classify API Route: Azure API returned error:", azureErrorMessage);
      return NextResponse.json({ error: azureErrorMessage }, { status: azureResponse.status });
    }

    let azureData;
    try {
      azureData = JSON.parse(azureResponseText);
      console.log("AI Classify API Route: Successfully parsed Azure API response.");
      
      // Ensure confidence is rounded to 2 decimal places
      if (azureData.confidence) {
        azureData.confidence = Math.round(azureData.confidence * 100) / 100;
      }
    } catch (parseError) {
      console.error("AI Classify API Route: Error parsing Azure API response as JSON. This is likely the cause of the client's '<!DOCTYPE' error.", parseError);
      console.error("AI Classify API Route: The problematic Azure API response text was:", azureResponseText);
      return NextResponse.json({
        error: "Azure API returned data that is not valid JSON.",
        details: azureResponseText.substring(0, 200) + (azureResponseText.length > 200 ? '...' : ''),
        originalErrorMessage: parseError.message
      }, { status: 500 });
    }

    return NextResponse.json(azureData, { status: 200 });

  } catch (outerError) {
    console.error("AI Classify API Route: An unexpected error occurred in the outer try-catch block:", outerError);
    return NextResponse.json({ error: outerError.message || "An unhandled server error occurred." }, { status: 500 });
  }
}