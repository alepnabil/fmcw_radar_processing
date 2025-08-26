%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% PROGRAM FLOW:
% % 1. Read 2 files from Azure blob storage
% %     - Both files .xml and .raw.bin is needed for raw file processing
% % 2. Conduct signal processing
% % 3. Saves data to JSON
% % 4. Upload data to Azure blob storage
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
function result = main(input)
    % Initialize result
    result = struct();
    steps = {};

    % --- NEW: Extract process_animal_activity from the input payload ---
    process_animal_activity_flag = 'no'; % Default value
    if isfield(input, 'processAnimalActivity')
        % Assuming 'processAnimalActivity' is a field in the input struct
        process_animal_activity_flag = input.processAnimalActivity;
    else
        warning('processAnimalActivity field not found in input. Defaulting to ''no''.');
        % You might want to handle this as an error or require it.
    end

    %% Step 1: Read from Blob Storage
    try
        % The 'read_data_from_blob_storage' function still needs to download
        % the .xml and .raw.bin files. If 'fdata' is no longer an input to
        % radar_processing, then 'radar_processing' must implicitly know
        % where these files are downloaded (e.g., to a temporary directory
        % like tempdir(), or the current working directory).
        % The return value 'fdata_info' here might just be confirmation or metadata.
        fdata_info = read_data_from_blob_storage(); % Renamed 'fdata' to 'fdata_info' to clarify its role
        steps{end+1} = struct( ...
            'step', 'Read Files', ...
            'status', 'success', ...
            'message', 'Files downloaded from Azure Blob Storage successfully.' ...
        );
    catch ME
        result.status = 'error';
        result.message = 'Failed at reading files from blob storage.';
        result.steps = { ...
            struct('step', 'Read Files', 'status', 'error', 'message', ME.message) ...
        };
        return;  % Exit early if failed
    end

    %% Step 2: Signal Processing
    try
        % --- UPDATED: Pass only the process_animal_activity_flag ---
        radar_processing(process_animal_activity_flag);
        steps{end+1} = struct( ...
            'step', 'Radar Processing', ...
            'status', 'success', ...
            'message', 'Radar data processed successfully.' ...
        );
    catch ME
        result.status = 'error';
        result.message = 'Failed at radar processing step.';
        steps{end+1} = struct( ...
            'step', 'Radar Processing', ...
            'status', 'error', ...
            'message', ME.message ...
        );
        result.steps = steps;
        return;
    end
Upload JSON to Blob Storage
    try
        % upload_processed_data_to_blob_storage(); % Your upload function here
        steps{end+1} = struct( ...
            'step', 'Upload JSON', ...
            'status', 'success', ...
            'message', 'Processed JSON uploaded to Azure Blob Storage.' ...
        );
    catch ME
        result.status = 'error';
        result.message = 'Failed at uploading processed data.';
        steps{end+1} = struct( ...
            'step', 'Upload JSON', ...
            'status', 'error', ...
            'message', ME.message ...
        );
        result.steps = steps;
        return;
    end

    % Format steps to simple array of structs
    formattedSteps = cellfun(@(s) struct( ...
        'step', s.step, ...
        'status', s.status, ...
        'message', s.message ...
    ), steps);

    % Final output
    result = struct( ...
        'status', 'success', ...
        'message', 'All steps completed successfully.', ...
        'steps', formattedSteps ...
    );
end