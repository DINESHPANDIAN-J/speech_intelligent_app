import React, { useRef, useState, useEffect } from 'react';
import { UploadIcon, FileAudioIcon, Trash2Icon, WandSparklesIcon, MicIcon, StopCircleIcon } from './Icons';

type InputMode = 'upload' | 'record';

interface AudioUploaderProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  onAnalyze: () => void;
  onReset: () => void;
  isLoading: boolean;
  inputMode: InputMode;
}

const AudioUploader: React.FC<AudioUploaderProps> = ({ file, onFileChange, onAnalyze, onReset, isLoading, inputMode }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<number | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);

  const cleanupRecording = () => {
    if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
  };

  const handleStartRecording = async () => {
    setMicError(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];
  
        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };
  
        mediaRecorderRef.current.onstop = () => {
          const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const audioFile = new File([audioBlob], `recording-${new Date().toISOString()}.webm`, { type: mimeType });
          onFileChange(audioFile);
          cleanupRecording();
        };
  
        mediaRecorderRef.current.start();
        setIsRecording(true);
        setRecordingSeconds(0);
        recordingIntervalRef.current = window.setInterval(() => {
          setRecordingSeconds(prev => prev + 1);
        }, 1000);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        setMicError("Could not access microphone. Please check your browser permissions.");
        cleanupRecording();
      }
    } else {
        setMicError("Audio recording is not supported by your browser.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
        cleanupRecording();
    };
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => e.preventDefault();
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileChange(e.target.files[0]);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onReset();
    if (inputRef.current) inputRef.current.value = "";
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderRecorder = () => (
    <div className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50">
      {isRecording ? (
        <>
            <button onClick={handleStopRecording} className="flex flex-col items-center justify-center text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                <StopCircleIcon className="w-16 h-16" />
            </button>
            <p className="font-mono text-xl mt-4 text-slate-700 dark:text-slate-200">{formatTime(recordingSeconds)}</p>
            <p className="text-sm mt-1 text-slate-500 dark:text-slate-400">Click to stop recording</p>
        </>
      ) : (
        <>
            <button onClick={handleStartRecording} className="flex flex-col items-center justify-center text-brand-primary hover:text-brand-dark dark:text-brand-secondary dark:hover:text-brand-light transition-colors" disabled={isLoading}>
                <MicIcon className="w-16 h-16" />
            </button>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Click the icon to start recording</p>
            {micError && <p className="mt-2 text-xs text-red-500 dark:text-red-400 text-center">{micError}</p>}
        </>
      )}
    </div>
  );

  const renderUploader = () => (
     <label onDragOver={handleDragOver} onDrop={handleDrop} className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadIcon className="w-10 h-10 mb-3 text-slate-400 dark:text-slate-500" />
            <p className="mb-2 text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">MP3, WAV, M4A</p>
        </div>
        <input ref={inputRef} id="dropzone-file" type="file" className="hidden" accept=".mp3,.wav,.m4a,audio/*" onChange={handleFileSelect} />
    </label>
  );

  return (
    <div className="flex flex-col h-full">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {inputMode === 'upload' ? 'Select an audio file (MP3, WAV, M4A) to get started.' : 'Click the microphone to record your speech directly.'}
        </p>
      
      {!file ? (
        inputMode === 'upload' ? renderUploader() : renderRecorder()
      ) : (
        <div className="flex items-center p-4 rounded-lg bg-brand-light dark:bg-brand-dark/30 border border-brand-secondary/30">
          <FileAudioIcon className="h-10 w-10 text-brand-primary dark:text-brand-light" />
          <div className="ml-4 flex-grow overflow-hidden">
            <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{file.name}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">{Math.round(file.size / 1024)} KB</p>
          </div>
          <button onClick={handleRemoveFile} className="ml-4 p-2 rounded-full text-slate-500 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-colors">
            <Trash2Icon className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="mt-auto pt-6">
        <button
          onClick={onAnalyze}
          disabled={!file || isLoading || isRecording}
          className="w-full flex items-center justify-center bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-dark disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Analyzing...
            </>
          ) : (
            <>
              <WandSparklesIcon className="h-5 w-5 mr-2" />
              Analyze Speech
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AudioUploader;
