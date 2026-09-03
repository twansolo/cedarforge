import { cn } from "@/lib/utils";

/**
 * Monochrome cedar grain, generated with fractal noise and displacement so it
 * reads as a material texture rather than an illustration. Purely decorative.
 */
export function WoodGrain({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={cn("pointer-events-none select-none", className)}
      preserveAspectRatio="none"
      viewBox="0 0 600 900"
    >
      <defs>
        <filter id="cf-grain" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.004 0.09"
            numOctaves="4"
            seed="7"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="26"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <linearGradient id="cf-grain-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.9" />
          <stop offset="70%" stopColor="white" stopOpacity="0.35" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id="cf-grain-mask">
          <rect width="600" height="900" fill="url(#cf-grain-fade)" />
        </mask>
      </defs>

      <g mask="url(#cf-grain-mask)">
        <g filter="url(#cf-grain)" stroke="currentColor" fill="none">
          {Array.from({ length: 26 }, (_, index) => {
            const x = index * 24 + 6;
            return (
              <path
                key={x}
                d={`M${x} -40 C ${x + 16} 220, ${x - 14} 520, ${x + 8} 940`}
                strokeWidth={index % 4 === 0 ? 1.7 : 0.8}
                strokeOpacity={index % 4 === 0 ? 0.5 : 0.28}
              />
            );
          })}
          {/* Knots, the detail that makes the grain read as cedar. */}
          <ellipse
            cx="176"
            cy="286"
            rx="26"
            ry="9"
            strokeWidth="1.5"
            strokeOpacity="0.45"
          />
          <ellipse
            cx="176"
            cy="286"
            rx="13"
            ry="4"
            strokeWidth="1.2"
            strokeOpacity="0.35"
          />
          <ellipse
            cx="428"
            cy="612"
            rx="21"
            ry="7"
            strokeWidth="1.5"
            strokeOpacity="0.4"
          />
        </g>
      </g>
    </svg>
  );
}
