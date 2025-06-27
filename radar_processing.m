    %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
% Copyright (c) 2018-2019, Infineon Technologies AG
% All rights reserved.
%
% Redistribution and use in source and binary forms, with or without modification,are permitted provided that the
% following conditions are met:
%
% Redistributions of source code must retain the above copyright notice, this list of conditions and the following
% disclaimer.
%
% Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following
% disclaimer in the documentation and/or other materials provided with the distribution.
%
% Neither the name of the copyright holders nor the names of its contributors may be used to endorse or promote
% products derived from this software without specific prior written permission.
%
% THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
% INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
% DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE  FOR ANY DIRECT, INDIRECT, INCIDENTAL,
% SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
% SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
% WHETHER IN CONTRACT, STRICT LIABILITY,OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
% OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
% DESCRIPTION:
%
% This examples shows the range-Doppler processing for the collected raw
% data and computation of range and speed of the target.
%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%
% NOTES:
%
% For FMCW modulation and one chirp per frame only the range FFT can be
% computed and the Doppler FFT has to be omitted.
% For Doppler modulation there is no FMCWEndpoint in the XML file, the
% range FFT has to be omitted and the Doppler FFT has to be directly computed.
%
% Tracking has not been used in this code. Range and Doppler
% estimates are obatined for every frame and plotted. To obtain better
% results tracking has to be used.

% This program conducts:
% 1. Radar and algorithm configurations
% 2. Calculating theoretical radar values
% 3. Iterates each frames of data and applies:
%     - Fast time processing
%     - Slow time processing
%     - STFT
% 4. Saves algorithms outputs to json file
%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
function radar_processing(fdata)    

%% Conduct signal processing and save data to json file
% 1. spectrogram_data = data to plot spectogram only
% 2. range_fft = data to plot range FFT
% 3. range_speed = data to plot range and speed of objects over time

    %% Constants
    addpath("lib");  % if you put it in a subfolder

    fdata='radar_data'
    c0 = 3e8; % Speed of light in vacuum
    [~, filename, ~] = fileparts(fdata);
    
    disp(fdata); % Output: walking_towards_radar_4_3
    
    %% !!!!!!!! 
    %  to parse the XML file, the package XML2STRUCT is requried.
    %  Please download the package from
    %  https://de.mathworks.com/matlabcentral/fileexchange/28518-xml2struct
    %  unzip it and copy the files into this folder
    %  the function f_parse_data is not compatible with the build-in matlab
    %  function!
    %

    if ~exist('xml2struct', 'file')
    error("Missing required function: xml2struct.m. Ensure it is included in the deployed files.");
    end
 
    %% Load the Raw Data file
    [frame, frame_count, calib_data, sXML] = f_parse_data2(fdata); % Data Parser
    disp(frame_count)
    
    %------Configure radar parameters and algorithm settings--------
    % Frame duration
    frame_time = 150 * 1e-3;
    
    % Pulse repetition time
    up_chirp_duration = str2double(sXML.Device.BaseEndpoint.chirpDuration_ns.Text) * 1e-9;
    down_chirp_duration = 200e-6; % Time required for down chirp
    chirp_to_chirp_delay = 300e-6; % Standby time interval between consequitive chirps
    PRT = up_chirp_duration + down_chirp_duration + chirp_to_chirp_delay; % Pulse repetition time: Delay between the start of two chirps
    
    % Bandwidth
    BW = (str2double(sXML.Device.FmcwEndpoint.FmcwConfiguration.upperFrequency_kHz.Text) - str2double(sXML.Device.FmcwEndpoint.FmcwConfiguration.lowerFrequency_kHz.Text)) * 1e3;
    
    num_Tx_antennas = str2double(sXML.Device.BaseEndpoint.DeviceInfo.numAntennasTx.Text); % Number of Tx antenna
    num_Rx_antennas = str2double(sXML.Device.BaseEndpoint.DeviceInfo.numAntennasRx.Text); % Number of Rx antenna
    
    % Carier frequency
    fC = (str2double(sXML.Device.FmcwEndpoint.FmcwConfiguration.upperFrequency_kHz.Text) + str2double(sXML.Device.FmcwEndpoint.FmcwConfiguration.lowerFrequency_kHz.Text)) / 2 * 1e3;
    
    % Number of ADC smaples per chrip
    NTS = str2double(sXML.Device.BaseEndpoint.FrameFormat.numSamplesPerChirp.Text);
    
    % Number of chirps per frame
    PN = str2double(sXML.Device.BaseEndpoint.FrameFormat.numChirpsPerFrame.Text);
    
    % Sampling frequency
    fS = str2double(sXML.Device.AdcxmcEndpoint.AdcxmcConfiguration.samplerateHz.Text);
    
    %% Algorithm Settings
    range_fft_size = 256; % Zero padding by 4
    Doppler_fft_size = 16; % Zero padding by 4
    
    IF_scale = 16 * 3.3 * range_fft_size / NTS; % Scaling factor for signal strength
    
    range_threshold = 200; % Amplitude threshold to find peaks in range FFT
    Doppler_threshold = 50; % Amplitude threshold to find peaks in Doppler FFT
    
    min_distance =  0.9; % Minimum distance of the target from the radar (recommended to be at least 0.9 m)
    max_distance =  25.0; % Maximum distance of the target from the radar (recommended to be maximum 25.0 m)
    
    max_num_targets = 1; % Maximum number of targets that can be detected
    
    %% Calculate Derived Parameters
    % c0 = speed of light
    lambda = c0/fC;
    
    Hz_to_mps_constant = lambda/2;
    IF_scale = 16 * 3.3 * range_fft_size/NTS;
    
    range_window_func = 2 * blackman(NTS); % Window function for range
    doppler_window_func = 2 * chebwin(PN); % Window function for Doppler
    
    % r_max = 48m
    R_max = NTS * c0 / (2 * BW); % Maximum theoretical range for the system in m
    % 48m/256 = 0.18m. 
    % Eg. in the 2nd bin == range of distance is 0.18m-0.37m.
    % If signal frequency is stronger here, this is the range of object's
    % distance
    dist_per_bin = R_max / range_fft_size; % Resolution of every range bin in m
    % This array bin range shows the range for each bins
    array_bin_range = (0:range_fft_size-1) * dist_per_bin; % Vector of Range in m
    
    
    fD_max = 1 / (2 * PRT); % Maximum theoretical calue of the Doppler
    fD_per_bin = fD_max / Doppler_fft_size; % Value of doppler resolution per bin
    array_bin_fD = ((1:Doppler_fft_size) - Doppler_fft_size/2 - 1) * -fD_per_bin * Hz_to_mps_constant; % Vector of speed in m/s                                           
    
    %% Initialize Structures & Data
    target_measurements.strength = zeros(max_num_targets,frame_count);
    target_measurements.range    = zeros(max_num_targets,frame_count);
    target_measurements.speed    = zeros(max_num_targets,frame_count);
    
    %% create a matrix with rows*columns
    %% so in this case it will create 256 rows(based on our bins) with 16 columns for each of the frames
    range_tx1rx1_max = zeros(range_fft_size,1);
    range_tx1rx1_complete = zeros(range_fft_size,PN,frame_count);
    
    %% ADC Calibration Data
    N_cal = length(calib_data) / (2 * num_Rx_antennas);
    
    dec_idx = N_cal / NTS;
    
    calib_i1 = calib_data(1:dec_idx:N_cal);
    calib_q1 = calib_data(N_cal+1:dec_idx:2*N_cal);
    
    calib_rx1 = (calib_i1 + 1i * calib_q1).';
    
   
    % Define window length and ensure overlap < window length
    window_length = 20; % Adjust based on resolution needs
    overlap = window_length - 1; % Ensure overlap is less than window_length
    
    
    %% Initialize a variable to store concatenated data for all frames
    slow_time_signal_all_frames = [];
    
    frame_count = 200
    %% Main loop for processing Frames
    for fr_idx = 1:frame_count % Loop over all data frames
        
        matrix_raw_data = frame(fr_idx).Chirp; % Raw data for the frame being processed
        
        %% Fast Time Processing
        matrix_tx1rx1 = matrix_raw_data(:,:,1);   % data of first rx. antenna, first tx. antenna
        matrix_tx1rx1 = (matrix_tx1rx1 - repmat(calib_rx1,1,PN)).*IF_scale;
        matrix_tx1rx1 = bsxfun(@minus, matrix_tx1rx1, mean(matrix_tx1rx1)); % Mean removal across range 
        range_tx1rx1 = fft(matrix_tx1rx1.*repmat(range_window_func,1,PN),range_fft_size,1); % Range FFT
        
        range_tx1rx1_complete(:,:,fr_idx) = range_tx1rx1; % Save Range FFT for every Frame
    
        %% Range Target Detection
        range_tx1rx1_max = abs(max(range_tx1rx1,[],2)); % Data integration of range FFT for target detection
        [tgt_range_idx, tgt_range_mag] = f_search_peak(range_tx1rx1_max, length(range_tx1rx1_max), range_threshold, max_num_targets, min_distance, max_distance, dist_per_bin);
        
        num_of_targets = length(tgt_range_idx);
    
        %% Slow Time Processing
        range_Doppler_tx1rx1 = zeros(range_fft_size, Doppler_fft_size);
        rx1_doppler_mean = mean(range_tx1rx1(tgt_range_idx,:),2); % Compute mean across Doppler
        range_tx1rx1(tgt_range_idx,:) = range_tx1rx1(tgt_range_idx,:) - rx1_doppler_mean(1:num_of_targets); % Mean removal across Doppler
        range_Doppler_tx1rx1(tgt_range_idx,:) = fftshift(fft(range_tx1rx1(tgt_range_idx,:).*repmat(doppler_window_func.',num_of_targets,1),Doppler_fft_size,2),2); % Doppler FFT
    
        Rx_spectrum(:,:,1) = range_Doppler_tx1rx1; % Range Doppler spectrum
    
    
    
        %% Extraction of Indices from Range-Doppler Map
        % creates a matrix of 0s
        tgt_doppler_idx = zeros(1,num_of_targets);
        
        % iterate through each column in that 1 row which has maximum magnitude
        % get the maximum magnitude. Once found set that index as the main
        % Doppler magnitude index
        for j = 1:num_of_targets
            [val, doppler_idx] = max(abs(range_Doppler_tx1rx1(tgt_range_idx(j), :)));
            if (val >= Doppler_threshold && doppler_idx ~= 9)
                tgt_doppler_idx(j) = doppler_idx;
            else
                tgt_doppler_idx(j) = 9;
            end
        end
        
        %%  Measurement Update
        if (num_of_targets > 0)
            for j = 1:num_of_targets
                % set the current maximum magnitude 
                target_measurements.strength(fr_idx,j) = tgt_range_mag(j);
                % multiply the maximum magnitude the dist_per_bin value we have
                % calculate by dividing the max/num_of_fft_size
                target_measurements.range(   fr_idx,j) = (tgt_range_idx(j) - 1) * dist_per_bin;
                % calculates the speed using the highest magnitude value
                target_measurements.speed(   fr_idx,j) = (tgt_doppler_idx(j)- Doppler_fft_size/2 - 1) * -fD_per_bin * Hz_to_mps_constant;
            end
        end
    
        
        % After processing the frame, append the processed slow-time data for
        % spectrogram
        if num_of_targets > 0
            selected_range_bin = tgt_range_idx(1); % Index of strongest target
            slow_time_signal_all_frames = [slow_time_signal_all_frames, squeeze(range_tx1rx1_complete(selected_range_bin, :, fr_idx))]; % Concatenate data
        end
    end
    
    
    %% Visualization
    range_tx1rx1_max_abs = squeeze(abs(max(range_tx1rx1_complete,[],2)));
    
    
    %% After all frames are processed, compute the spectrogram for the concatenated signal
    % if ~isempty(slow_time_signal_all_frames)
    iq_data = abs(slow_time_signal_all_frames); % Convert to magnitude
    
    % Ensure FFT size is a power of 2 for efficiency
    nfft_stft = 2^nextpow2(length(iq_data(:))); % Now iq_data is defined!
    
    % Compute spectrogram
    [S, F, T, P] = spectrogram(iq_data, kaiser(window_length, 3), overlap, nfft_stft, 1/PRT, 'yaxis');
    
    % Shift zero-frequency component to center
    F = fftshift(F);
    P = fftshift(P, 1); % Shift along the frequency dimension
    
    G = max(P);
    psd= 20*log10(abs(P)/max(G));
    % Plot results
    
    
    max_slider_index = length(T) - window_length; % Max slider position

    % Create a new invisible figure for this batch
    fig = figure('Visible', 'off', 'Position', [100 100 600 400]);
    surf(T, F, psd, 'EdgeColor', 'none');
    view(0, 90);
    axis tight;
    ylim([0 150]);
    clim([-40 0]);
    axis off;
    colormap(jet);
    colorbar('off');
    
    % Save spectrogram image to current directory
    spectrogram_pic_filename = 'spectrogram.png';  % Simple, flat filename
    exportgraphics(fig, spectrogram_pic_filename, 'Resolution', 600);
    close(fig);

    % Upload to Azure Blob Storage
    send_picture_to_blob_storage(spectrogram_pic_filename);



    
    %% ---- APPLY LOGARITHMIC FREQUENCY SCALING ----
    % Define new frequency scale (logarithmic)
    MAX_FREQ_BINS = 1024;  % Keep output bins manageable
    MIN_FREQ = min(F(F > 0)); % Avoid log(0)
    MAX_FREQ = max(F);
    log_freq_bins = logspace(log10(MIN_FREQ), log10(MAX_FREQ), MAX_FREQ_BINS);
    
    % Interpolate intensity values onto log frequency scale
    interp_intensity = interp1(F, psd, log_freq_bins, 'linear', 'extrap');
    
    
    %% ---- SAVE ALGORITHM OUTPUT DATA TO JSON ----

    % Create output folder if it doesn't exist
    output_folder = 'radar_data';
    if ~exist(output_folder, 'dir')
        mkdir(output_folder);
    end
    
   
    % Prepare data structure for spectrogram
    data.time = T;
    data.frequency = log_freq_bins;
    data.intensity = interp_intensity;
    data.title = 'All Frames - Log-Scaled Spectrogram';
    data.xLabel = 'Time (s)';
    data.yLabel = 'Frequency (Hz)';
    
    % Convert data to JSON
    json_data = jsonencode(data, 'PrettyPrint', true);
    
    % Save JSON to file
    spectrogram_filename = 'spectrogram_data.json';
    fid = fopen(spectrogram_filename, 'w');
    if fid ~= -1
        fprintf(fid, '%s', json_data);
        fclose(fid);
        disp(['Data saved to ', spectrogram_filename]);
    else
        disp('Error: Could not open file for writing.');
    end
    
    send_json_string_to_blob_storage(spectrogram_filename);






    time_axis = (0:frame_count-1) * 0.15; % Convert frames to time in seconds

    % Prepare data for JSON
    range_fft.time_axis = time_axis;
    range_fft.array_bin_range = array_bin_range;
    range_fft.range_tx1rx1_max_abs = range_tx1rx1_max_abs;
    range_fft.filename = filename; % Include the filename
    
    % Convert data to JSON format
    json_data = jsonencode(range_fft, 'PrettyPrint', true);
    
    % Save JSON to file
    range_fft_filename = [filename, '_range_fft_data.json']; % Create a filename
    fid = fopen(range_fft_filename, 'w');
    if fid ~= -1
        fprintf(fid, '%s', json_data);
        fclose(fid);
        disp(['Data saved to ', range_fft_filename]);
    else
        disp('Error: Could not open file for writing.');
    end
   
    send_json_string_to_blob_storage(range_fft_filename);

    time_axis_range_speed = (0:frame_count-1) * 0.15; % Convert frames to time in seconds





    %% 3. Save Target Detection (Range + Speed) Data
    range_speed_data.time_axis = time_axis_range_speed;
    range_speed_data.range = target_measurements.range;
    range_speed_data.speed = target_measurements.speed;
    range_speed_data.filename = filename;

    % Convert to JSON
    range_speed_json = jsonencode(range_speed_data, 'PrettyPrint', true);

    % Save JSON to file
    % range_speed_filename = fullfile(output_folder, 'range_speed.json');
    range_speed_filename = [filename, '_range_speed_data.json']; % Create a filename
    fid = fopen(range_speed_filename, 'w');
    if fid ~= -1
        fprintf(fid, '%s', range_speed_json);
        fclose(fid);
        disp(['✅ Range-Speed data saved to ', range_speed_filename]);
    else
        disp('❌ Error: Could not open file for writing range-speed data.');
    end

     % Save JSON to a separate file (Range and Speed)
    send_json_string_to_blob_storage(range_speed_filename);

    %% -------PLOT AND SAVE FFT DATA----------------
    fr_idx = 100;
    Rspectrum = abs(range_tx1rx1_complete(:,fr_idx));
    
    % Determine the x-axis based on your range FFT size
    num_range_bins = size(Rspectrum, 1);
    range_bins = 0:num_range_bins-1; % Assuming bins start from 0
    

    % Structure for JSON export
    fft_data.range_bins = range_bins;
    fft_data.magnitude = Rspectrum;
    fft_data.frame_index = fr_idx;
    fft_data.filename = filename;
    
    % Encode to JSON
    fft_json = jsonencode(fft_data, 'PrettyPrint', true);
    
    % Save to file
    fft_filename = [filename, '_fft_data.json'];
    fid = fopen(fft_filename, 'w');
    if fid ~= -1
        fprintf(fid, '%s', fft_json);
        fclose(fid);
    else
        disp('❌ Error: Could not open file for writing FFT data.');
    end
    send_json_string_to_blob_storage(fft_filename);




    























    %  % Prepare data for JSON (Range and Speed)
    % range_speed_datatime_axis = time_axis;
    % range_speed_data.range = target_measurements.range;
    % range_speed_data.speed = target_measurements.speed;
    % range_speed_data.filename = filename; % Include the filename
    % 
    % % Convert data to JSON format
    % range_speed_filename = jsonencode(range_speed_data, 'PrettyPrint', true);
    % 
    % % Save JSON to a separate file (Range and Speed)
    % json_range_speed_filename = [filename, '_range_speed_data.json']; % Create a separate filename
    % fid_range_speed = fopen(json_range_speed_filename, 'w');
    % if fid_range_speed ~= -1
    %     fprintf(fid_range_speed, '%s', range_speed_filename);
    %     fclose(fid_range_speed);
    %     disp(['Range and speed data saved to ', json_range_speed_filename]);
    % else
    %     disp('Error: Could not open file for writing range and speed data.');
    % end
    % 
    % send_json_string_to_blob_storage(json_range_speed_filename);

    % 
    % 
    % 
    % % Define FMCW Radar Configuration Structure
    % fmcw_configurations = struct( ...
    %     'frame_time', frame_time, ...
    %     'PRT', PRT, ...
    %     'Bandwidth', BW, ...
    %     'num_Tx_antennas', num_Tx_antennas, ...
    %     'num_Rx_antennas', num_Rx_antennas, ...
    %     'carrier_frequency', fC, ...
    %     'num_ADC_samples_per_chirp', NTS, ...
    %     'num_chirps_per_frame', PN, ...
    %     'sampling_frequency', fS, ...
    %     'range_fft_size', range_fft_size, ...
    %     'Doppler_fft_size', Doppler_fft_size, ...
    %     'IF_scale', IF_scale, ...
    %     'range_threshold', range_threshold, ...
    %     'Doppler_threshold', Doppler_threshold, ...
    %     'min_distance', min_distance, ...
    %     'max_distance', max_distance, ...
    %     'max_num_targets', max_num_targets, ...
    %     'lambda', lambda, ...
    %     'Hz_to_mps_constant', Hz_to_mps_constant, ...
    %     'R_max', R_max, ...
    %     'dist_per_bin', dist_per_bin, ...
    %     'fD_max', fD_max, ...
    %     'fD_per_bin', fD_per_bin, ...
    %     'window_length', window_length, ...
    %     'max_slider_index', max_slider_index, ...
    %     'overlap', overlap ...
    % );
    % 
    % % Convert MATLAB struct to JSON format
    % json_str = jsonencode(fmcw_configurations);
    % 
    % % Format JSON for readability (optional)
    % json_str = strrep(json_str, ',', sprintf(',\n')); 
    % 
    % % Write JSON data to a file
    % filename = 'fmcw_configurations.json';
    % fid = fopen(filename, 'w');
    % if fid == -1
    %     error('Cannot open file: %s', filename);
    % end
    % fprintf(fid, '%s', json_str);
    % fclose(fid);
    % 
    % disp(['JSON file saved as ', filename]);
