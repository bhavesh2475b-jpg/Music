import { Track } from '../types';

export async function searchYouTube(query: string): Promise<Track[]> {
  try {
    const response = await fetch(
      `/api/youtube/search?part=snippet&maxResults=10&q=${encodeURIComponent(
        query + ' music'
      )}&type=video`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube Proxy Error:', errorData);
      return [];
    }

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
  try {
    const response = await fetch(
      `/api/youtube/search?part=snippet&maxResults=5&q=${encodeURIComponent(
        query
      )}&type=playlist`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube Proxy Error (Playlists):', errorData);
      return [];
    }

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
  try {
    const response = await fetch(
      `/api/youtube/playlistItems?part=snippet&maxResults=20&playlistId=${playlistId}`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube Proxy Error (Playlist Items):', errorData);
      return [];
    }

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
  try {
    const response = await fetch(
      `/api/youtube/videos?part=snippet&chart=mostPopular&maxResults=10&videoCategoryId=10`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube Proxy Error (Trending):', errorData);
      return [];
    }

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
