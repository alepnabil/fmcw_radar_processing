// src/app/apiMatlab/matlab_api.js

export async function processRadarData(processAnimalActivity) { // Added processAnimalActivity parameter
  // Debugging statement: Check what argument is received by this function
  console.log("matlab_api: Received processAnimalActivity:", processAnimalActivity); // Added debugging

  try {
    const requestBody = {
      processAnimalActivity: processAnimalActivity, // Include processAnimalActivity in the body
    };

    // Debugging statement: Check the complete body being sent
    console.log("matlab_api: Sending request body to API route:", JSON.stringify(requestBody)); // Added debugging

    const response = await fetch("/api/radar_process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody) // Send the requestBody
    });

    const result = await response.json();

    if (!response.ok) {
      // Log the full error response from the server for better debugging
      console.error("matlab_api: API route error response:", result); // Added debugging
      throw new Error(result.error || "Radar processing failed");
    }

    // Your backend should return already-processed mwdata here.
    return result; // or result.mwdata depending on your API design

  } catch (error) {
    console.error("matlab_api: Error in processRadarData:", error); // Log catch errors too
    throw error;
  }
}