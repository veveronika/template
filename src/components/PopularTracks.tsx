import { useEffect, useState } from 'react';
import { getHotTracks, getTrackTags, Track, Tag } from '../API/Lastfm';

export default function PopularTracks() {
  const [tracks, setTracks] = useState<Track[]>([]);

  useEffect(() => {
    getHotTracks()
      .then(setTracks)
      .catch(console.error);
  }, []);

  const cols: Track[][] = [[], [], []];
  tracks.forEach((track, idx) => cols[idx % 3].push(track));

  return (
    <section className="popular-tracks">
      <h2 className="popular-tracks__title">Popular tracks</h2>
      <div className="popular-tracks__underline"></div>
      <div className="popular-tracks__columns">
        {cols.map((col, i) => (
          <div key={i} className="popular-tracks__col">
            {col.map(track => (
              <TrackItem key={track.name} track={track} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function TrackItem({ track }: { track: Track }) {
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    getTrackTags(track.artist.name, track.name)
      .then(setTags)
      .catch(() => {});
  }, [track]);

  return (
    <div className="popular-tracks__item">
      <a href={track.url} className="popular-tracks__media">
        <img
          className="popular-tracks__thumb"
          src={track.image?.[2]?.['#text']}
          alt={track.name}
          loading="lazy"
        />
      </a>
      <div className="popular-tracks__info">
        <a href={track.url} className="popular-tracks__track">
          {track.name}
        </a>
        <a href={track.artist.url} className="popular-tracks__artist">
          {track.artist.name}
        </a>
        {tags.length > 0 && (
          <p className="popular-tracks__tags">
            {tags.map(t => (
              <a key={t.name} href={t.url} className="popular-tracks__tag">
                {t.name}
              </a>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}