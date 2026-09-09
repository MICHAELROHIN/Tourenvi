import tamilNaduVideo from "@/assets/tn.mp4";
import heroPosterWebp from "@/assets/hero-poster.webp";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

type HeroVideoProps = {
  className?: string;
  videoClassName?: string;
  overlayClassName?: string;
};

const HeroVideo = ({
  className,
  videoClassName,
  overlayClassName,
}: HeroVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.defaultMuted = true;
    video.muted = true;

    const attemptPlay = () => {
      if (video.paused) {
        const promise = video.play();
        if (promise !== undefined) {
          promise
            .then(() => setIsPlaying(true))
            .catch(() => {
              // Autoplay restrictions or waiting for user interaction
            });
        }
      }
    };

    attemptPlay();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        attemptPlay();
      }
    };

    const handleFocus = () => {
      attemptPlay();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div
      className={cn(
        "relative w-full aspect-video overflow-hidden bg-cover bg-center",
        className,
      )}
      style={{
        backgroundImage: `url(${heroPosterWebp})`,
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster={heroPosterWebp}
        onPlaying={() => setIsPlaying(true)}
        onLoadedData={() => {
          if (videoRef.current?.paused) {
            videoRef.current.play().catch(() => {});
          }
        }}
        onLoadedMetadata={() => {
          if (videoRef.current?.paused) {
            videoRef.current.play().catch(() => {});
          }
        }}
        onCanPlay={() => {
          if (videoRef.current?.paused) {
            videoRef.current.play().catch(() => {});
          }
        }}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
          isPlaying ? "opacity-100" : "opacity-90",
          videoClassName,
        )}
      >
        <source src={tamilNaduVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background/80 pointer-events-none",
          overlayClassName,
        )}
      />
    </div>
  );
};

export default HeroVideo;
