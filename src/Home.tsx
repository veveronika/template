import HotRightNow from '../components/HotRightNow';
import PopularTracks from '../components/PopularTracks';
import '../styles.css'; 
export default function Home() {
  return (
    <>
      <div className="content__top">
        <h1 className="content__top-header">Music</h1>
      </div>
      <HotRightNow />
      <PopularTracks />
    </>
  );
}
