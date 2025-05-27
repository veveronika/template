const API_KEY = '4482ed54ab8d2bb16afbd5985943630a';
const API_BASE = 'https://ws.audioscrobbler.com/2.0/';
/**
 * Выполняет запрос к Last.fm API
 * @param {string} method - имя метода API
 * @param {Record<string, string|number>} [params={}] - дополнительные параметры запроса
 * @returns {Promise<any>} - разобранный JSON-ответ
 * @throws {Error} - в случае ошибки HTTP
 */
async function fetchFromApi(method, params = {}) {
  const url = new URL(API_BASE);
  Object.entries({ method, api_key: API_KEY, format: 'json', ...params })
    .forEach(([k, v]) => v != null && url.searchParams.set(k, String(v)));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Получает список популярных артистов
 * @param {number} [limit=12] - максимальное количество результатов
 * @returns {Promise<Artist[]>} - массив артистов
 */
async function getHotArtists(limit = 12) {
  const data = await fetchFromApi('chart.gettopartists', { limit });
  return data.artists?.artist || [];
}

/**
 * Получает список популярных треков
 * @param {number} [limit=18] - максимальное количество треков
 * @returns {Promise<Track[]>} - массив треков
 */
async function getPopularTracks(limit = 18) {
  const data = await fetchFromApi('chart.gettoptracks', { limit });
  return data.tracks?.track || [];
}

/**
 * Возвращает теги, связанные с артистом
 * @param {string} artist - имя артиста
 * @param {number} [limit=3] - количество тегов
 * @returns {Promise<Tag[]>} - список тегов
 */
async function getArtistTags(artist, limit = 3) {
  try {
    const { toptags } = await fetchFromApi('artist.gettoptags', { artist });
    return (toptags?.tag || []).filter(t => t.url).slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Возвращает теги, связанные с треком
 * @param {string} artist - имя исполнителя
 * @param {string} track - название трека
 * @param {number} [limit=3] - количество тегов
 * @returns {Promise<Tag[]>} - список тегов
 */
async function getTrackTags(artist, track, limit = 3) {
  try {
    const { toptags } = await fetchFromApi('track.gettoptags', { artist, track });
    return (toptags?.tag || []).filter(t => t.url).slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Отображает секцию «Hot Right Now»
 * @param {Artist[]} artists - список артистов
 */
async function renderHotRightNow(artists) {
  const grid = document.querySelector('.hot-right-now__grid');
  grid.innerHTML = '';

  for (const artist of artists) {
    const item = document.createElement('div');
    item.className = 'hot-right-now__item';

    const link = document.createElement('a');
    link.className = 'hot-right-now__media';
    link.href = artist.url || '#';

    const img = document.createElement('img');
    img.className = 'hot-right-now__thumb';
    img.loading = 'eager';
    img.width = 120;
    img.height = 120;
    img.src = artist.image?.[2]?.['#text'] || '';
    img.alt = artist.name;

    const name = document.createElement('p');
    name.className = 'hot-right-now__name';
    name.textContent = artist.name;

    link.append(img, name);
    item.append(link);
    grid.append(item);

    getArtistTags(artist.name).then(tags => {
      if (!tags.length) return;
      const container = document.createElement('p');
      container.className = 'hot-right-now__tags';
      tags.forEach(t => {
        const a = document.createElement('a');
        a.className = 'hot-right-now__tag';
        a.href = t.url;
        a.textContent = t.name;
        container.append(a);
      });
      item.append(container);
    });
  }
}

/**
 * Отображает блоки популярных треков
 * @param {Track[]} tracks - список треков
 */
async function renderPopularTracks(tracks) {
  const container = document.querySelector('.popular-tracks__columns');
  container.innerHTML = '';
  const cols = Array.from({ length: 3 }, () => {
    const col = document.createElement('div');
    col.className = 'popular-tracks__col';
    container.append(col);
    return col;
  });

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    const col = cols[i % 3];

    const item = document.createElement('div');
    item.className = 'popular-tracks__item';

    const link = document.createElement('a');
    link.className = 'popular-tracks__media';
    link.href = track.url || '#';

    const img = document.createElement('img');
    img.className = 'popular-tracks__thumb';
    img.loading = 'lazy';
    img.src = track.image?.[2]?.['#text'] || '';
    img.alt = track.name;
    link.append(img);
    item.append(link);

    const info = document.createElement('div');
    info.className = 'popular-tracks__info';

    const title = document.createElement('a');
    title.className = 'popular-tracks__track';
    title.textContent = track.name;
    title.href = track.url || '#';

    const artistP = document.createElement('a');
    artistP.className = 'popular-tracks__artist';
    artistP.textContent = track.artist?.name || '';
    artistP.href = track.artist?.url || '#';

    info.append(title, artistP);
    item.append(info);
    col.append(item);

    getTrackTags(track.artist?.name, track.name).then(tags => {
      if (!tags.length) return;
      const tagContainer = document.createElement('p');
      tagContainer.className = 'popular-tracks__tags';
      tags.forEach(t => {
        const a = document.createElement('a');
        a.className = 'popular-tracks__tag';
        a.href = t.url;
        a.textContent = t.name;
        tagContainer.append(a);
      });
      info.append(tagContainer);
    });
  }
}

/**
 * Запускает загрузку данных и рендер главной страницы
 */
async function initHome() {
  try {
    const [artists, tracks] = await Promise.all([
      getHotArtists(),
      getPopularTracks()
    ]);
    await renderHotRightNow(artists);
    await renderPopularTracks(tracks);
  } catch (e) {
    console.error('Ошибка при инициализации:', e);
  }
}

window.addEventListener('DOMContentLoaded', initHome);
