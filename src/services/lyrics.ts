export async function fetchLyrics(artist: string, title: string): Promise<string | null> {
  try {
    // Clean title (remove "Official Video", "Lyric Video", etc.)
    const cleanTitle = title.replace(/(\(.*?\)|\[.*?\])/g, '').trim();
    const cleanArtist = artist.replace(/ - Topic$/, '').trim();
    
    const response = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.lyrics || null;
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    return null;
  }
}
