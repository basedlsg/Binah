'use client';

import { useState, useRef, useEffect } from 'react';
import { MusicContent, Playlist, PlaylistItem } from '@/types';

interface MusicPlayerProps {
  content: MusicContent;
  playlist?: Playlist;
  autoPlay?: boolean;
  showPlaylist?: boolean;
  className?: string;
}

export default function MusicPlayer({ 
  content, 
  playlist, 
  autoPlay = false, 
  showPlaylist = false,
  className = '' 
}: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [showWaveform, setShowWaveform] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = playlist?.items[currentTrackIndex] || {
    id: content.id,
    contentId: content.id,
    title: content.title,
    artist: content.artist,
    duration: content.duration,
    url: content.fileUrl,
    thumbnailUrl: content.thumbnailUrl,
  };

  const handlePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const newTime = percentage * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const handleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handlePrevious = () => {
    if (playlist && playlist.items.length > 1) {
      const newIndex = currentTrackIndex > 0 ? currentTrackIndex - 1 : playlist.items.length - 1;
      setCurrentTrackIndex(newIndex);
    }
  };

  const handleNext = () => {
    if (playlist && playlist.items.length > 1) {
      const newIndex = currentTrackIndex < playlist.items.length - 1 ? currentTrackIndex + 1 : 0;
      setCurrentTrackIndex(newIndex);
    }
  };

  const handleTrackEnd = () => {
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else if (repeatMode === 'all' && playlist) {
      handleNext();
    } else if (playlist && currentTrackIndex < playlist.items.length - 1) {
      handleNext();
    } else {
      setIsPlaying(false);
    }
  };

  const handlePlaylistTrackSelect = (index: number) => {
    setCurrentTrackIndex(index);
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleRepeat = () => {
    setRepeatMode(current => {
      switch (current) {
        case 'none': return 'all';
        case 'all': return 'one';
        case 'one': return 'none';
        default: return 'none';
      }
    });
  };

  return (
    <div className={`bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Main Player */}
      <div className="p-6">
        {/* Track Info */}
        <div className="flex items-center space-x-4 mb-6">
          {currentTrack.thumbnailUrl ? (
            <img
              src={currentTrack.thumbnailUrl}
              alt={currentTrack.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white truncate">{currentTrack.title}</h3>
            <p className="text-gray-400 truncate">{currentTrack.artist}</p>
            {content.album && (
              <p className="text-sm text-gray-500 truncate">{content.album}</p>
            )}
          </div>

          {/* Metadata */}
          <div className="text-right text-sm text-gray-400">
            {content.genre && <div>Genre: {content.genre}</div>}
            {content.bpm && <div>BPM: {content.bpm}</div>}
            {content.metadata.year && <div>Year: {content.metadata.year}</div>}
          </div>
        </div>

        {/* Waveform/Progress */}
        <div className="mb-6">
          {showWaveform && content.waveformData ? (
            <div 
              className="h-20 bg-gray-900 rounded-lg flex items-end justify-center space-x-px px-2 cursor-pointer"
              onClick={handleSeek}
            >
              {content.waveformData.map((value, index) => (
                <div
                  key={index}
                  className={`w-1 rounded-sm transition-colors ${
                    index < (currentTime / duration) * content.waveformData!.length
                      ? 'bg-white'
                      : 'bg-gray-600'
                  }`}
                  style={{ height: `${Math.max(value * 100, 4)}%` }}
                />
              ))}
            </div>
          ) : (
            <div
              className="w-full h-2 bg-gray-700 rounded-full cursor-pointer relative"
              onClick={handleSeek}
            >
              <div
                className="h-full bg-white rounded-full transition-all duration-150"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              <div
                className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          )}
          
          <div className="flex justify-between text-sm text-gray-400 mt-2">
            <span>{formatTime(currentTime)}</span>
            <button
              onClick={() => setShowWaveform(!showWaveform)}
              className="text-xs hover:text-white transition-colors"
            >
              {showWaveform ? 'Show Progress' : 'Show Waveform'}
            </button>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Shuffle */}
            <button
              onClick={() => setIsShuffled(!isShuffled)}
              className={`p-2 rounded-lg transition-colors ${
                isShuffled ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
              }`}
              title="Shuffle"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
              </svg>
            </button>

            {/* Previous */}
            <button
              onClick={handlePrevious}
              disabled={!playlist || playlist.items.length <= 1}
              className="p-2 text-white hover:text-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
              title="Previous"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={handlePlay}
              className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Next */}
            <button
              onClick={handleNext}
              disabled={!playlist || playlist.items.length <= 1}
              className="p-2 text-white hover:text-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
              title="Next"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>

            {/* Repeat */}
            <button
              onClick={toggleRepeat}
              className={`p-2 rounded-lg transition-colors ${
                repeatMode !== 'none' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
              </svg>
              {repeatMode === 'one' && (
                <span className="absolute text-xs font-bold">1</span>
              )}
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleMute}
              className="text-white hover:text-gray-300 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 accent-white"
            />
          </div>
        </div>
      </div>

      {/* Playlist */}
      {showPlaylist && playlist && playlist.items.length > 1 && (
        <div className="border-t border-gray-800">
          <div className="p-4">
            <h4 className="text-lg font-semibold text-white mb-3">
              {playlist.name} ({playlist.items.length} tracks)
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {playlist.items.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => handlePlaylistTrackSelect(index)}
                  className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    index === currentTrackIndex
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                  }`}
                >
                  <div className="w-8 text-center text-sm">
                    {index === currentTrackIndex && isPlaying ? (
                      <div className="flex space-x-1 justify-center">
                        <div className="w-1 h-3 bg-white animate-pulse"></div>
                        <div className="w-1 h-3 bg-white animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-1 h-3 bg-white animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.title}</div>
                    <div className="text-sm text-gray-500 truncate">{item.artist}</div>
                  </div>
                  <div className="text-sm">
                    {formatTime(item.duration)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={currentTrack.url}
        autoPlay={autoPlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleTrackEnd}
        className="hidden"
      />
    </div>
  );
}