// src/app/apiMatlab/matlab_api.js

export async function processRadarData(processAnimalActivity) { // <--- 1. ADD THE PARAMETER HERE
  // Debugging statement: Check what argument is received by this function
  console.log("matlab_api: Received processAnimalActivity:", processAnimalActivity);

  try {
    const requestBody = {
      processAnimalActivity: processAnimalActivity,
    };

    // Debugging statement: Check the complete body being sent
    console.log("matlab_api: Sending request body to API route:", JSON.stringify(requestBody));

    const response = await fetch("/api/radar_process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody) // <--- 2. SEND THE CORRECT BODY
    });

    const result = await response.json();

    if (!response.ok) {
      // Log the full error response from the server for better debugging
      console.error("matlab_api: API route error response:", result);
      throw new Error(result.error || "Radar processing failed");
    }

    // Your backend should return already-processed mwdata here.
    return result; // or result.mwdata depending on your API design

  } catch (error) {
    console.error("matlab_api: Error in processRadarData:", error); // Log catch errors too
    throw error;
  }
}