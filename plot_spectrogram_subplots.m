% This program iterates through folders(1~15) and plots spectrogram in subplots and
% saves them in the same folder as the .raw.bin and .xml files. Check this
% folder for the generated spectrogram.

% Suitable for results to put in 1 slide of presentation

%% Startup
clc;
clear;
close all;
mainFolder = ['D:\Upm Degree\FYP\Infineon data collection\' ...
    'Firmware_Software\Communication Library\ComLib_Matlab_Interface' ...
    '\RadarSystemExamples\GettingStarted\Data collection\fmcw radar data collection bees\23_4_2025\flies\2nd_take']; % <--- Change to your main folder
% Find all .raw.bin files in subfolders
fileList = dir(fullfile(mainFolder, '**', '*.raw.bin'));
% Check if at least one file is found
if isempty(fileList)
    error('No .raw.bin files found.');
end
% Choose the first file (or modify this logic if you want to select specific files)
selectedFile = fileList(1);
% Get folder and name WITHOUT '.raw.bin'
[~, nameOnly, ~] = fileparts(selectedFile.name);
% Remove the '.raw' manually if it exists
if endsWith(nameOnly, '.raw')
    nameOnly = extractBefore(nameOnly, '.raw');
end
% Now build fdata = folder + nameOnly
fdata = fullfile(selectedFile.folder, nameOnly);
disp(['Selected data file: ', fdata])
%% Constants
c0 = 3e8; % Speed of light in vacuum
%% Load the Raw Data file
[frame, frame_count, calib_data, sXML] = f_parse_data2(fdata); % Data Parser
disp(frame_count)
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
target_measurements.strength = zeros(max_num_targets, frame_count);
target_measurements.range = zeros(max_num_targets, frame_count);
target_measurements.speed = zeros(max_num_targets, frame_count);
range_tx1rx1_max = zeros(range_fft_size, 1);
range_tx1rx1_complete = zeros(range_fft_size, PN, frame_count);
%% ADC Calibration Data
N_cal = length(calib_data) / (2 * num_Rx_antennas);
dec_idx = N_cal / NTS;
calib_i1 = calib_data(1:dec_idx:N_cal);
calib_q1 = calib_data(N_cal+1:dec_idx:2*N_cal);
calib_rx1 = (calib_i1 + 1i * calib_q1).';
% Define window length and ensure overlap < window length
window_length = 15; % Adjust based on resolution needs
overlap = window_length - 1; % Ensure overlap is less than window_length
%% Process the frames in batches
batch_size = 100; % Number of frames per batch
num_batches = ceil(frame_count / batch_size);
pause_time = 5; % Seconds to pause between batches
% Define the folder to save spectrograms
spectrogram_output_folder = fullfile(mainFolder, 'spectrograms');
% Create the output folder if it doesn't exist
if ~exist(spectrogram_output_folder, 'dir')
    mkdir(spectrogram_output_folder);
    disp(['Spectrogram output folder created: ', spectrogram_output_folder]);
end
%% Compute and plot spectrogram for this batch
% --- Configuration ---
spectrogram_title_prefix = 'Bees spectrogram - Batch '; % Prefix for the title
psd_label = 'Normalized PSD (dB)';
num_rows = 2; % Adjust as needed for subplot layout
num_cols = 2; % Adjust as needed for subplot layout
max_plots = num_rows * num_cols; % Maximum number of subplots
figure_handle = figure; % Create a single figure for all subplots
plot_counter = 0;
% ---------------------

for batch = 1:num_batches
    % Calculate start and end frame indices for this batch
    start_frame = (batch-1) * batch_size + 1;
    end_frame = min(batch * batch_size, frame_count);

    disp(['Processing batch ', num2str(batch), ' of ', num2str(num_batches), ...
          ' (frames ', num2str(start_frame), ' to ', num2str(end_frame), ')']);

    % Initialize slow time signal for this batch
    slow_time_signal_batch = [];

    %% Process Frames for this batch
    for fr_idx = start_frame:end_frame
        matrix_raw_data = frame(fr_idx).Chirp; % Raw data for the frame being processed

        %% Fast Time Processing
        matrix_tx1rx1 = matrix_raw_data(:,:,1);   % data of first rx. antenna, first tx. ant
        matrix_tx1rx1 = (matrix_tx1rx1 - repmat(calib_rx1, 1, PN)) .* IF_scale;
        matrix_tx1rx1 = bsxfun(@minus, matrix_tx1rx1, mean(matrix_tx1rx1)); % Mean removal across range
        range_tx1rx1 = fft(matrix_tx1rx1 .* repmat(range_window_func, 1, PN), range_fft_size, 1); % Windowing across range and range FFT
        range_tx1rx1_complete(:, :, fr_idx) = range_tx1rx1; % Save Range FFT for every Frame

        %% Range Target Detection
        range_tx1rx1_max = abs(max(range_tx1rx1, [], 2)); % Data integration of range FFT over the chirps
        [tgt_range_idx, tgt_range_mag] = f_search_peak(range_tx1rx1_max, length(range_tx1rx1_max), ...
                                                       range_threshold, max_num_targets, ...
                                                       min_distance, max_distance, dist_per_bin);

        num_of_targets = length(tgt_range_idx);

        %% Slow Time Processing
        range_Doppler_tx1rx1 = zeros(range_fft_size, Doppler_fft_size);

        if num_of_targets > 0
            rx1_doppler_mean = mean(range_tx1rx1(tgt_range_idx,:), 2); % Compute mean across doppler
            range_tx1rx1(tgt_range_idx,:) = range_tx1rx1(tgt_range_idx,:) - rx1_doppler_mean(1:num_of_targets); % Mean removal across Doppler
            range_Doppler_tx1rx1(tgt_range_idx,:) = fftshift(fft(range_tx1rx1(tgt_range_idx,:) .* ...
                                                  repmat(doppler_window_func.', num_of_targets, 1), ...
                                                  Doppler_fft_size, 2), 2); % Windowing across Doppler and Doppler FFT

            Rx_spectrum(:,:,1) = range_Doppler_tx1rx1; % Range Doppler spectrum

            %% Extraction of Indices from Range-Doppler Map
            tgt_doppler_idx = zeros(1, num_of_targets);

            for j = 1:num_of_targets
                [val, doppler_idx] = max(abs(range_Doppler_tx1rx1(tgt_range_idx(j), :)));
                if (val >= Doppler_threshold && doppler_idx ~= 9)
                    tgt_doppler_idx(j) = doppler_idx;
                else
                    tgt_doppler_idx(j) = 9;
                end
            end

            %%  Measurement Update
            for j = 1:num_of_targets
                target_measurements.strength(j, fr_idx) = tgt_range_mag(j);
                target_measurements.range(j, fr_idx) = (tgt_range_idx(j) - 1) * dist_per_bin;
                target_measurements.speed(j, fr_idx) = (tgt_doppler_idx(j) - Doppler_fft_size/2 - 1) * -fD_per_bin * Hz_to_mps_constant;
            end

            % Store slow-time signal for spectrogram
            selected_range_bin = tgt_range_idx(1); % Index of strongest target
            slow_time_signal_batch = [slow_time_signal_batch, squeeze(range_tx1rx1_complete(selected_range_bin, :, fr_idx))];
        end
    end

    %% Compute and plot spectrogram for this batch as a subplot
    if ~isempty(slow_time_signal_batch)
        plot_counter = plot_counter + 1;

        spectrogram_title = 'Stingless bees spectrogram'; % Default title - can be changed
        psd_label = 'Normalized PSD (dB)';
        if plot_counter <= max_plots
            subplot(num_rows, num_cols, plot_counter);

            % Convert to magnitude
            iq_data = abs(slow_time_signal_batch);

            % Ensure FFT size is a power of 2 for efficiency - USING ORIGINAL APPROACH
            nfft_stft = 2^nextpow2(length(iq_data(:))); % Dynamic based on data length

            % Compute spectrogram
            [S, F, T, P] = spectrogram(iq_data, kaiser(window_length, 3), overlap, nfft_stft, 1/PRT, 'yaxis');

            % Shift zero-frequency component to center
            F = fftshift(F);
            P = fftshift(P, 1); % Shift along the frequency dimension

            G = max(abs(P(:)));
            psd = 20*log10(abs(P)/G);

           % Plot results
            surf(T, F, psd, 'EdgeColor', 'none');
            axis tight;
            view(0, 90);
            c = colorbar; % Get the colorbar handle
            c.Label.String = psd_label; % Label the colorbar
            colormap(jet); % Change to a different colormap
            ylim([0 150]);
            clim([-20 0]);
            xlabel('Time (s)');
            ylabel('Frequency (Hz)');
            title(spectrogram_title); % Set the title

            

            % Save the figure after all subplots are created (outside the loop)
        else
            disp(['Reached maximum number of subplots (', num2str(max_plots), '). Skipping further plots.']);
        end
    end

    % Pause between batches (except after the last batch, or if max plots reached)
    if batch < num_batches && plot_counter < max_plots
        disp(['Pausing for ', num2str(pause_time), ' seconds before processing next batch...']);
        pause(pause_time);
    end
end

% Save the combined figure with all subplots
spectrogram_filename_all = fullfile(spectrogram_output_folder, 'all_batches_spectrogram.png');
saveas(figure_handle, spectrogram_filename_all);
disp(['Combined spectrogram for all batches saved as: ', spectrogram_filename_all]);

disp('Processing complete!');
