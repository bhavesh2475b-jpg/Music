/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  Search, 
  Library, 
  PlusSquare, 
  Heart, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Repeat, 
  Shuffle, 
  Volume2, 
  ListMusic,
  Search as SearchIcon,
  MoreHorizontal,
  Clock,
  ChevronDown,
  Maximize2,
  ListPlus,
  X,
  GripVertical,
  Radio,
  Sparkles,
  Mic2,
  Filter,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { Toaster, toast } from 'sonner';
import YouTube, { YouTubeProps } from 'react-youtube';
import { cn } from './lib/utils';
import { Track, Playlist } from './types';
import { searchYouTube, getTrendingMusic, searchPlaylists, getPlaylistItems } from './services/youtube';
import { fetchLyrics } from './services/lyrics';
import { PlayerControls } from './components/PlayerControls';
import { Skeleton, TrackSkeleton, PlaylistSkeleton } from './components/Skeleton';
import { Visualizer } from './components/Visualizer';

export interface QueueTrack extends Track {
  queueId: string;
}

export default function App() {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'library' | 'playlist'>('home');
  const [volume, setVolume] = useState(50);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullScreenPlayerOpen, setIsFullScreenPlayerOpen] = useState(false);
  const [queue, setQueue] = useState<QueueTrack[]>([]);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isAutoplayEnabled, setIsAutoplayEnabled] = useState(true);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'all' | 'one'>('none');
  const [history, setHistory] = useState<Track[]>([]);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  
  // Playlist states
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [recommendedPlaylists, setRecommendedPlaylists] = useState<{title: string, items: any[]}[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [isCreatePlaylistModalOpen, setIsCreatePlaylistModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isAddToPlaylistModalOpen, setIsAddToPlaylistModalOpen] = useState(false);
  const [trackToAdd, setTrackToAdd] = useState<Track | null>(null);
  const [isLoadingPlaylistItems, setIsLoadingPlaylistItems] = useState(false);

  const playerRef = useRef<any>(null);

  useEffect(() => {
    playerRef.current = null; // Clear player reference when track changes to avoid using unmounted player
    if (currentTrack) {
      setIsLoadingLyrics(true);
      setLyrics(null);
      fetchLyrics(currentTrack.artist, currentTrack.title).then(res => {
        setLyrics(res);
        setIsLoadingLyrics(false);
      });
    }
  }, [currentTrack]);

  useEffect(() => {
    const fetchTrending = async () => {
      const tracks = await getTrendingMusic();
      setTrendingTracks(tracks);
    };
    const fetchRecPlaylists = async () => {
      setIsLoadingRecommendations(true);
      const categories = ['Top Hits', 'Chill Vibes', 'Workout Mix'];
      const recs = await Promise.all(
        categories.map(async (cat) => {
          const items = await searchPlaylists(`${cat} music playlist`);
          return { title: cat, items };
        })
      );
      setRecommendedPlaylists(recs.filter(r => r.items.length > 0));
      setIsLoadingRecommendations(false);
    };
    fetchTrending();
    fetchRecPlaylists();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const results = await searchYouTube(searchQuery);
    setSearchResults(results);
  };

  const playTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }
    
    // Add current track to history before switching
    if (currentTrack) {
      setHistory(prev => [currentTrack, ...prev].slice(0, 50));
    }
    
    setCurrentTrack(track);
    setIsPlaying(true);
    playerRef.current = null; // Reset player ref for new track
  };

  const addToQueue = (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    setQueue(prev => [...prev, { ...track, queueId: Math.random().toString(36).substring(2, 9) }]);
  };

  const removeFromQueue = (e: React.MouseEvent, queueId: string) => {
    e.stopPropagation();
    setQueue(prev => prev.filter(t => t.queueId !== queueId));
  };

  const handleGenerateQueue = async () => {
    if (!currentTrack) return;
    try {
      const results = await searchYouTube(`${currentTrack.artist} mix`);
      const newTracks = results
        .filter(t => t.youtubeId !== currentTrack.youtubeId && !queue.some(qt => qt.youtubeId === t.youtubeId))
        .map(t => ({ ...t, queueId: Math.random().toString(36).substring(2, 9) }));
      
      if (newTracks.length > 0) {
        setQueue(prev => [...prev, ...newTracks]);
      }
    } catch (e) {
      console.error('Failed to generate queue:', e);
    }
  };

  const createPlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const newPlaylist: Playlist = {
      id: Math.random().toString(36).substring(2, 9),
      name: newPlaylistName,
      tracks: [],
      image: ''
    };
    setPlaylists([...playlists, newPlaylist]);
    setNewPlaylistName('');
    setIsCreatePlaylistModalOpen(false);
  };

  const addTrackToPlaylist = (playlistId: string) => {
    if (!trackToAdd) return;
    setPlaylists(playlists.map(p => {
      if (p.id === playlistId) {
        return {
          ...p,
          tracks: [...p.tracks, trackToAdd],
          image: p.image || trackToAdd.thumbnail
        };
      }
      return p;
    }));
    setIsAddToPlaylistModalOpen(false);
    setTrackToAdd(null);
  };

  const removeTrackFromPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists(playlists.map(p => {
      if (p.id === playlistId) {
        const newTracks = p.tracks.filter(t => t.id !== trackId);
        return {
          ...p,
          tracks: newTracks,
          image: newTracks.length > 0 ? newTracks[0].thumbnail : ''
        };
      }
      return p;
    }));
    if (activePlaylist?.id === playlistId) {
      setActivePlaylist(prev => prev ? { ...prev, tracks: prev.tracks.filter(t => t.id !== trackId) } : null);
    }
  };

  const openUserPlaylist = (playlist: Playlist) => {
    setActivePlaylist(playlist);
    setActiveTab('playlist');
  };

  const openYoutubePlaylist = async (playlistId: string, name: string, image: string) => {
    setIsLoadingPlaylistItems(true);
    setActiveTab('playlist');
    const items = await getPlaylistItems(playlistId);
    setActivePlaylist({
      id: playlistId,
      name,
      image,
      tracks: items
    });
    setIsLoadingPlaylistItems(false);
  };

  const handleReorderPlaylist = (newOrder: Track[]) => {
    if (!activePlaylist) return;
    
    // Update active playlist
    setActivePlaylist({
      ...activePlaylist,
      tracks: newOrder
    });

    // If it's a user playlist, update it in the playlists array
    setPlaylists(prev => prev.map(p => 
      p.id === activePlaylist.id ? { ...p, tracks: newOrder } : p
    ));
  };

  const playNext = async () => {
    if (repeatMode === 'one' && currentTrack) {
      if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(0);
        playerRef.current.playVideo();
      } else {
        const track = { ...currentTrack };
        setCurrentTrack(null);
        setTimeout(() => setCurrentTrack(track), 10);
      }
      return;
    }

    if (queue.length > 0) {
      let nextTrackIndex = 0;
      if (isShuffle) {
        nextTrackIndex = Math.floor(Math.random() * queue.length);
      }
      
      const nextTrack = queue[nextTrackIndex];
      const newQueue = [...queue];
      newQueue.splice(nextTrackIndex, 1);
      setQueue(newQueue);
      playTrack(nextTrack);
    } else if (isAutoplayEnabled && currentTrack) {
      try {
        const results = await searchYouTube(`${currentTrack.artist} mix`);
        const newTracks = results
          .filter(t => t.youtubeId !== currentTrack.youtubeId)
          .map(t => ({ ...t, queueId: Math.random().toString(36).substring(2, 9) }));
        
        if (newTracks.length > 0) {
          const nextTrack = newTracks[0];
          setQueue(newTracks.slice(1));
          playTrack(nextTrack);
        } else {
          setIsPlaying(false);
          if (playerRef.current) {
            try {
              if (typeof playerRef.current.stopVideo === 'function') {
                playerRef.current.stopVideo();
              }
            } catch (e) {
              console.error('Player control error:', e);
              playerRef.current = null;
            }
          }
        }
      } catch (e) {
        setIsPlaying(false);
        if (playerRef.current) {
          try {
            if (typeof playerRef.current.stopVideo === 'function') {
              playerRef.current.stopVideo();
            }
          } catch (e) {
            console.error('Player control error:', e);
            playerRef.current = null;
          }
        }
      }
    } else if (repeatMode === 'all' && history.length > 0) {
      // Simple repeat all: play the oldest track in history or first in queue if we had one
      // For now, let's just stop or play the first track if we have a list context
      setIsPlaying(false);
    } else {
      setIsPlaying(false);
      if (playerRef.current) {
        try {
          if (typeof playerRef.current.stopVideo === 'function') {
            playerRef.current.stopVideo();
          }
        } catch (e) {
          console.error('Player control error:', e);
          playerRef.current = null;
        }
      }
    }
  };

  const playPrevious = () => {
    if (progress > 3 && playerRef.current) {
      try {
        if (typeof playerRef.current.seekTo === 'function') {
          playerRef.current.seekTo(0);
        }
      } catch (e) {
        console.error('Player control error:', e);
        playerRef.current = null;
      }
    } else if (history.length > 0) {
      const prevTrack = history[0];
      setHistory(prev => prev.slice(1));
      
      // Switch to previous track
      setCurrentTrack(prevTrack);
      setIsPlaying(true);
      playerRef.current = null;
    } else {
      // Fallback to start of current track if no history
      if (playerRef.current) {
        try {
          if (typeof playerRef.current.seekTo === 'function') {
            playerRef.current.seekTo(0);
          }
        } catch (e) {
          console.error('Player control error:', e);
          playerRef.current = null;
        }
      }
    }
  };

  const toggleShuffle = () => setIsShuffle(!isShuffle);
  const toggleRepeat = () => {
    const modes: ('none' | 'all' | 'one')[] = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    setRepeatMode(modes[(currentIndex + 1) % modes.length]);
  };

  const togglePlay = () => {
    if (playerRef.current) {
      try {
        // Check if player is actually ready and has the methods
        if (typeof playerRef.current.getPlayerState !== 'function') {
          throw new Error('Player not ready');
        }
        
        const state = playerRef.current.getPlayerState();
        if (state === 1) { // playing
          playerRef.current.pauseVideo();
          setIsPlaying(false);
        } else {
          playerRef.current.playVideo();
          setIsPlaying(true);
        }
      } catch (e) {
        console.error('Player control error:', e);
        // Clear ref if it's invalid
        playerRef.current = null;
        // Fallback: just toggle state if player object is finicky
        setIsPlaying(!isPlaying);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    console.log('YouTube Player Ready');
    playerRef.current = event.target;
    event.target.setVolume(volume);
    event.target.playVideo();
  };

  const onPlayerError: YouTubeProps['onError'] = (event) => {
    console.error('YouTube Player Error:', event.data);
    let message = 'An error occurred with the player.';
    if (event.data === 2) message = 'Invalid parameter.';
    if (event.data === 5) message = 'HTML5 player error.';
    if (event.data === 100) message = 'Video not found or removed.';
    if (event.data === 101 || event.data === 150) message = 'Embedding restricted by uploader.';
    
    toast.error(`Playback Error: ${message}`, {
      description: 'Try another track or check if the video is available in your region.'
    });
    setIsPlaying(false);
  };

  const onStateChange: YouTubeProps['onStateChange'] = (event) => {
    console.log('YouTube Player State Change:', event.data);
    // 1 = playing, 2 = paused, 0 = ended
    if (event.data === 1) setIsPlaying(true);
    if (event.data === 2) setIsPlaying(false);
    if (event.data === 0) {
      playNext();
    }
    
    if (event.data === 1) {
      setDuration(event.target.getDuration());
    }
  };

  // Progress tracking in a separate effect
  useEffect(() => {
    let interval: any;
    if (isPlaying && playerRef.current) {
      interval = setInterval(() => {
        try {
          setProgress(playerRef.current.getCurrentTime());
        } catch (e) {
          // Ignore errors during transition
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setProgress(time);
    if (playerRef.current) {
      playerRef.current.seekTo(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value);
    setVolume(v);
    if (playerRef.current) {
      playerRef.current.setVolume(v);
    }
  };

  return (
    <div className="flex h-screen bg-[#141218] text-[#E6E0E9] font-sans overflow-hidden selection:bg-[#D0BCFF] selection:text-[#381E72]">
      <Toaster position="top-right" richColors closeButton />
      
      {/* Modals */}
      <AnimatePresence>
        {isCreatePlaylistModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#2B2930] p-8 rounded-[2rem] w-full max-w-md shadow-2xl border border-white/10"
            >
              <h2 className="text-2xl font-bold text-[#E6E0E9] mb-6">Create Playlist</h2>
              <form onSubmit={createPlaylist}>
                <input 
                  type="text" 
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Playlist name"
                  className="w-full bg-[#141218] text-[#E6E0E9] px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D0BCFF] mb-6"
                  autoFocus
                />
                <div className="flex justify-end space-x-4">
                  <button 
                    type="button"
                    onClick={() => setIsCreatePlaylistModalOpen(false)}
                    className="px-6 py-3 rounded-full text-[#CAC4D0] hover:bg-[#36343B] transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={!newPlaylistName.trim()}
                    className="px-6 py-3 rounded-full bg-[#D0BCFF] text-[#381E72] font-bold hover:bg-[#E8DEF8] transition-colors disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isAddToPlaylistModalOpen && trackToAdd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#2B2930] p-8 rounded-[2rem] w-full max-w-md shadow-2xl border border-white/10 flex flex-col max-h-[80vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#E6E0E9]">Add to Playlist</h2>
                <button onClick={() => setIsAddToPlaylistModalOpen(false)} className="text-[#CAC4D0] hover:text-[#E6E0E9]">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex items-center space-x-4 mb-6 p-4 bg-[#141218] rounded-2xl">
                <img src={trackToAdd.thumbnail} alt={trackToAdd.title} className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-[#E6E0E9] font-medium truncate">{trackToAdd.title}</p>
                  <p className="text-[#CAC4D0] text-sm truncate">{trackToAdd.artist}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
                {playlists.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[#CAC4D0] mb-4">You don't have any playlists yet.</p>
                    <button 
                      onClick={() => {
                        setIsAddToPlaylistModalOpen(false);
                        setIsCreatePlaylistModalOpen(true);
                      }}
                      className="px-6 py-2 rounded-full bg-[#4A4458] text-[#E8DEF8] font-medium hover:bg-[#635B70] transition-colors"
                    >
                      Create One
                    </button>
                  </div>
                ) : (
                  playlists.map(playlist => (
                    <button
                      key={playlist.id}
                      onClick={() => addTrackToPlaylist(playlist.id)}
                      className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-[#36343B] transition-colors group"
                    >
                      <span className="text-[#E6E0E9] font-medium">{playlist.name}</span>
                      <PlusSquare className="w-5 h-5 text-[#CAC4D0] group-hover:text-[#D0BCFF]" />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 bg-[#1D1B20] rounded-[2rem] my-4 mx-4 overflow-y-auto relative shadow-sm border border-white/5 transition-all duration-300">
        <header className="sticky top-0 z-10 p-6 flex justify-between items-center bg-[#1D1B20]/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex space-x-6 items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#D0BCFF] rounded-xl flex items-center justify-center shadow-sm">
                <Play className="w-5 h-5 text-[#381E72] fill-current" />
              </div>
              <span className="text-xl font-bold tracking-tight text-[#E6E0E9]">TuneStream</span>
            </div>
            <div className="flex space-x-2">
              <button className="w-10 h-10 bg-[#2B2930] rounded-full flex items-center justify-center hover:bg-[#36343B] transition-colors text-[#CAC4D0]">
                <SkipBack className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 bg-[#2B2930] rounded-full flex items-center justify-center hover:bg-[#36343B] transition-colors text-[#CAC4D0]">
                <SkipForward className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="bg-[#D0BCFF] text-[#381E72] px-6 py-2.5 rounded-full font-bold text-sm hover:bg-[#E8DEF8] transition-colors shadow-sm">
              Upgrade
            </button>
            <div className="w-10 h-10 bg-[#4A4458] rounded-full border-2 border-[#D0BCFF] flex items-center justify-center text-[#E8DEF8] font-bold">
              U
            </div>
          </div>
        </header>

        <div className="p-8 pt-4 pb-80">
          {activeTab === 'home' && (
            <section className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Hero Section - Bento Style */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#381E72] to-[#141218] p-10 lg:p-16 border border-white/10 shadow-2xl group">
                  <div className="relative z-10 max-w-xl">
                    <h2 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-[#E8DEF8] mb-6 leading-tight font-display">
                      Discover your <br/><span className="text-[#D0BCFF] text-glow">next favorite</span>
                    </h2>
                    <p className="text-xl text-[#CAC4D0] mb-8 font-medium">Explore trending hits and curated playlists tailored for you.</p>
                    <button 
                      onClick={() => setActiveTab('search')}
                      className="bg-[#D0BCFF] text-[#381E72] px-8 py-4 rounded-full font-bold text-lg hover:bg-[#E8DEF8] transition-all shadow-lg flex items-center gap-3 hover:scale-105 active:scale-95"
                    >
                      <SearchIcon className="w-6 h-6" />
                      Start Exploring
                    </button>
                  </div>
                  <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#D0BCFF] rounded-full mix-blend-overlay filter blur-[100px] opacity-30 group-hover:opacity-40 transition-opacity duration-700"></div>
                  <div className="absolute right-40 -top-20 w-72 h-72 bg-[#FFD8E4] rounded-full mix-blend-overlay filter blur-[80px] opacity-20 group-hover:opacity-30 transition-opacity duration-700"></div>
                </div>

                <div className="bg-[#2B2930] rounded-[3rem] p-8 border border-white/5 flex flex-col justify-between relative overflow-hidden group">
                  <div className="relative z-10">
                    <Sparkles className="w-10 h-10 text-[#D0BCFF] mb-4" />
                    <h3 className="text-2xl font-bold text-[#E6E0E9] mb-2 font-display">Daily Mix</h3>
                    <p className="text-[#CAC4D0] text-sm">A special selection of tracks picked just for you based on your history.</p>
                  </div>
                  <button 
                    onClick={handleGenerateQueue}
                    className="relative z-10 mt-6 w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[#E6E0E9] font-bold transition-all border border-white/10 flex items-center justify-center gap-2 group-hover:border-[#D0BCFF]/30"
                  >
                    Generate Mix
                  </button>
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#381E72] rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                </div>
              </div>

              {/* User Playlists */}
              {playlists.length > 0 && (
                <div>
                  <div className="flex justify-between items-end mb-8 px-2">
                    <h3 className="text-3xl font-extrabold tracking-tight text-[#E6E0E9] font-display">Your Playlists</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {playlists.map((playlist) => (
                      <motion.div 
                        key={playlist.id}
                        whileHover={{ y: -8, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-[#2B2930] p-5 rounded-[2rem] hover:bg-[#36343B] transition-all duration-300 group cursor-pointer border border-white/5 shadow-md"
                        onClick={() => openUserPlaylist(playlist)}
                      >
                        <div className="relative mb-5 aspect-square rounded-2xl overflow-hidden bg-[#4A4458] flex items-center justify-center shadow-inner">
                          {playlist.image ? (
                            <img src={playlist.image} alt={playlist.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          ) : (
                            <ListMusic className="w-12 h-12 text-[#CAC4D0] opacity-50" />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <div className="w-14 h-14 bg-[#D0BCFF] rounded-full flex items-center justify-center shadow-xl scale-75 group-hover:scale-100 transition-transform duration-300">
                              <Play className="w-7 h-7 text-[#381E72] fill-current ml-1" />
                            </div>
                          </div>
                        </div>
                        <h4 className="font-bold text-lg text-[#E6E0E9] truncate mb-1">{playlist.name}</h4>
                        <p className="text-sm text-[#CAC4D0] font-medium">{playlist.tracks.length} tracks</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Playlists */}
              <div className="space-y-12">
                {isLoadingRecommendations ? (
                  <div className="space-y-12">
                    {[1, 2].map(i => (
                      <div key={i}>
                        <Skeleton className="h-8 w-48 mb-6 ml-2" />
                        <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar">
                          {[1, 2, 3, 4, 5].map(j => <TrackSkeleton key={j} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recommendedPlaylists.map((category, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-end mb-6 px-2">
                      <h3 className="text-2xl font-bold tracking-tight text-[#E6E0E9] font-display">{category.title}</h3>
                    </div>
                    <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar">
                      {category.items.map((playlist) => (
                        <motion.div 
                          key={playlist.id}
                          whileHover={{ y: -8, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-[#2B2930] p-4 rounded-[2rem] hover:bg-[#36343B] transition-all duration-300 group cursor-pointer border border-white/5 shadow-md shrink-0 w-48"
                          onClick={() => openYoutubePlaylist(playlist.id, playlist.name, playlist.image)}
                        >
                          <div className="relative mb-4 aspect-square rounded-2xl overflow-hidden shadow-inner">
                            <img src={playlist.image} alt={playlist.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                              <div className="w-12 h-12 bg-[#D0BCFF] rounded-full flex items-center justify-center shadow-xl scale-75 group-hover:scale-100 transition-transform duration-300">
                                <Play className="w-6 h-6 text-[#381E72] fill-current ml-1" />
                              </div>
                            </div>
                          </div>
                          <h4 className="font-bold text-base text-[#E6E0E9] truncate mb-1">{playlist.name}</h4>
                          <p className="text-xs text-[#CAC4D0] font-medium truncate">{playlist.channelTitle}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Trending Now */}
              <div>
                <div className="flex justify-between items-end mb-6 px-2">
                  <h3 className="text-2xl font-bold tracking-tight text-[#E6E0E9] font-display">Trending Now</h3>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar">
                  {trendingTracks.length === 0 ? (
                    [1, 2, 3, 4, 5].map(i => <TrackSkeleton key={i} />)
                  ) : trendingTracks.map((track) => (
                    <motion.div 
                      key={track.id}
                      whileHover={{ y: -8, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-[#2B2930] p-4 rounded-[2rem] hover:bg-[#36343B] transition-all duration-300 group cursor-pointer border border-white/5 shadow-md shrink-0 w-48"
                      onClick={() => playTrack(track)}
                    >
                      <div className="relative mb-4 aspect-square rounded-2xl overflow-hidden shadow-inner">
                        <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          {currentTrack?.id === track.id ? (
                            <Visualizer isPlaying={isPlaying} count={5} className="h-8" />
                          ) : (
                            <div className="w-12 h-12 bg-[#D0BCFF] rounded-full flex items-center justify-center shadow-xl scale-75 group-hover:scale-100 transition-transform duration-300">
                              <Play className="w-6 h-6 text-[#381E72] fill-current ml-1" />
                            </div>
                          )}
                        </div>
                      </div>
                      <h4 className="font-bold text-base text-[#E6E0E9] truncate mb-1">{track.title}</h4>
                      <p className="text-xs text-[#CAC4D0] font-medium truncate">{track.artist}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeTab === 'playlist' && activePlaylist && (
            <section className="space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row items-end gap-8 bg-gradient-to-b from-[#381E72]/40 to-transparent p-8 rounded-[3rem] border border-white/5">
                <div className="w-48 h-48 md:w-64 md:h-64 shrink-0 rounded-[2rem] overflow-hidden shadow-2xl bg-[#2B2930] flex items-center justify-center">
                  {activePlaylist.image ? (
                    <img src={activePlaylist.image} alt={activePlaylist.name} className="w-full h-full object-cover" />
                  ) : (
                    <ListMusic className="w-24 h-24 text-[#CAC4D0] opacity-50" />
                  )}
                </div>
                <div className="flex flex-col space-y-4">
                  <span className="text-sm font-bold uppercase tracking-widest text-[#CAC4D0]">Playlist</span>
                  <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-[#E6E0E9]">{activePlaylist.name}</h1>
                  <p className="text-[#CAC4D0] font-medium">{activePlaylist.tracks.length} tracks</p>
                  <div className="flex items-center gap-4 pt-4">
                    <button 
                      onClick={() => {
                        if (activePlaylist.tracks.length > 0) {
                          setQueue(activePlaylist.tracks.map(t => ({ ...t, queueId: Math.random().toString(36).substring(2, 9) })));
                          playTrack(activePlaylist.tracks[0]);
                        }
                      }}
                      className="w-16 h-16 bg-[#D0BCFF] rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
                    >
                      <Play className="w-8 h-8 text-[#381E72] fill-current ml-1" />
                    </button>
                    <button className="w-12 h-12 bg-[#2B2930] rounded-full flex items-center justify-center hover:bg-[#36343B] transition-colors text-[#CAC4D0]">
                      <Shuffle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-4">
                {isLoadingPlaylistItems ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <TrackSkeleton key={i} />)}
                  </div>
                ) : activePlaylist.tracks.length === 0 ? (
                  <div className="text-center py-12 bg-[#2B2930] rounded-[2rem] border border-white/5">
                    <p className="text-[#CAC4D0] text-lg font-medium">This playlist is empty.</p>
                    <p className="text-[#CAC4D0] text-sm mt-2">Find some songs and add them here!</p>
                  </div>
                ) : (
                  <Reorder.Group 
                    axis="y" 
                    values={activePlaylist.tracks} 
                    onReorder={handleReorderPlaylist} 
                    className="space-y-2"
                  >
                    {activePlaylist.tracks.map((track, index) => (
                      <Reorder.Item 
                        key={track.id + index}
                        value={track}
                        className="flex items-center p-4 rounded-2xl hover:bg-[#2B2930] transition-colors group cursor-pointer"
                        onClick={() => playTrack(track)}
                      >
                        <div className="flex items-center justify-center w-8">
                          {currentTrack?.id === track.id ? (
                            <Visualizer isPlaying={isPlaying} count={3} className="h-4" />
                          ) : (
                            <>
                              <span className="text-[#CAC4D0] font-medium group-hover:hidden">{index + 1}</span>
                              <GripVertical className="w-5 h-5 text-[#CAC4D0] hidden group-hover:block cursor-grab active:cursor-grabbing" />
                            </>
                          )}
                        </div>
                        <img src={track.thumbnail} alt={track.title} className="w-12 h-12 rounded-lg object-cover mx-4" />
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-[#E6E0E9] font-bold truncate">{track.title}</p>
                          <p className="text-[#CAC4D0] text-sm font-medium truncate">{track.artist}</p>
                        </div>
                        <div className="flex items-center space-x-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTrackFromPlaylist(activePlaylist.id, track.id);
                            }}
                            className="text-[#CAC4D0] hover:text-[#FFD8E4] p-2"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                )}
              </div>
            </section>
          )}

          {activeTab === 'search' && (
            <section className="space-y-10">
              <form onSubmit={handleSearch} className="relative max-w-2xl">
                <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-[#CAC4D0] w-6 h-6" />
                <input 
                  type="text" 
                  placeholder="What do you want to listen to?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#2B2930] border border-white/10 rounded-full py-5 pl-16 pr-6 text-lg focus:ring-2 focus:ring-[#D0BCFF] transition-all outline-none text-[#E6E0E9] placeholder:text-[#CAC4D0]"
                />
              </form>

              {searchResults.length > 0 ? (
                <div>
                  <h3 className="text-2xl font-bold mb-6 tracking-tight text-[#E8DEF8]">Results</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {searchResults.map((track) => (
                      <motion.div 
                        key={track.id}
                        whileHover={{ y: -8 }}
                        className="bg-[#2B2930] p-4 rounded-[2rem] hover:bg-[#36343B] transition-colors group cursor-pointer shadow-sm border border-white/5"
                        onClick={() => playTrack(track)}
                      >
                        <div className="relative mb-4 aspect-square">
                          <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover rounded-[1.5rem] shadow-md" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm rounded-[1.5rem]">
                            {currentTrack?.id === track.id ? (
                              <Visualizer isPlaying={isPlaying} count={5} className="h-10" />
                            ) : (
                              <div className="w-14 h-14 bg-[#D0BCFF] rounded-full flex items-center justify-center shadow-xl scale-75 group-hover:scale-100 transition-transform duration-300">
                                <Play className="w-7 h-7 text-[#381E72] fill-current ml-1" />
                              </div>
                            )}
                          </div>
                          <div className="absolute bottom-3 right-3 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setTrackToAdd(track);
                                setIsAddToPlaylistModalOpen(true);
                              }} 
                              className="w-10 h-10 bg-[#4A4458]/90 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-[#D0BCFF] hover:text-[#381E72] text-[#E8DEF8] transition-colors shadow-lg"
                            >
                              <PlusSquare className="w-4 h-4" />
                            </button>
                            <button onClick={(e) => addToQueue(e, track)} className="w-10 h-10 bg-[#4A4458]/90 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-[#D0BCFF] hover:text-[#381E72] text-[#E8DEF8] transition-colors shadow-lg">
                              <ListPlus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <h4 className="font-bold text-[#E6E0E9] truncate mb-1 text-lg">{track.title}</h4>
                        <p className="text-[#CAC4D0] text-sm truncate">{track.artist}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-2xl font-bold mb-6 tracking-tight text-[#E8DEF8]">Browse all</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {['Pop', 'Hip-Hop', 'Rock', 'Jazz', 'Classical', 'Electronic', 'Country', 'R&B'].map((genre, i) => (
                      <div 
                        key={genre}
                        className={cn(
                          "h-40 rounded-[2rem] p-5 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform shadow-sm",
                          `bg-gradient-to-br ${[
                            'from-[#FFB4AB] to-[#93000A]',
                            'from-[#D0BCFF] to-[#381E72]',
                            'from-[#82D3E0] to-[#004F58]',
                            'from-[#F2B8B5] to-[#8C1D18]',
                            'from-[#CBA6F7] to-[#4A148C]',
                            'from-[#FFD8E4] to-[#631133]',
                            'from-[#A8EFC1] to-[#005227]',
                            'from-[#FFDE9C] to-[#5D4200]'
                          ][i]}`
                        )}
                      >
                        <h4 className="text-2xl font-bold text-white/90">{genre}</h4>
                        <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/20 rotate-12 rounded-2xl backdrop-blur-sm"></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === 'library' && (
            <section className="space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-between items-end mb-8 px-2">
                <h3 className="text-4xl font-extrabold tracking-tight text-[#E6E0E9]">Your Library</h3>
                <button 
                  onClick={() => setIsCreatePlaylistModalOpen(true)}
                  className="bg-[#D0BCFF] text-[#381E72] px-6 py-2.5 rounded-full font-bold text-sm hover:bg-[#E8DEF8] transition-colors shadow-sm flex items-center gap-2"
                >
                  <PlusSquare className="w-4 h-4" />
                  Create Playlist
                </button>
              </div>

              {playlists.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {playlists.map((playlist) => (
                    <motion.div 
                      key={playlist.id}
                      whileHover={{ y: -8, scale: 1.02 }}
                      className="bg-[#2B2930] p-5 rounded-[2rem] hover:bg-[#36343B] transition-all duration-300 group cursor-pointer border border-white/5 shadow-md"
                      onClick={() => openUserPlaylist(playlist)}
                    >
                      <div className="relative mb-5 aspect-square rounded-2xl overflow-hidden bg-[#4A4458] flex items-center justify-center shadow-inner">
                        {playlist.image ? (
                          <img src={playlist.image} alt={playlist.name} className="w-full h-full object-cover" />
                        ) : (
                          <ListMusic className="w-12 h-12 text-[#CAC4D0] opacity-50" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <Play className="w-12 h-12 text-[#D0BCFF] fill-current" />
                        </div>
                      </div>
                      <h4 className="font-bold text-lg text-[#E6E0E9] truncate mb-1">{playlist.name}</h4>
                      <p className="text-sm text-[#CAC4D0] font-medium">{playlist.tracks.length} tracks</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-6">
                  <div className="w-24 h-24 bg-[#2B2930] rounded-[2rem] flex items-center justify-center shadow-inner">
                    <Library className="w-12 h-12 text-[#D0BCFF]" />
                  </div>
                  <h2 className="text-4xl font-extrabold tracking-tight text-[#E8DEF8]">Your library is empty</h2>
                  <p className="text-[#CAC4D0] max-w-md text-lg">Create a playlist or follow artists to keep track of what you love.</p>
                  <button 
                    onClick={() => setActiveTab('search')}
                    className="bg-[#D0BCFF] text-[#381E72] px-8 py-4 rounded-full font-bold text-lg hover:bg-[#E8DEF8] hover:scale-105 transition-all shadow-md"
                  >
                    Find something to listen to
                  </button>
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {/* Queue Sidebar */}
      <AnimatePresence>
        {isQueueOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-80 glass border-l border-white/10 z-30 p-6 pt-8 overflow-y-auto shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold tracking-tight text-[#E8DEF8]">Queue</h3>
              <button onClick={() => setIsQueueOpen(false)} className="w-10 h-10 bg-[#2B2930] rounded-full flex items-center justify-center text-[#CAC4D0] hover:text-[#E6E0E9] hover:bg-[#36343B] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <h4 className="text-sm font-bold text-[#CAC4D0] uppercase tracking-wider mb-4">Now Playing</h4>
              {currentTrack ? (
                <div className="flex items-center space-x-3 bg-[#D0BCFF]/10 p-3 rounded-2xl border border-[#D0BCFF]/20">
                  <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold text-[#D0BCFF] truncate">{currentTrack.title}</p>
                    <p className="text-xs text-[#E8DEF8] truncate">{currentTrack.artist}</p>
                  </div>
                  <Visualizer isPlaying={isPlaying} count={4} className="h-6" />
                </div>
              ) : (
                <p className="text-[#CAC4D0] text-sm">Nothing is playing.</p>
              )}
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#CAC4D0] uppercase tracking-wider mb-4">Next Up</h4>
              {queue.length === 0 ? (
                <div className="bg-[#2B2930] p-6 rounded-3xl text-center space-y-4 border border-white/5">
                  <p className="text-[#CAC4D0] text-sm">Your queue is empty.</p>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGenerateQueue}
                    className="bg-[#D0BCFF] text-[#381E72] px-6 py-2.5 rounded-full font-bold text-sm hover:bg-[#E8DEF8] transition-colors shadow-sm w-full flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Auto-Generate
                  </motion.button>
                </div>
              ) : (
                <Reorder.Group axis="y" values={queue} onReorder={setQueue} className="space-y-3">
                  {queue.map((track) => (
                    <Reorder.Item 
                      key={track.queueId} 
                      value={track} 
                      className="flex items-center space-x-3 bg-[#2B2930] p-3 rounded-2xl cursor-grab active:cursor-grabbing group hover:bg-[#36343B] transition-colors border border-white/5"
                    >
                      <GripVertical className="w-5 h-5 text-[#4A4458] group-hover:text-[#CAC4D0] transition-colors shrink-0" />
                      <img src={track.thumbnail} alt={track.title} className="w-10 h-10 rounded-xl object-cover shadow-sm shrink-0" />
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-[#E6E0E9] truncate">{track.title}</p>
                        <p className="text-xs text-[#CAC4D0] truncate">{track.artist}</p>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setTrackToAdd(track);
                            setIsAddToPlaylistModalOpen(true);
                          }} 
                          className="w-8 h-8 flex items-center justify-center rounded-full text-[#4A4458] hover:text-[#D0BCFF] hover:bg-[#D0BCFF]/10 transition-colors"
                        >
                          <PlusSquare className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => removeFromQueue(e, track.queueId)} 
                          className="w-8 h-8 flex items-center justify-center rounded-full text-[#4A4458] hover:text-[#FFB4AB] hover:bg-[#FFB4AB]/10 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Integrated Contextual Dock */}
      <motion.footer
        layout
        className="fixed bottom-6 left-6 right-6 z-50 h-20 glass-dark rounded-[2.5rem] border border-white/10 shadow-2xl flex items-center px-6 gap-6"
      >
        {/* Navigation */}
        <nav className="flex items-center gap-2">
          <button onClick={() => setActiveTab('home')} className={cn("p-3 rounded-full transition-colors", activeTab === 'home' ? "bg-[#D0BCFF] text-[#381E72]" : "text-[#CAC4D0] hover:bg-white/5")}>
            <Home className="w-5 h-5" />
          </button>
          <button onClick={() => setActiveTab('search')} className={cn("p-3 rounded-full transition-colors", activeTab === 'search' ? "bg-[#D0BCFF] text-[#381E72]" : "text-[#CAC4D0] hover:bg-white/5")}>
            <Search className="w-5 h-5" />
          </button>
          <button onClick={() => setActiveTab('library')} className={cn("p-3 rounded-full transition-colors", activeTab === 'library' ? "bg-[#D0BCFF] text-[#381E72]" : "text-[#CAC4D0] hover:bg-white/5")}>
            <Library className="w-5 h-5" />
          </button>
        </nav>

        {/* Player Controls */}
        <div className="flex-1 flex items-center gap-4 min-w-0" onClick={() => currentTrack && setIsFullScreenPlayerOpen(true)}>
          {currentTrack && (
            <>
              <img src={currentTrack.thumbnail} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" referrerPolicy="no-referrer" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#E6E0E9] truncate">{currentTrack.title}</p>
                <p className="text-[10px] text-[#CAC4D0] truncate uppercase tracking-wider">{currentTrack.artist}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); playPrevious(); }} className="text-[#CAC4D0] hover:text-[#E6E0E9]"><SkipBack className="w-5 h-5" /></button>
                <button onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }} className="w-10 h-10 bg-[#D0BCFF] rounded-full flex items-center justify-center text-[#381E72]">
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); playNext(); }} className="text-[#CAC4D0] hover:text-[#E6E0E9]"><SkipForward className="w-5 h-5" /></button>
              </div>
            </>
          )}
        </div>

        {/* Contextual Actions */}
        <div className="flex items-center gap-2">
          {activeTab !== 'home' && (
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#D0BCFF]/10 text-[#D0BCFF] hover:bg-[#D0BCFF]/20 text-xs font-bold uppercase">
              {activeTab === 'search' ? <><Filter className="w-4 h-4" /> Filter</> : <><Plus className="w-4 h-4" /> Playlist</>}
            </button>
          )}
          <button onClick={() => setIsQueueOpen(!isQueueOpen)} className={cn("p-3 rounded-full transition-colors", isQueueOpen ? "bg-[#D0BCFF] text-[#381E72]" : "text-[#CAC4D0] hover:bg-white/5")}>
            <ListMusic className="w-5 h-5" />
          </button>
        </div>
      </motion.footer>

      {/* Mobile Player Bar - Removed in favor of integrated Bento Dock controls */}

      {/* Visible YouTube Player Container (M3 Expressive) */}
      <div className={cn(
        "fixed z-50 transition-all duration-500 flex flex-col overflow-hidden shadow-2xl",
        isFullScreenPlayerOpen 
          ? "inset-0 w-full h-full bg-[#141218] rounded-none" 
          : cn("bottom-32 w-80 aspect-video bg-[#141218] rounded-[2rem] border border-white/10", isQueueOpen ? "right-[22rem]" : "right-8"),
        !currentTrack && !isFullScreenPlayerOpen ? "translate-y-12 opacity-0 scale-95 pointer-events-none" : "translate-y-0 opacity-100 scale-100"
      )}>
        {/* Immersive Background for Full Screen */}
        {isFullScreenPlayerOpen && (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-[80vw] h-[80vw] bg-[#381E72] rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[60vw] h-[60vw] bg-[#D0BCFF] rounded-full mix-blend-screen filter blur-[120px] opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
        )}
        {/* Header for Mini Player */}
        {!isFullScreenPlayerOpen && (
          <div 
            className="bg-[#2B2930] text-xs px-4 py-3 flex justify-between items-center border-b border-white/5 text-[#CAC4D0] shrink-0 cursor-pointer hover:bg-[#36343B] transition-colors"
            onClick={() => setIsFullScreenPlayerOpen(true)}
          >
            <span className="font-bold text-[#E6E0E9] flex items-center gap-2">
              <Play className="w-3.5 h-3.5 fill-current text-[#D0BCFF]" />
              Now Playing
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-[#4A4458] px-2 py-1 rounded-md text-[#E8DEF8] font-medium hidden sm:block">Click video if no sound</span>
              <Maximize2 className="w-4 h-4 text-[#CAC4D0]" />
            </div>
          </div>
        )}

        {/* Header for Full Screen Player */}
        {isFullScreenPlayerOpen && (
          <div className="flex items-center justify-between px-8 py-6 shrink-0 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-[#141218] to-transparent">
            <button 
              onClick={() => setIsFullScreenPlayerOpen(false)}
              className="w-12 h-12 bg-[#2B2930]/80 backdrop-blur-md rounded-full flex items-center justify-center text-[#E6E0E9] hover:bg-[#36343B] transition-colors shadow-sm"
            >
              <ChevronDown className="w-8 h-8" />
            </button>
            <span className="text-sm font-bold tracking-widest uppercase text-[#CAC4D0]">Now Playing</span>
            <button className="w-12 h-12 flex items-center justify-center text-[#E6E0E9] hover:bg-[#2B2930]/80 rounded-full transition-colors">
              <MoreHorizontal className="w-8 h-8" />
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className={cn(
          "flex-1 w-full relative flex",
          isFullScreenPlayerOpen ? "flex-col lg:flex-row items-center justify-center p-8 lg:p-24 gap-12" : "bg-black"
        )}>
          
          {/* YouTube Iframe Container */}
          <div className={cn(
            "relative shrink-0 transition-all duration-500",
            isFullScreenPlayerOpen 
              ? (isLyricsOpen 
                  ? "absolute top-8 left-8 w-32 aspect-video rounded-2xl overflow-hidden shadow-2xl opacity-50 hover:opacity-100 z-20" 
                  : "w-full max-w-2xl aspect-video rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-white/10")
              : "absolute inset-0 w-full h-full"
          )}>
            {currentTrack && (
              <YouTube 
                key={currentTrack.youtubeId}
                videoId={currentTrack.youtubeId}
                opts={{
                  height: '100%',
                  width: '100%',
                  playerVars: {
                    autoplay: 1,
                    controls: 1,
                    origin: window.location.origin,
                    modestbranding: 1,
                    rel: 0,
                    enablejsapi: 1,
                    iv_load_policy: 3,
                  },
                }}
                className="absolute inset-0 w-full h-full"
                iframeClassName="w-full h-full"
                onReady={onPlayerReady}
                onStateChange={onStateChange}
                onError={onPlayerError}
              />
            )}
          </div>

          {/* Lyrics Container */}
          {isFullScreenPlayerOpen && isLyricsOpen && (
            <div className="w-full max-w-2xl h-[50vh] lg:h-[70vh] overflow-y-auto no-scrollbar pb-32 pt-8 z-10" style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)' }}>
              {isLoadingLyrics ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-4 border-[#D0BCFF] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : lyrics ? (
                <p className="text-3xl lg:text-5xl font-bold leading-tight text-[#E6E0E9] whitespace-pre-wrap text-center font-serif tracking-tight">
                  {lyrics}
                </p>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-[#CAC4D0] space-y-4">
                  <Mic2 className="w-16 h-16 opacity-50" />
                  <p className="text-xl font-medium">Looks like we don't have the lyrics for this song.</p>
                </div>
              )}
            </div>
          )}

          {/* Full Screen Controls & Info */}
          {isFullScreenPlayerOpen && currentTrack && (
            <div className="flex flex-col w-full max-w-xl space-y-8 z-10">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <h1 className="text-4xl lg:text-6xl font-extrabold text-[#E6E0E9] tracking-tight mb-2 line-clamp-2">{currentTrack.title}</h1>
                  <h2 className="text-xl lg:text-2xl text-[#CAC4D0]">{currentTrack.artist}</h2>
                </div>
                <div className="flex items-center space-x-4 shrink-0 ml-4">
                  <button 
                    onClick={() => {
                      setTrackToAdd(currentTrack);
                      setIsAddToPlaylistModalOpen(true);
                    }}
                    className="text-[#CAC4D0] hover:text-[#D0BCFF] transition-colors"
                  >
                    <PlusSquare className="w-10 h-10" />
                  </button>
                  <button className="text-[#CAC4D0] hover:text-[#FFD8E4] transition-colors">
                    <Heart className="w-10 h-10" />
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-3">
                <input 
                  type="range" 
                  min="0" 
                  max={duration || 0} 
                  value={progress}
                  onChange={handleSeek}
                  className="w-full h-2 bg-[#4A4458] rounded-full appearance-none cursor-pointer accent-[#D0BCFF] hover:accent-[#E8DEF8] transition-all"
                />
                <div className="flex justify-between text-sm font-medium text-[#CAC4D0]">
                  <span>{formatTime(progress)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <PlayerControls 
                isPlaying={isPlaying}
                onTogglePlay={togglePlay}
                onNext={playNext}
                onPrevious={playPrevious}
                isShuffle={isShuffle}
                onToggleShuffle={toggleShuffle}
                repeatMode={repeatMode}
                onToggleRepeat={toggleRepeat}
                size="lg"
                className="space-x-12"
              />

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-8 border-t border-white/10">
                <div className="flex items-center space-x-4">
                  <Volume2 className="w-6 h-6 text-[#CAC4D0]" />
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-1.5 bg-[#4A4458] rounded-full appearance-none cursor-pointer accent-[#D0BCFF] hover:accent-[#E8DEF8] transition-all"
                  />
                </div>
                <div className="flex items-center space-x-6">
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsLyricsOpen(!isLyricsOpen)}
                    className={cn("transition-colors flex items-center gap-2", isLyricsOpen ? "text-[#D0BCFF]" : "text-[#CAC4D0] hover:text-[#E6E0E9]")}
                  >
                    <Mic2 className="w-6 h-6" />
                    <span className="text-sm font-bold uppercase tracking-wider hidden sm:block">Lyrics</span>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsAutoplayEnabled(!isAutoplayEnabled)}
                    className={cn("transition-colors flex items-center gap-2", isAutoplayEnabled ? "text-[#D0BCFF]" : "text-[#CAC4D0] hover:text-[#E6E0E9]")}
                  >
                    <Radio className="w-6 h-6" />
                    <span className="text-sm font-bold uppercase tracking-wider hidden sm:block">Autoplay</span>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsQueueOpen(!isQueueOpen)}
                    className={cn("transition-colors flex items-center gap-2", isQueueOpen ? "text-[#D0BCFF]" : "text-[#CAC4D0] hover:text-[#E6E0E9]")}
                  >
                    <ListMusic className="w-6 h-6" />
                    <span className="text-sm font-bold uppercase tracking-wider hidden sm:block">Queue</span>
                  </motion.button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
