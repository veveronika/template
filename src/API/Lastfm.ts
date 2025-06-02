export const API_KEY  = '4482ed54ab8d2bb16afbd5985943630a';
export const API_BASE = 'https://ws.audioscrobbler.com/2.0/';

type Params = Record<string,string|number>;
/**
 * Выполняет HTTP-запрос к Last.fm API и возвращает распарсенный JSON
 * @template T Тип возвращаемых данных
 * @param {string} method - Имя метода API
 * @param {Params} [params={}] - Параметры запроса в виде ключ-значение
 * @returns {Promise<T>} Промис с результатом запроса
 * @throws {Error} При сетевой ошибке или ответе с кодом не 2xx
 */
async function fetchFromApi<T>(method: string, params: Params = {}): Promise<T> {
  const url = new URL(API_BASE);
  url.searchParams.set('method', method);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('format', 'json');
  Object.entries(params).forEach(([k,v]) => v != null && url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export interface Image    { size: string; '#text': string }
export interface Tag      { url: string; name: string }
export interface Artist   { name: string; mbid: string; url: string; listeners?: string; image: Image[] }
export interface Album    { name: string; mbid?: string; url: string; artist: string; image: Image[] }
export interface Track    { name: string; mbid?: string; url: string; artist: any; image: Image[] }
export interface TrackInfo{ duration: string; artistUrl: string; imageUrl: string }
/**
 * Получает топ-артистов
 * @param {number} [limit=12] - Максимальное число артистов
 * @returns {Promise<Artist[]>} Массив объектов Artist
 */
export function getHotArtists(limit = 12): Promise<Artist[]> {
  return fetchFromApi<{ artists: { artist: Artist[] } }>(
    'chart.gettopartists',
    { limit }
  ).then(d => d.artists.artist || []);
}

/**
 * Получает топ-треков
 * @param {number} [limit=18] - Максимальное число треков
 * @returns {Promise<Track[]>} Массив объектов Track
 */
export function getHotTracks(limit = 18): Promise<Track[]> {
  return fetchFromApi<{ tracks: { track: Track[] } }>(
    'chart.gettoptracks',
    { limit }
  ).then(d => d.tracks.track || []);
}

/**
 * Получает теги для артиста
 * @param {string} artist - Имя артиста
 * @param {number} [limit=3] - Максимальное число тегов
 * @returns {Promise<Tag[]>} Массив объектов Tag
 */
export function getArtistTags(artist: string, limit = 3): Promise<Tag[]> {
  return fetchFromApi<{ toptags: { tag: Tag[] } }>(
    'artist.gettoptags',
    { artist }
  )
    .then(d => (d.toptags.tag || []).filter(t => t.url).slice(0, limit))
    .catch(() => []);
}

/**
 * Получает теги для трека
 * @param {string} artist - Имя артиста
 * @param {string} track - Название трека
 * @param {number} [limit=3] - Максимальное число тегов
 * @returns {Promise<Tag[]>} Массив объектов Tag
 */
export function getTrackTags(artist: string, track: string, limit = 3): Promise<Tag[]> {
  return fetchFromApi<{ toptags: { tag: Tag[] } }>(
    'track.gettoptags',
    { artist, track }
  )
    .then(d => (d.toptags.tag || []).filter(t => t.url).slice(0, limit))
    .catch(() => []);
}

/**
 * Ищет артистов по запросу
 * @param {string} query - Строка поиска
 * @param {number} [limit=8] - Максимальное число результатов
 * @returns {Promise<Artist[]>} Массив объектов Artist
 */
export function searchArtists(query: string, limit = 8): Promise<Artist[]> {
  return fetchFromApi<{ results: { artistmatches: { artist: Artist[] } } }>(
    'artist.search',
    { artist: query, limit }
  ).then(d => d.results.artistmatches.artist || []);
}

/**
 * Ищет альбомы по запросу
 * @param {string} query - Строка поиска
 * @param {number} [limit=8] - Максимальное число результатов
 * @returns {Promise<Album[]>} Массив объектов Album
 */
export function searchAlbums(query: string, limit = 8): Promise<Album[]> {
  return fetchFromApi<{ results: { albummatches: { album: Album[] } } }>(
    'album.search',
    { album: query, limit }
  ).then(d => d.results.albummatches.album || []);
}

/**
 * Ищет треки по запросу
 * @param {string} query - Строка поиска
 * @param {number} [limit=10] - Максимальное число результатов
 * @returns {Promise<Track[]>} Массив объектов Track
 */
export function searchTracks(query: string, limit = 10): Promise<Track[]> {
  return fetchFromApi<{ results: { trackmatches: { track: Track[] } } }>(
    'track.search',
    { track: query, limit }
  ).then(d => d.results.trackmatches.track || []);
}

/**
 * Получает дополнительную информацию по треку: длительность, URL артиста и изображение
 * @param {string} artist - Имя артиста
 * @param {string} track - Название трека
 * @param {string} fallbackImage - URL изображения по умолчанию
 * @returns {Promise<TrackInfo>} Объект TrackInfo с данными
 */
export async function getTrackInfo(
  artist: string,
  track: string,
  fallbackImage: string
): Promise<TrackInfo> {
  try {
    const { track: info = {} as any } = await fetchFromApi<{ track: any }>(
      'track.getInfo',
      { artist, track }
    );
    const ms = parseInt(info.duration, 10);
    const duration = isNaN(ms)
      ? ''
      : `${Math.floor(ms/60000)}:${('0'+Math.floor((ms/1000)%60)).slice(-2)}`;
    const artistUrl = info.artist?.url || '#';
    const imageUrl =
      info.album?.image?.find((i: Image)=>i.size==='medium')?.['#text'] ||
      info.album?.image?.[0]?.['#text'] ||
      fallbackImage;
    return { duration, artistUrl, imageUrl };
  } catch {
    return { duration: '', artistUrl: '#', imageUrl: fallbackImage };
  }
}
