export interface Track {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration?: string;
  youtubeId: string;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  image: string;
}
