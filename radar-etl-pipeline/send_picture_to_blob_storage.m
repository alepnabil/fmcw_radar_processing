function send_picture_to_blob_storage(localImagePath)
    % Uploads a single image file to Azure Blob Storage using low-level
    % Java networking to ensure compatibility with older MATLAB versions.

    accountName = "fypblobstorage";
    containerName = "fyp-data";
    sasToken = "";

    % === 1. Check if the file exists ===
    if ~isfile(localImagePath)
        fprintf("❌ File not found: %s\n", localImagePath);
        return;
    end
    
    fileInfo = dir(localImagePath);
    fileSize = fileInfo.bytes;
    fprintf("📄 File found: %s, Size: %d bytes\n", localImagePath, fileInfo.bytes);
    
    [~, name, ext] = fileparts(localImagePath);
    blobName = [name, ext];

    % === 2. Construct URL string ===
    blobURLString = sprintf("https://%s.blob.core.windows.net/%s/%s?%s", ...
        accountName, containerName, blobName, sasToken);

    % === 3. Read image file as raw binary bytes ===
    fid = fopen(localImagePath, 'rb');
    if fid == -1
        error("❌ Failed to open image file '%s'.", localImagePath);
    end
    imageBytes = fread(fid, inf, '*uint8');
    fclose(fid);
    
    try
        % === 4. Use Java HTTP Connection for Robust Upload ===
        fprintf("⏫ Initializing Java HTTP connection for upload...\n");
        
        % Create a Java URL object
        url = java.net.URL(blobURLString);
        
        connection = url.openConnection();
        
        % Set request method to PUT
        connection.setRequestMethod('PUT');
        
        connection.setRequestProperty('x-ms-blob-type', 'BlockBlob');
        connection.setRequestProperty('Content-Type', 'image/png');
        connection.setRequestProperty('Content-Length', num2str(fileSize));
        
        connection.setDoOutput(true);
        
        outputStream = connection.getOutputStream();
        
        outputStream.write(imageBytes);
        outputStream.flush();
        outputStream.close();
        
        % === 5. Get and check the response code ===
        responseCode = connection.getResponseCode();
        
        if responseCode == 201 % HTTP 201 Created
            fprintf("✅ Upload successful! Status: %d\n", responseCode);
        else
            fprintf("❌ Upload failed. Status: %d %s\n", responseCode, char(connection.getResponseMessage()));
            % Try to read the error stream from Azure for more details
            errorStream = connection.getErrorStream();
            if ~isempty(errorStream)
                scanner = java.util.Scanner(errorStream).useDelimiter('\\A');
                if scanner.hasNext()
                    errorMessage = scanner.next();
                    fprintf("Azure Error Details: %s\n", char(errorMessage));
                end
            end
        end
        
    catch ME
        fprintf("❌ An error occurred during the Java upload process.\n");
        rethrow(ME);
    end
end