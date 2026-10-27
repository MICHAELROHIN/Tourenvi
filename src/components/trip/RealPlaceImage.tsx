// src/components/trip/RealPlaceImage.tsx
import React, { useEffect, useState } from "react";
import { ImageOff, Utensils } from "lucide-react";
import {
  getRealPlaceImage,
  peekRealPlaceImage,
  PlaceImageKind,
  RealImageResult,
} from "@/utils/realPlaceImages";

interface State {
  loading: boolean;
  result: RealImageResult | null;
}

export function useRealPlaceImage(
  name: string,
  city: string,
  kind: PlaceImageKind = "place",
): State {
  const [state, setState] = useState<State>(() => {
    if (!name) return { loading: false, result: null };
    const hit = peekRealPlaceImage(name, city, kind);
    return hit === undefined ? { loading: true, result: null } : { loading: false, result: hit };
  });

  useEffect(() => {
    if (!name) {
      setState({ loading: false, result: null });
      return;
    }
    let cancelled = false;
    const hit = peekRealPlaceImage(name, city, kind);
    if (hit !== undefined) {
      setState({ loading: false, result: hit });
      return;
    }
    setState({ loading: true, result: null });
    getRealPlaceImage(name, city, kind).then((result) => {
      if (!cancelled) setState({ loading: false, result });
    });
    return () => {
      cancelled = true;
    };
  }, [name, city, kind]);

  return state;
}

interface RealPlaceImageProps {
  name: string;
  city: string;
  kind?: PlaceImageKind;
  alt?: string;
  className?: string;
}

/**
 * Shows a verified real photo of the place (Wikipedia / Wikimedia Commons).
 * While loading -> skeleton. If none found -> neutral "photo unavailable" tile.
 * Never shows a fake / stock / AI-generated substitute.
 */
export const RealPlaceImage: React.FC<RealPlaceImageProps> = ({
  name,
  city,
  kind = "place",
  alt,
  className = "w-full h-full object-cover",
}) => {
  const { loading, result } = useRealPlaceImage(name, city, kind);
  const [broken, setBroken] = useState(false);

  useEffect(() => setBroken(false), [result?.url]);

  if (loading) {
    return <div className={`${className} bg-gray-200 animate-pulse`} aria-label="Loading photo" />;
  }

  if (!result || broken) {
    return (
      <div
        className={`${className} bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400`}
        role="img"
        aria-label={`No verified photo available for ${name}`}
      >
        {kind === "food" ? <Utensils size={22} /> : <ImageOff size={22} />}
        <span className="text-[10px] font-semibold text-gray-500">Photo unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={result.url}
      alt={alt || name}
      title={`Photo: ${result.source} – ${result.title}`}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
    />
  );
};

export default RealPlaceImage;