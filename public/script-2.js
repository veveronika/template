const API_KEY = '4482ed54ab8d2bb16afbd5985943630a';
const API_BASE = 'https://ws.audioscrobbler.com/2.0/';
/**
 * Выполняет запрос к Last.fm API
 * @param {string} method - Название метода API
 * @param {Record<string, string|number>} [params={}] - Дополнительные параметры
 * @returns {Promise<any>} Распарсенный JSON-ответ
 * @throws {Error} При ошибке HTTP-запроса
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
 * Ищет артистов по строке запроса
 * @param {string} q - Строка поиска
 * @returns {Promise<Artist[]>} Найденные артисты
 */
async function searchArtists(q) {
  const d = await fetchFromApi('artist.search', { artist: q, limit: 8 });
  return d.results.artistmatches.artist || [];
}

/**
 * Ищет альбомы по строке запроса
 * @param {string} q - Строка поиска
 * @returns {Promise<Album[]>} Найденные альбомы
 */
async function searchAlbums(q) {
  const d = await fetchFromApi('album.search', { album: q, limit: 8 });
  return d.results.albummatches.album || [];
}

/**
 * Ищет треки по строке запроса
 * @param {string} q - Строка поиска
 * @returns {Promise<Track[]>} Найденные треки
 */
async function searchTracks(q) {
  const d = await fetchFromApi('track.search', { track: q, limit: 10 });
  return d.results.trackmatches.track || [];
}

/**
 * Получает расширенную информацию о треке
 * @param {string} artist - Артист
 * @param {string} track - Название трека
 * @param {string} fallbackImage - Изображение по умолчанию
 * @returns {Promise<TrackInfo>} Информация о треке
 */
async function getTrackInfo(artist, track, fallbackImage) {
  try {
    const { track: info = {} } = await fetchFromApi('track.getInfo', { artist, track });
    const ms = parseInt(info.duration, 10);
    const duration = isNaN(ms)
      ? ''
      : `${Math.floor(ms / 60000)}:${('0' + Math.floor((ms / 1000) % 60)).slice(-2)}`;
    const artistUrl = info.artist?.url || '#';
    const imageUrl = info.album?.image?.find(i => i.size === 'medium')?.['#text']
      || info.album?.image?.[0]?.['#text']
      || fallbackImage;
    return { duration, artistUrl, imageUrl };
  } catch {
    return { duration: '', artistUrl: '#', imageUrl: fallbackImage };
  }
}

/**
 * Рендерит элементы списка (артисты/альбомы)
 * @param {string} sel - Селектор контейнера
 * @param {Array} items - Данные для рендера
 * @param {Function} tpl - Шаблон элемента
 * @param {string} emptyText - Сообщение при пустом списке
 */
function renderItems(sel, items, tpl, emptyText) {
  const c = document.querySelector(sel);
  c.innerHTML = '';
  if (!items.length) {
    c.innerHTML = `<p class="no-results-message">${emptyText}</p>`;
  } else {
    items.forEach(x => c.append(tpl(x)));
  }
}

/**
 * Создаёт элемент артиста
 * @param art - Данные артиста
 * @returns Элемент DOM
 */
function artistTemplate(art) {
  const img = art.image?.[2]?.['#text'] || '';
  const a = document.createElement('a');
  a.className = 'artists__item';
  a.href = art.url;
  a.style.backgroundImage = `url(${img})`;

  const info = document.createElement('div');
  info.className = 'artists__info';

  const h3 = document.createElement('h3');
  h3.className = 'artists__name';
  h3.textContent = art.name;

  const p = document.createElement('p');
  p.className = 'artists__listeners';
  p.textContent = `${art.listeners} listeners`;

  info.append(h3, p);
  a.append(info);
  return a;
}

/**
 * Создаёт элемент альбома
 * @param alb - Данные альбома
 * @returns Элемент DOM
 */
function albumTemplate(alb) {
  const img = alb.image?.[2]?.['#text'] || '';
  const a = document.createElement('a');
  a.className = 'albums__item';
  a.href = alb.url;
  a.style.backgroundImage = `url(${img})`;

  const info = document.createElement('div');
  info.className = 'albums__info';

  const h3 = document.createElement('h3');
  h3.className = 'albums__name';
  h3.textContent = alb.name;

  const p = document.createElement('p');
  p.className = 'albums__artist';
  p.textContent = alb.artist;

  info.append(h3, p);
  a.append(info);
  return a;
}

/**
 * Отображает список треков
 * @param tracks - Массив треков
 */
async function renderTracks(tracks) {
  const list = document.querySelector('.tracks__list');
  list.innerHTML = '';
  if (!tracks.length) {
    const p = document.createElement('p');
    p.className = 'no-results-message';
    p.textContent = 'No tracks found.';
    list.append(p);
    return;
  }

  for (const tr of tracks) {
    const img0 = tr.image?.[1]?.['#text'] || 'images/image.png';
    const { duration, artistUrl, imageUrl } = await getTrackInfo(tr.artist, tr.name, img0);

    const li = document.createElement('li');
    li.className = 'tracks__item';

    const btn = document.createElement('button');
    btn.className = 'tracks__play-btn';
    btn.ariaLabel = 'Play';

    const imgEl = document.createElement('img');
    imgEl.src = imageUrl;
    imgEl.alt = tr.name;
    imgEl.className = 'tracks__image';

    const aName = document.createElement('a');
    aName.href = tr.url;
    aName.className = 'tracks__name';
    aName.textContent = tr.name;

    const aArtist = document.createElement('a');
    aArtist.href = artistUrl;
    aArtist.className = 'tracks__artist';
    aArtist.textContent = tr.artist;

    const d = document.createElement('div');
    d.className = 'tracks__duration';
    d.textContent = duration;

    li.append(btn, imgEl, aName, aArtist, d);
    list.append(li);
  }
}

/**
 * Показывает или скрывает секцию по селектору
 * @param {string} sel - Селектор
 * @param {boolean} show - Отображать или скрыть
 */
function toggleSection(sel, show) {
  const el = document.querySelector(sel);
  if (el) el.style.display = show ? '' : 'none';
}

/**
 * Запускает поиск при загрузке страницы:
 * - Читает параметр q из URL
 * - Выполняет поиск
 * - Рендерит результаты
 */
async function initSearch() {
  const q = new URLSearchParams(location.search).get('q')?.trim();
  if (!q) {
    document.querySelectorAll('.artists, .albums, .tracks, .search-results__header')
      .forEach(el => toggleSection(`.${el.className}`, false));
    return;
  }

  toggleSection('.search-results__header', true);
  toggleSection('.search-results__tabs', true);
  document.querySelector('.search-results__title').textContent = `Search results for “${q}”`;

  try {
    const [artists, albums, tracks] = await Promise.all([
      searchArtists(q),
      searchAlbums(q),
      searchTracks(q)
    ]);
    renderItems('.artists__grid', artists, artistTemplate, 'No artists found.');
    toggleSection('.artists', true);

    renderItems('.albums__grid', albums, albumTemplate, 'No albums found.');
    toggleSection('.albums', true);

    await renderTracks(tracks);
    toggleSection('.tracks', true);

  } catch (err) {
    console.error('Search error:', err);
  }
}

window.addEventListener('DOMContentLoaded', initSearch);
