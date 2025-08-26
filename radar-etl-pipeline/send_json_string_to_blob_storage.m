%% THIS FUNCTION IS FOR TESTING SENDING JSON DATA FROM LOCAL FOLDER TO BLOB STORAGE
%% TAKES IN A FILENAME THEN SENDS IT TO BLOB STORAGE

function send_json_file_to_blob_storage(localFilePath)

    accountName = "fypblobstorage";
    containerName = "fyp-data";
    sasToken = "";

    [~, blobName, ext] = fileparts(localFilePath);
    blobName = string(blobName) + string(ext);
    blobURL = "https://" + accountName + ".blob.core.windows.net/" + containerName + "/" + blobName + "?" + sasToken;

    % Read the file content as a string (not bytes)
    fileText = fileread(localFilePath);

    try
        headers = {
            'x-ms-blob-type', 'BlockBlob';
            'Content-Type', 'application/json'
        };

        options = weboptions( ...
            'RequestMethod', 'PUT', ...
            'HeaderFields', headers, ...
            'MediaType', 'application/json', ...
            'Timeout', 60 ...
        );

        % Use webwrite to send the JSON string directly
        webwrite(blobURL, fileText, options);
        fprintf("✅ Successfully uploaded '%s' to Azure Blob Storage.\n", blobName);

    catch ME
        fprintf("❌ Upload failed. Error: %s\n", ME.message);
    end
end


















% function send_json_string_to_blob_storage(jsonString, blobName)
%  % Uploads a JSON string directly to Azure Blob Storage using SAS token
% 
%     import matlab.net.*
%     import matlab.net.http.*
% 
%     accountName = "fypblobstorage";
%     containerName = "fyp-data";
% 
%     % Construct full URL
%     blobBaseURL = "https://" + accountName + ".blob.core.windows.net/" + containerName + "/";
%     sasToken = "sp=racwdli&st=2025-04-15T12:52:05Z&se=2025-04-15T20:52:05Z&spr=https&sv=2024-11-04&sr=c&sig=TRWUajj8UQ%2BBocqLI7hqxUfzrHmxdBi%2FhlWAzGfY6sk%3D";
%     blobURL = blobBaseURL + blobName + "?" + sasToken;
% 
%     % Convert string to uint8 binary
%     % rawData = uint8(jsonString);
%     rawData = unicode2native(jsonString, 'UTF-8');
% 
% 
%     % Create HTTP PUT request
%     url = URI(blobURL);
%     header = HeaderField('x-ms-blob-type', 'BlockBlob');
%     contentType = HeaderField('Content-Type', 'application/json');
% 
%     request = RequestMessage('PUT', [header contentType], rawData);
%     response = request.send(url);
% 
%     % Check response
%     if response.StatusCode == 201
%         fprintf("Successfully uploaded JSON as '%s'\n", blobName);
%     else
%         fprintf("Upload failed. Status: %s\nDetails: %s\n", ...
%             string(response.StatusCode), char(response.Body.Data));
%     end
% 
% end

% function send_json_string_to_blob_storage(jsonString, blobName)
%     % Define Azure Blob Storage details
%     accountName = "fypfilestorage";
%     containerName = "fyp-data";
%     sasToken = "sp=racwdl&st=2025-04-04T00:04:02Z&se=2025-05-10T08:04:02Z&spr=https&sv=2024-11-04&sr=c&sig=qStsgwAN%2FFFeWqnW97dXMDzzUON2X%2FXF98ugP2H3tC4%3D";
% 
%     blobBaseURL = "https://" + accountName + ".blob.core.windows.net/" + containerName + "/";
%     blobURL = blobBaseURL + blobName + "?" + sasToken;
% 
%     try
%         % Convert JSON string to UTF-8 byte stream
%         jsonBytes = unicode2native(jsonString, 'UTF-8');
% 
%         % Manually create headers as name-value pairs
%         headers = {
%             'x-ms-blob-type', 'BlockBlob';
%             'Content-Type', 'application/json'
%         };
% 
%         % Set web options
%         options = weboptions( ...
%             'RequestMethod', 'PUT', ...
%             'HeaderFields', headers, ...
%             'MediaType', 'application/json', ...
%             'Timeout', 60 ...
%         );
% 
%         % Upload the JSON as raw bytes
%         webwrite(blobURL, jsonBytes, options);
% 
%         fprintf("✅ Successfully uploaded JSON to blob: %s\n", blobName);
% 
%     catch ME
%         fprintf("❌ Upload failed for %s.\nError: %s\n", blobName, ME.message);
%     end
% end
