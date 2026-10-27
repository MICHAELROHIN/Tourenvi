import React, { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { getApiUrl } from "@/config/api";

interface PlaceImageProps {
  name: string;
  destination?: string;
  alt?: string;
  className?: string;
}

export const PlaceImage: React.FC<PlaceImageProps> = ({
  name,
  destination = "",
  alt,
  className = "",
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ name });
    if (destination) params.set("destination", destination);

    fetch(`${getApiUrl("/api/place-image")}?${params.toString()}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Image lookup failed with HTTP ${response.status}`);
        return response.json();
      })
      .then((data: { imageUrl?: string | null }) => {
        if (data.imageUrl) setImageUrl(data.imageUrl);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.warn(`Could not load a verified image for "${name}".`, error);
      });

    return () => controller.abort();
  }, [destination, name]);

  if (!imageUrl) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-emerald-950/10 text-emerald-900/60 ${className}`}>
        <ImageOff size={24} aria-label="Verified image unavailable" />
      </div>
    );
  }

  return <img src={imageUrl} alt={alt || name} className={className} loading="lazy" />;
};
