import { useId } from "react";
import type { AvatarConfig } from "@/lib/avatar";

type Props = { config: AvatarConfig; className?: string; title?: string };

const hatLift = { none: 0, santa: -9, elf: -9, beanie: -15, antlers: -2 } as const;

const yarn = { fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

/**
 * An elf as a felt hand puppet: ping-pong-ball eyes, a pom-pom nose and an open puppet mouth.
 * The felt filter roughens every edge and adds fibre grain, so flat colours read as fabric.
 */
export function Avatar({ config: c, className, title }: Props) {
  const id = useId().replace(/:/g, "");
  const felt = `url(#${id}-felt)`;
  const reindeer = c.hat === "antlers";

  const hairBack =
    c.hairStyle === "long" ? (
      <g {...yarn} stroke={c.hairColor} strokeWidth="9">
        <path d="M58 80 C46 110 48 140 56 168" />
        <path d="M66 74 C56 108 60 138 66 166" />
        <path d="M142 80 C154 110 152 140 144 168" />
        <path d="M134 74 C144 108 140 138 134 166" />
      </g>
    ) : null;

  const hairFront = {
    short: (
      <g {...yarn} stroke={c.hairColor} strokeWidth="8">
        <path d="M62 70 C70 56 84 50 96 54" />
        <path d="M76 64 C88 50 104 48 116 56" />
        <path d="M100 58 C114 48 130 52 138 68" />
      </g>
    ),
    long: (
      <g {...yarn} stroke={c.hairColor} strokeWidth="8">
        <path d="M60 76 C66 56 82 48 100 50" />
        <path d="M100 50 C120 48 136 58 140 76" />
        <path d="M78 58 C90 66 104 66 116 58" />
      </g>
    ),
    bun: (
      <g {...yarn} stroke={c.hairColor} strokeWidth="8">
        <circle cx="100" cy="36" r="12" fill={c.hairColor} />
        <path d="M62 72 C70 54 86 48 100 48 C114 48 130 54 138 72" />
      </g>
    ),
    curly: (
      <g {...yarn} stroke={c.hairColor} strokeWidth="6.5">
        {[64, 80, 96, 112, 128].map((x, i) => (
          <circle key={x} cx={x + 4} cy={i % 2 ? 54 : 62} r="9" />
        ))}
      </g>
    ),
    bald: null,
  }[c.hairStyle];

  const hat = {
    none: null,
    santa: (
      <>
        <path d="M56 64 C62 28 104 10 134 22 C156 32 166 56 170 82 C156 66 144 60 136 62 C140 66 142 70 142 72 Z" fill="#C4232E" />
        <circle cx="170" cy="84" r="12" fill="#F7F0E4" />
        <path d="M48 62 C80 50 122 50 152 62 L150 82 C120 72 82 72 50 82 Z" fill="#F7F0E4" />
      </>
    ),
    elf: (
      <>
        <path d="M54 66 C64 34 104 6 170 8 C142 22 132 44 146 66 Z" fill="#2A7A4B" />
        <circle cx="170" cy="10" r="8" fill="#E9B23A" />
        <path d="M48 62 L58 76 L70 64 L82 77 L94 64 L106 77 L118 64 L130 77 L142 64 L152 76 L152 60 C118 50 82 50 48 60 Z" fill="#C4232E" />
      </>
    ),
    beanie: (
      <>
        <path d="M56 74 C52 34 148 34 144 74 Z" fill="#C4232E" />
        <path d="M58 58 C80 52 120 52 142 58 L142 66 C120 60 80 60 58 66 Z" fill="#F7F0E4" />
        <path d="M50 70 C84 62 116 62 150 70 L150 86 C116 78 84 78 50 86 Z" fill="#F7F0E4" />
        <circle cx="100" cy="30" r="11" fill="#F7F0E4" />
      </>
    ),
    antlers: (
      <g fill="#7A4A2A">
        <path d="M70 58 C62 42 56 30 48 18 C46 14 52 12 54 16 C58 22 62 28 64 32 C66 26 66 20 68 14 C70 10 76 12 74 16 C72 24 72 32 74 40 C78 34 84 30 90 28 C94 28 94 34 90 34 C84 36 80 42 80 52 Z" />
        <path d="M130 58 C138 42 144 30 152 18 C154 14 148 12 146 16 C142 22 138 28 136 32 C134 26 134 20 132 14 C130 10 124 12 126 16 C128 24 128 32 126 40 C122 34 116 30 110 28 C106 28 106 34 110 34 C116 36 120 42 120 52 Z" />
      </g>
    ),
  }[c.hat];

  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={title}>
      {title && <title>{title}</title>}
      <defs>
        <filter id={`${id}-felt`} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="fuzz" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.36 0 0 0 -0.17" result="grain" />
          <feComposite in="grain" in2="fuzz" operator="in" result="grainIn" />
          <feMerge>
            <feMergeNode in="fuzz" />
            <feMergeNode in="grainIn" />
          </feMerge>
        </filter>
        <clipPath id={`${id}-clip`}>
          <circle cx="100" cy="100" r="100" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        <circle cx="100" cy="100" r="100" fill={c.background} />
        <g filter={felt}>
          {hairBack}
          <path d="M26 212 C26 168 60 146 100 146 C140 146 174 168 174 212 Z" fill={c.sweater} />
          {!reindeer && (
            <>
              <path d="M56 98 C38 88 26 72 20 56 C40 60 56 72 64 86 Z" fill={c.skin} />
              <path d="M144 98 C162 88 174 72 180 56 C160 60 144 72 136 86 Z" fill={c.skin} />
            </>
          )}
          {reindeer && (
            <>
              <ellipse cx="50" cy="86" rx="16" ry="9" transform="rotate(-24 50 86)" fill={c.skin} />
              <ellipse cx="150" cy="86" rx="16" ry="9" transform="rotate(24 150 86)" fill={c.skin} />
            </>
          )}
          <ellipse cx="100" cy="98" rx="50" ry="48" fill={c.skin} />
          {hairFront}
          {c.blush && (
            <>
              <ellipse cx="64" cy="114" rx="10" ry="7" fill="#EF8C80" opacity="0.6" />
              <ellipse cx="136" cy="114" rx="10" ry="7" fill="#EF8C80" opacity="0.6" />
            </>
          )}
          <path d="M70 118 C76 146 124 146 130 118 C116 124 84 124 70 118 Z" fill="#5A1518" />
          <path d="M86 134 C92 128 108 128 114 134 C108 142 92 142 86 134 Z" fill="#E77B7F" />
          {c.scarf !== "none" && (
            <>
              <path d="M58 146 C80 160 120 160 142 146 L148 162 C120 178 80 178 52 162 Z" fill={c.scarf} />
              <path d="M124 160 L142 158 L150 200 L128 200 Z" fill={c.scarf} />
            </>
          )}
          <circle cx="100" cy="108" r="12" fill={reindeer ? "#D7262F" : "#E98A78"} />
          <g transform={`translate(0 ${hatLift[c.hat]})`}>{hat}</g>
        </g>
        <circle cx="82" cy="86" r="15" fill="#FBF8F2" />
        <circle cx="118" cy="86" r="15" fill="#FBF8F2" />
        <circle cx="85" cy="89" r="6.5" fill="#1A0F0A" />
        <circle cx="121" cy="89" r="6.5" fill="#1A0F0A" />
        <circle cx="87" cy="86.5" r="2" fill="#fff" />
        <circle cx="123" cy="86.5" r="2" fill="#fff" />
        {c.glasses === "round" && (
          <g stroke="#3B2A22" strokeWidth="3.2" fill="none">
            <circle cx="82" cy="86" r="19" />
            <circle cx="118" cy="86" r="19" />
            <path d="M99 84 Q100 82 101 84" />
          </g>
        )}
      </g>
    </svg>
  );
}
