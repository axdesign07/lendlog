"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface FriendAvatarProps {
  name: string;
  photoUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { container: "h-8 w-8", text: "text-xs", image: 32 },
  md: { container: "h-10 w-10", text: "text-sm", image: 40 },
  lg: { container: "h-16 w-16", text: "text-xl", image: 64 },
} as const;

function getHue(name: string): number {
  return name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
}

export function FriendAvatar({ name, photoUrl, size = "md", className }: FriendAvatarProps) {
  const { container, text, image: imgSize } = sizeMap[size];
  const initial = name.charAt(0).toUpperCase();
  const hue = getHue(name);

  if (photoUrl) {
    return (
      <div
        className={cn(
          container,
          "relative shrink-0 overflow-hidden rounded-full ring-2 ring-background",
          className
        )}
      >
        <Image
          src={photoUrl}
          alt={name}
          width={imgSize}
          height={imgSize}
          unoptimized
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        container,
        "flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-background",
        text,
        className
      )}
      style={{
        background: `linear-gradient(145deg, oklch(0.65 0.18 ${hue}), oklch(0.55 0.15 ${(hue + 30) % 360}))`,
      }}
    >
      {initial}
    </div>
  );
}
