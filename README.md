
# IoT-Enabled FMCW Radar for Crop Intrusion Monitoring

This project presents an IoT-enabled Frequency-Modulated Continuous Wave (FMCW) radar system designed for the detection and classification of animal intrusions in agricultural crop fields. Moving beyond the limitations of traditional camera-based systems , this solution provides near real-time, interactive visualization of radar-detected animal intrusion data, featuring precise distance, velocity, and AI-driven classification of targets.


# System Architecture
The system's architecture is illustrated below:
![image_ult](https://github.com/alepnabil/fmcw_radar_processing/blob/0520baf734825d057825a4c8c4e1a66c44051d08/system%20architechure%20picture.png)

Data Acquisition: FMCW Radar captures IQ Raw Data.

Data Ingestion: Raw radar data files (Raw.xrg and raw.bin) are uploaded to a Data Lake via Microsoft Azure Blob Storage.

AI + Signal Processing Deployment: Data is processed and classified using MATLAB Production Server hosted on Microsoft Azure Container Apps. This includes signal processing to derive distance, speed, and dominant frequencies, and AI classification through API calls.

Dashboard: Processed and classified data (.json payload) is sent to the dashboard for near real-time, interactive visualization of animal intrusion, tracking, and activity monitoring.

# ETL Pipeline Files

| File Name | Description |
|-----------|-------------|
| `radar_processing` | Main entry point for radar data ETL. Executes radar signal processing algorithms, generates outputs (JSON and images), and uploads them to Azure Blob Storage. When compiled and packaged, this program can be deployed to MATLAB Production Server and exposed via an API endpoint. |
| `radar_processing_with_azure` | Core radar processing algorithm. Performs radar and algorithm configurations, calculates theoretical radar parameters, and iterates over each radar frame to apply fast-time processing, slow-time processing, and STFT. Outputs are saved as JSON files, including: (1) `spectrogram_data` (for spectrogram plots), (2) `range_fft` (for range FFT visualization), and (3) `range_speed` (for range-speed tracking over time). |
| `read_data_from_blob_storage` | Retrieves radar IQ data and configuration files from Azure Blob Storage for processing. |
| `send_json_string_to_blob_storage` | Uploads processed radar data (in JSON format) to Azure Blob Storage for downstream use by the dashboard. |
| `send_picture_to_blob_storage` | Uploads generated spectrogram images, derived from processed IQ radar data, to Azure Blob Storage for visualization in the dashboard. |


# Branch Overview

| Branch Name | Description |
|-------------|-------------|
| `master` | Contains the finalized signal processing algorithms for core radar data analysis. This is the central branch where validated and production-ready processing logic is maintained. |
| `local_dev` | Dedicated to local development and testing of the dashboard. This branch allows developers to spin up the dashboard environment locally and test its integration with MATLAB Production Server (MPS) before deploying to the cloud. |
| `prod` | Represents the production-ready dashboard environment. It is fully integrated with the MATLAB Production Server deployed on Microsoft Azure using Azure Container Apps. This branch ensures CORS (Cross-Origin Resource Sharing) is properly configured for secure data communication between the dashboard and Azure services. |




# Potential Applications Beyond Intrusion Detection
- The underlying technology has broad applicability in agricultural settings and beyond:

- Crop Health Monitoring: Detecting subtle changes in plant structure or growth patterns.

- Yield Estimation: Non-contact estimation of harvest volumes.

- Livestock Behavior Monitoring: Analyzing detailed micro-Doppler signatures for early indicators of animal health or distress.

- Wildlife Monitoring & Conservation: Unobtrusive tracking of animal movement in natural habitats.

- Perimeter Security: Beyond farms, for critical infrastructure or border monitoring.
