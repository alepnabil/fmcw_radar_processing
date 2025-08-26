% Reads .xml and .raw.bin file from blob storage
% Make sure blob storage is created first
function result = read_data_from_blob_storage()
    result = struct();
    result.status = "success";
    result.message = "All files were downloaded successfully.";
    result.failedFiles = [];

    accountName = "fypblobstorage";
    containerName = "fyp-data";
    sasToken = "";
    blobBaseURL = "https://" + accountName + ".blob.core.windows.net/" + containerName + "/";

    % Base filename
    fdata = "radar_data";

    % Required files
    fileNames = [fdata + ".xml", fdata + ".raw.bin"];

    % Loop through files
    for i = 1:length(fileNames)
        blobURL = blobBaseURL + fileNames(i) + "?" + sasToken;
        outputFile = fullfile(pwd, fileNames(i));

        try
            websave(outputFile, blobURL);
        catch ME
            result.status = "error";
            result.message = "Some files failed to download.";
            result.failedFiles(end+1) = fileNames(i); %#ok<AGROW>
        end
    end
end
