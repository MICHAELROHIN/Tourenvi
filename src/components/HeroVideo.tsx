import tamilNaduVideo from "@/assets/tn.mp4";
import { cn } from "@/lib/utils";

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
  return (
    <div
      className={cn(
        "relative w-full aspect-video overflow-hidden bg-black",
        className,
      )}
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        className={cn(
          "absolute inset-0 h-full w-full object-cover",
          videoClassName,
        )}
        poster="/placeholder.svg"
      >
        <source src={tamilNaduVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background/80",
          overlayClassName,
        )}
      />
    </div>
  );
};

export default HeroVideo;
