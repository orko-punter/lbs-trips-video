import type React from "react";

export default function Image({ src, alt, fill, priority: _p, sizes: _s, ...rest }: Omit<React.ComponentProps<"img">, "src"> & { src: string | { src: string }; fill?: boolean; priority?: boolean }) {
  const url = typeof src === "string" ? src : src.src;
  return <img src={url} alt={alt} {...rest} style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", ...rest.style } : rest.style} />;
}
