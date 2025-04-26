%% Startup
clc;
clear;
close all;

%% Constants
c0 = 3e8; % Speed of light in vacuum
%% Raw Data Name
fdata = 'superman_vertical'

%% !!!!!!!! 
%  to parse the XML file, the package XML2STRUCT is requried.
%  Please download the package from
%  https://de.mathworks.com/matlabcentral/fileexchange/28518-xml2struct
%  unzip it and copy the files into this folder
%  the function f_parse_data is not compatible with the build-in matlab
%  function!
%
if not(isfile("D:\Upm Degree\FYP\Infineon data collection\Firmware_Software\Communication Library\ComLib_Matlab_Interface\RadarSystemExamples\Radarprocessing\xml2struct.m"))
   error("Please install xml2struct.m, please see comments in the source file above!") 
end
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
window_length = 15; % Adjust based on resolution needs
overlap = window_length - 1; % Ensure overlap is less than window_length

%% Initialize a variable to store concatenated data for all frames
slow_time_signal_all_frames = [];



%% Process Frames
for fr_idx = 1:frame_count % Loop over all data frames, while the output window is still open
    
    matrix_raw_data = frame(fr_idx).Chirp; % Raw data for the frame being processed
    
    %% Fast Time Processing
    % select all rows, columns of the RX antenna only
    % matrix_raw_data = contains 64rows*16columns*2 antenna of data 
    % == 64*16*2 == since 2 antenna
      % == 64 samples by ADC * 16 chirps per frame
    % meaning this selects the first chirp
    matrix_tx1rx1 = matrix_raw_data(:,:,1);   % data of first rx. antenna, first tx. ant
     
    % repmat = create a copy of matrix of 1*pn with the value of calib_rx1
    % 1 row*16 columns of calib_rx1
    matrix_tx1rx1 = (matrix_tx1rx1 - repmat(calib_rx1,1,PN)).*IF_scale;
    

    % minus the matrix_tx1rx1 with its means
    matrix_tx1rx1 = bsxfun(@minus, matrix_tx1rx1, mean(matrix_tx1rx1)); % Mean removal across range 
    

    % create a copy of 1row*16 columns of range_window_func of blackman
    % window
    % Multiplied the txrx1 IQ data with the window value functions ==
    % windowing
    % Then performs the FFT on the windowed data with 256 sample for range
    % FFT
    
    %range_tx1rx1 = contains 256 samples for each 16 chirps
    range_tx1rx1 = fft(matrix_tx1rx1.*repmat(range_window_func,1,PN),range_fft_size,1); % Windowing across range and range FFT
   
    % Please note: Since human target detection at far distances is barely
    % feasable, the computation of the FFT in the firmware is limited  to
    % the first half of the spectrum to save memory.
    
    range_tx1rx1_complete(:,:,fr_idx) = range_tx1rx1; % Save Range FFT for every Frame
    

    %% Range Target Detection
    % Detect the targets in range by applying contant amplitude threshold over range
    % gets the maximum values for each chirps(columns) across every bin
    % (rows) then gets the magnitude using absolute values
    range_tx1rx1_max = abs(max(range_tx1rx1,[],2)); % Data integration of range FFT over the chrips for target range detection
    
    % iterates through all 256 samples, find local minima, check if current
    % sample is higher than threshold AND higher than its neighbour
    % calculate samples current distance
    % Multiplying  = Max each chirp magnitude * distance per range bin
    % Will get the distance of object of current frame!!!

    % tgt_range_mag = maximum magnitude detected across range bin and
    % chirps
    [tgt_range_idx, tgt_range_mag] = f_search_peak(range_tx1rx1_max, length(range_tx1rx1_max), range_threshold, max_num_targets, min_distance, max_distance, dist_per_bin);
    
    % 
    num_of_targets = length(tgt_range_idx);
    fprintf("Strongest magnitude index : " , tgt_range_idx)



    %% Slow Time Processing
    % creating matrix of 0s with 256rows with 16 columns
    range_Doppler_tx1rx1 = zeros(range_fft_size, Doppler_fft_size);
    % get the samples after applying FFT and get the index of the maximum
    % magnitude (when comparing between neighbours) and compute mean
    rx1_doppler_mean = mean(range_tx1rx1(tgt_range_idx,:),2); % Compute mean across doppler
    
    % get the strongest magnitude FFT and it cross range bin of each chirps
    % get 1 row of 16 columns and perform DC removal
    range_tx1rx1(tgt_range_idx,:) = range_tx1rx1(tgt_range_idx,:) - rx1_doppler_mean(1:num_of_targets); % Mean removal across Doppler
    
    % perform FFT by multiplying the strongest magnitude row with Doppler
    % window. Assumption = 1rowby 16 columns with the windowing applied
    % Eg, last frame strongest index is 15
    range_Doppler_tx1rx1(tgt_range_idx,:) = fftshift(fft(range_tx1rx1(tgt_range_idx,:).*repmat(doppler_window_func.',num_of_targets,1),Doppler_fft_size,2),2); % Windowing across Doppler and Doppler FFT
    
    Rx_spectrum(:,:,1) = range_Doppler_tx1rx1; % Range Doppler spectrum

    % if num_of_targets > 0
    %         % Choose the strongest detected range bin
    %         selected_range_bin = tgt_range_idx(1); % Index of strongest target
    %         slow_time_signal = squeeze(range_tx1rx1_complete(selected_range_bin, :, fr_idx)); % Extract slow-time signal
    %         iq_data = abs(slow_time_signal); % Convert to magnitude
    % 
    %         % Ensure FFT size is a power of 2 for efficiency
    %         nfft_stft = 2^nextpow2(length(iq_data(:))); % Now iq_data is defined!
    % 
    %         % Compute spectrogram
    %         [S, F, T, P] = spectrogram(iq_data, kaiser(window_length, 3), overlap, nfft_stft, 1/PRT, 'yaxis');
    % 
    %         G=max(P);
    % 
    % 
    % 
    %         % Plot results
    %         figure(1); clf; % Clear figure for real-time update
    %         subplot(2,1,1);
    %         surf(T,F,20*log10(abs(P)/max(G)),'EdgeColor','none');
    %         axis tight;
    %         view(0,90);
    %         colorbar;
    %         clim([-40 0]);
    %         set(gca, 'CLim', [-30 0]); % Sets the color scale from -30 dB to 0 dB
    %         % imagesc(T, F, 20*log10(abs(P)/max(G)),'EdgeColor','none'); % Convert power to dB
    %         axis xy; colormap jet; colorbar;
    %         % ylim([0 100]); % Display frequencies from 0 to 100 Hz
    %         xlabel('Time (s)'); ylabel('Frequency (Hz)');
    %         title(['Frame ' num2str(fr_idx) ' - Time-Frequency Spectrogram']);
    % 
    % 
    % 
    %         pause(1); % Small pause for visualization update
    % end
    
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

%% -------PLOT SPECTROGRAM--------
figure(1); clf; % Clear figure for real-time update
subplot(2,1,1);
surf(T, F, 20*log10(abs(P)/max(G)), 'EdgeColor', 'none');
axis tight;
view(0, 90);
colorbar;
colormap(jet); % Change to a different colormap
ylim([0 200]);
clim([-20 0]);
xlabel('Time (s)');
ylabel('Frequency (Hz)');
title(['All Frames - Time-Frequency Spectrogram']);

