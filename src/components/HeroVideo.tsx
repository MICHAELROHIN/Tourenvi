import tamilNaduVideo from "@/assets/video_20251104_094816_edit.mp4"

const HeroVideo = () => {
  return (
    <div className="w-full aspect-video relative overflow-hidden bg-black">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
        poster="/video-poster.jpg" // Add a poster image if you have one
      >
        <source src={tamilNaduVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background/80" />
    </div>
  );
};

export default HeroVideo;
