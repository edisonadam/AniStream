export interface Anime {
  id: number;
  title: string;
  thumbnail: string;
  tag: 'Sub' | 'Dub';
  tmdbId: number;
  synopsis: string;
  genres: string[];
  releaseYear: number;
  status: 'Ongoing' | 'Completed';
  totalEpisodes: number; // This can be the total across all seasons
  rating: number;
  type: 'TV' | 'Movie';
  studio: string;
  bannerImage: string;
  seasons: {
    season: number;
    episodes: number;
  }[];
}

export interface Slide {
  id: number;
  title: string;
  subtitle: string;
  image: string;
}
