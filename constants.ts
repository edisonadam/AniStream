import type { Anime, Slide } from './types';

export const FEATURED_SLIDES: Slide[] = [
  {
    id: 1,
    title: 'Cybernetic Echoes',
    subtitle: 'New Episode Available',
    image: 'https://picsum.photos/seed/slide1/1920/1080',
  },
  {
    id: 2,
    title: 'Galactic Drifters',
    subtitle: 'Season 2 Finale',
    image: 'https://picsum.photos/seed/slide2/1920/1080',
  },
  {
    id: 3,
    title: 'Chronicles of Valoria',
    subtitle: 'Now Streaming',
    image: 'https://picsum.photos/seed/slide3/1920/1080',
  },
];

export const ANIME_DATA: Anime[] = [
  { id: 1, title: 'Void Scrambler', thumbnail: 'https://picsum.photos/seed/anime1/300/450', bannerImage: 'https://picsum.photos/seed/banner1/1920/1080', tag: 'Sub', tmdbId: 2577, synopsis: 'In a futuristic city, a young hacker discovers a conspiracy that threatens the fabric of reality itself, forcing him to become a digital ghost.', genres: ['Sci-Fi', 'Cyberpunk', 'Action'], releaseYear: 2024, status: 'Ongoing', totalEpisodes: 24, rating: 8.5, type: 'TV', studio: 'Studio Ignite', seasons: [{ season: 1, episodes: 12 }, { season: 2, episodes: 12 }] },
  { id: 2, title: 'Iron-Blooded Orphans', thumbnail: 'https://picsum.photos/seed/anime2/300/450', bannerImage: 'https://picsum.photos/seed/banner2/1920/1080', tag: 'Dub', tmdbId: 63868, synopsis: 'A group of child soldiers on Mars rebel against their adult masters and form their own security company, fighting for their freedom.', genres: ['Mecha', 'Action', 'Drama'], releaseYear: 2015, status: 'Completed', totalEpisodes: 50, rating: 8.3, type: 'TV', studio: 'Sunrise', seasons: [{ season: 1, episodes: 25 }, { season: 2, episodes: 25 }] },
  { id: 3, title: 'Astra Lost in Space', thumbnail: 'https://picsum.photos/seed/anime3/300/450', bannerImage: 'https://picsum.photos/seed/banner3/1920/1080', tag: 'Sub', tmdbId: 87439, synopsis: 'In the year 2063, a group of high school students are mysteriously transported thousands of light-years away from home, and must work together to survive.', genres: ['Adventure', 'Sci-Fi', 'Mystery'], releaseYear: 2019, status: 'Completed', totalEpisodes: 12, rating: 8.1, type: 'TV', studio: 'Lerche', seasons: [{ season: 1, episodes: 12 }] },
  { id: 4, title: 'The God of High School', thumbnail: 'https://picsum.photos/seed/anime4/300/450', bannerImage: 'https://picsum.photos/seed/banner4/1920/1080', tag: 'Dub', tmdbId: 95200, synopsis: 'A high school student and his friends compete in an epic tournament, borrowing power directly from the gods and uncovering a mysterious organization.', genres: ['Action', 'Fantasy', 'Martial Arts'], releaseYear: 2020, status: 'Completed', totalEpisodes: 13, rating: 7.4, type: 'TV', studio: 'MAPPA', seasons: [{ season: 1, episodes: 13 }] },
  { id: 5, title: 'Re:ZERO', thumbnail: 'https://picsum.photos/seed/anime5/300/450', bannerImage: 'https://picsum.photos/seed/banner5/1920/1080', tag: 'Sub', tmdbId: 65931, synopsis: 'A hikikomori is suddenly transported to another world. He discovers he has the ability to reverse time by dying, and uses it to save his friends.', genres: ['Isekai', 'Fantasy', 'Thriller'], releaseYear: 2016, status: 'Ongoing', totalEpisodes: 50, rating: 8.4, type: 'TV', studio: 'White Fox', seasons: [{ season: 1, episodes: 25 }, { season: 2, episodes: 25 }] },
  { id: 6, title: 'Neon Genesis Evangelion', thumbnail: 'https://picsum.photos/seed/anime6/300/450', bannerImage: 'https://picsum.photos/seed/banner6/1920/1080', tag: 'Dub', tmdbId: 1535, synopsis: 'A teenage boy finds himself recruited as a pilot of a giant bio-machine called an "Evangelion" to fight against monstrous beings known as "Angels".', genres: ['Mecha', 'Psychological', 'Sci-Fi'], releaseYear: 1995, status: 'Completed', totalEpisodes: 26, rating: 8.6, type: 'TV', studio: 'Gainax', seasons: [{ season: 1, episodes: 26 }] },
  { id: 7, title: 'Attack on Titan', thumbnail: 'https://picsum.photos/seed/anime7/300/450', bannerImage: 'https://picsum.photos/seed/banner7/1920/1080', tag: 'Sub', tmdbId: 1429, synopsis: 'In a world where humanity is on the brink of extinction by giant humanoid "Titans", a young boy vows to exterminate them all after they destroy his hometown.', genres: ['Action', 'Dark Fantasy', 'Post-Apocalyptic'], releaseYear: 2013, status: 'Completed', totalEpisodes: 88, rating: 9.0, type: 'TV', studio: 'Wit Studio & MAPPA', seasons: [{ season: 1, episodes: 25 }, { season: 2, episodes: 12 }, { season: 3, episodes: 22 }, { season: 4, episodes: 29 }] },
  { id: 8, title: 'Jujutsu Kaisen', thumbnail: 'https://picsum.photos/seed/anime8/300/450', bannerImage: 'https://picsum.photos/seed/banner8/1920/1080', tag: 'Dub', tmdbId: 95479, synopsis: 'A boy swallows a cursed talisman and becomes the host of a powerful Curse. He joins a secret society of Sorcerers to find the other parts of the talisman.', genres: ['Supernatural', 'Action', 'Horror'], releaseYear: 2020, status: 'Ongoing', totalEpisodes: 47, rating: 8.7, type: 'TV', studio: 'MAPPA', seasons: [{ season: 1, episodes: 24 }, { season: 2, episodes: 23 }] },
  { id: 9, title: 'Demon Slayer', thumbnail: 'https://picsum.photos/seed/anime9/300/450', bannerImage: 'https://picsum.photos/seed/banner9/1920/1080', tag: 'Sub', tmdbId: 85937, synopsis: 'A young boy becomes a demon slayer to find a cure for his sister, who has been turned into a demon, and to avenge his family.', genres: ['Action', 'Fantasy', 'Historical'], releaseYear: 2019, status: 'Ongoing', totalEpisodes: 55, rating: 8.8, type: 'TV', studio: 'Ufotable', seasons: [{ season: 1, episodes: 26 }, { season: 2, episodes: 18 }, { season: 3, episodes: 11 }] },
  { id: 10, title: 'Code Geass', thumbnail: 'https://picsum.photos/seed/anime10/300/450', bannerImage: 'https://picsum.photos/seed/banner10/1920/1080', tag: 'Dub', tmdbId: 205, synopsis: 'An exiled prince gains a powerful ability called Geass and leads a rebellion against the Holy Britannian Empire.', genres: ['Mecha', 'Military', 'Super Power'], releaseYear: 2006, status: 'Completed', totalEpisodes: 50, rating: 8.7, type: 'TV', studio: 'Sunrise', seasons: [{ season: 1, episodes: 25 }, { season: 2, episodes: 25 }] },
  { id: 11, title: 'Steins;Gate', thumbnail: 'https://picsum.photos/seed/anime11/300/450', bannerImage: 'https://picsum.photos/seed/banner11/1920/1080', tag: 'Sub', tmdbId: 31138, synopsis: 'A group of friends discover a way to send messages to the past, leading to unforeseen consequences and a desperate struggle against a shadowy organization.', genres: ['Sci-Fi', 'Thriller', 'Time Travel'], releaseYear: 2011, status: 'Completed', totalEpisodes: 24, rating: 9.1, type: 'TV', studio: 'White Fox', seasons: [{ season: 1, episodes: 24 }] },
  { id: 12, title: 'Cowboy Bebop', thumbnail: 'https://picsum.photos/seed/anime12/300/450', bannerImage: 'https://picsum.photos/seed/banner12/1920/1080', tag: 'Dub', tmdbId: 30, synopsis: 'A crew of bounty hunters travel the solar system in search of their next score, all while confronting their pasts.', genres: ['Space Western', 'Action', 'Noir'], releaseYear: 1998, status: 'Completed', totalEpisodes: 26, rating: 8.9, type: 'TV', studio: 'Sunrise', seasons: [{ season: 1, episodes: 26 }] },
];

export const GENRES = ['Action', 'Romance', 'Comedy', 'Fantasy', 'Sci-Fi', 'Horror', 'Slice of Life', 'Adventure'];
export const POPULAR_TITLES = ['Void Scrambler', 'Galactic Drifters', 'Chronicles of Valoria'];
export const RECENTLY_ADDED = ['Neon Genesis Evangelion', 'Astra Lost in Space'];
