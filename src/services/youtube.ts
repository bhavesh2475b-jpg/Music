import { Track } from '../types';

const YOUTUBE_API_KEY = (import.meta as any).env.VITE_YOUTUBE_API_KEY || (process as any).env.YOUTUBE_API_KEY || '';

export async function searchYouTube(query: string): Promise<Track[]> {
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API Key is missing. Search will not work.');
    return [];
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(
        query + ' music'
      )}&type=video&key=${YOUTUBE_API_KEY}`
    );
    const data = await response.json();

    if (data.error) {
      console.error('YouTube API Error:', data.error);
      return [];
    }

    return data.items.map((item: any) => ({
      id: item.id.videoId,
      youtubeId: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
    }));
  } catch (error) {
    console.error('Failed to search YouTube:', error);
    return [];
  }
}

export async function searchPlaylists(query: string): Promise<any[]> {
  if (!YOUTUBE_API_KEY) return [];

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(
        query
      )}&type=playlist&key=${YOUTUBE_API_KEY}`
    );
    const data = await response.json();

    if (data.error) {
      console.error('YouTube API Error (Playlists):', data.error);
      return [];
    }

    return data.items.map((item: any) => ({
      id: item.id.playlistId,
      name: item.snippet.title,
      image: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle
    }));
  } catch (error) {
    console.error('Failed to search playlists:', error);
    return [];
  }
}

export async function getPlaylistItems(playlistId: string): Promise<Track[]> {
  if (!YOUTUBE_API_KEY) return [];

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=20&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}`
    );
    const data = await response.json();

    if (data.error) {
      console.error('YouTube API Error (Playlist Items):', data.error);
      return [];
    }

    return data.items
      .filter((item: any) => item.snippet.resourceId.videoId)
      .map((item: any) => ({
        id: item.snippet.resourceId.videoId,
        youtubeId: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        artist: item.snippet.videoOwnerChannelTitle || 'Unknown Artist',
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
      }));
  } catch (error) {
    console.error('Failed to fetch playlist items:', error);
    return [];
  }
}

export async function getTrendingMusic(): Promise<Track[]> {
  if (!YOUTUBE_API_KEY) return [];

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=10&videoCategoryId=10&key=${YOUTUBE_API_KEY}`
    );
    const data = await response.json();

    if (data.error) {
      console.error('YouTube API Error (Trending):', data.error);
      return [];
    }

    return data.items.map((item: any) => ({
      id: item.id,
      youtubeId: item.id,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
    }));
  } catch (error) {
    console.error('Failed to fetch trending music:', error);
    return [];
  }
}
