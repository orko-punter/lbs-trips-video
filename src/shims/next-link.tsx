import type React from "react";

export default function Link({ href, children, prefetch: _p, replace: _r, scroll: _s, ...rest }: Omit<React.ComponentProps<"a">, "href"> & { href: string | { pathname?: string }; prefetch?: boolean; replace?: boolean; scroll?: boolean }) {
  return (
    <a href={typeof href === "string" ? href : (href.pathname ?? "#")} {...rest}>
      {children}
    </a>
  );
}
