import { useEffect, useState } from 'react';
import { getHotArtists, getArtistTags, Artist, Tag } from '../API/Lastfm';

export default function RenderTopArtists() {
  const [artists, setArtists] = useState<Artist[]>([]);

  useEffect(() => {
    getHotArtists().then(setArtists).catch(console.error);
  }, []);

  return (
    <section className="hot-right-now">
      <h2 className="hot-right-now__title">Hot right now</h2>
      <div className="hot-right-now__underline"></div>
      <div className="hot-right-now__grid">
        {artists.map((artist) => (
          <div key={artist.name} className="hot-right-now__item">
            <a href={artist.url} className="hot-right-now__media">
              <img
                className="hot-right-now__thumb"
                src={artist.image?.[2]?.['#text'] ?? ''}
                alt={artist.name}
                loading="eager"
                width={120}
                height={120}
              />
              <p className="hot-right-now__name">{artist.name}</p>
            </a>
            <ArtistTags name={artist.name} />
          </div>
        ))}
      </div>
    </section>
  );
}

function ArtistTags({ name }: { name: string }) {
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    getArtistTags(name).then(setTags).catch(() => {});
  }, [name]);

  if (tags.length === 0) return null;

  return (
    <p className="hot-right-now__tags">
      {tags.map((t) => (
        <a key={t.name} href={t.url} className="hot-right-now__tag">
          {t.name}
        </a>
      ))}
    </p>
  );
}