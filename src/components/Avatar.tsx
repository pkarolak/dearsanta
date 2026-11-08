import { useId } from "react";
import type { AvatarConfig } from "@/lib/avatar";

type Props = { config: AvatarConfig; className?: string; title?: string };

function Shape({ d, fill, s }: { d: string; fill: string; s: string }) {
  return (
    <>
      <path d={d} fill={fill} />
      <path d={d} fill={s} />
    </>
  );
}

function Circle({ cx, cy, r, fill, s }: { cx: number; cy: number; r: number; fill: string; s: string }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={fill} />
      <circle cx={cx} cy={cy} r={r} fill={s} />
    </>
  );
}

/**
 * Elf avatar built from layered SVG shapes. Every shape gets a shared highlight/shade overlay,
 * which gives the soft clay look in any colour.
 */
export function Avatar({ config, className, title }: Props) {
  const id = useId().replace(/:/g, "");
  const shade = `url(#${id}-shade)`;
  const c = config;


  const hairBack =
    c.hairStyle === "long" ? (
      <Shape s={shade} d="M54 92 C54 50 146 50 146 92 L152 150 C130 160 70 160 48 150 Z" fill={c.hairColor} />
    ) : null;

  const hairFront = {
    short: <Shape s={shade} d="M58 88 C56 52 90 40 112 44 C138 48 148 70 142 90 C128 74 104 68 84 72 C72 74 64 80 58 88 Z" fill={c.hairColor} />,
    long: <Shape s={shade} d="M58 92 C54 54 88 42 110 44 C140 48 150 74 142 96 C132 72 110 64 96 66 C82 70 68 78 58 92 Z" fill={c.hairColor} />,
    bun: (
      <>
        <Circle s={shade} cx={100} cy={40} r={18} fill={c.hairColor} />
        <Shape s={shade} d="M58 88 C56 56 86 46 102 46 C130 46 146 66 142 90 C130 72 108 66 90 70 C76 73 66 79 58 88 Z" fill={c.hairColor} />
      </>
    ),
    curly: (
      <>
        {[
          [64, 74],
          [76, 58],
          [94, 50],
          [112, 50],
          [128, 58],
          [138, 74],
        ].map(([x, y]) => (
          <Circle s={shade} key={`${x}-${y}`} cx={x} cy={y} r={15} fill={c.hairColor} />
        ))}
      </>
    ),
    bald: null,
  }[c.hairStyle];

  const hat = {
    none: null,
    santa: (
      <>
        <Shape s={shade} d="M58 70 C62 36 96 18 124 24 C148 30 162 52 166 76 C152 62 140 58 132 60 C138 66 140 72 140 74 Z" fill="#B8332C" />
        <Circle s={shade} cx={166} cy={80} r={11} fill="#FBF6EF" />
        <Shape s={shade} d="M52 66 C80 56 122 56 148 66 C152 74 150 82 146 86 C120 76 82 76 54 86 C50 80 50 72 52 66 Z" fill="#FBF6EF" />
      </>
    ),
    elf: (
      <>
        <Shape s={shade} d="M58 74 C70 40 110 10 168 14 C140 26 130 46 142 74 Z" fill="#2F5D46" />
        <Circle s={shade} cx={168} cy={16} r={8} fill="#E7B54A" />
        <Shape s={shade} d="M52 70 C84 60 118 60 148 70 L146 84 C118 76 84 76 54 84 Z" fill="#A8322D" />
      </>
    ),
    beanie: (
      <>
        <Shape s={shade} d="M56 80 C54 40 146 40 144 80 Z" fill="#A8322D" />
        <path d="M60 64 C80 58 120 58 140 64" stroke="#FBF6EF" strokeWidth="5" fill="none" opacity="0.85" />
        <Shape s={shade} d="M52 76 C84 70 116 70 148 76 L148 90 C116 84 84 84 52 90 Z" fill="#FBF6EF" />
        <Circle s={shade} cx={100} cy={36} r={10} fill="#FBF6EF" />
      </>
    ),
    antlers: (
      <g stroke="#8A5A36" strokeWidth="7" strokeLinecap="round" fill="none">
        <path d="M74 58 C66 40 60 30 52 22 M64 42 C56 40 50 42 44 46 M60 32 C64 24 66 18 66 12" />
        <path d="M126 58 C134 40 140 30 148 22 M136 42 C144 40 150 42 156 46 M140 32 C136 24 134 18 134 12" />
      </g>
    ),
  }[c.hat];

  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={title}>
      {title && <title>{title}</title>}
      <defs>
        <radialGradient id={`${id}-shade`} cx="35%" cy="28%" r="85%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="45%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#3B1A10" stopOpacity="0.28" />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <circle cx="100" cy="100" r="100" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        <circle cx="100" cy="100" r="100" fill={c.background} />
        {hairBack}
        <Shape s={shade} d="M30 210 C30 166 62 146 100 146 C138 146 170 166 170 210 Z" fill={c.sweater} />
        <path d="M44 186 L156 186" stroke="#fff" strokeOpacity="0.35" strokeWidth="5" strokeDasharray="2 9" strokeLinecap="round" />
        <Shape s={shade} d="M86 126 L114 126 L116 152 C106 158 94 158 84 152 Z" fill={c.skin} />
        <Circle s={shade} cx={100} cy={94} r={44} fill={c.skin} />
        <Circle s={shade} cx={57} cy={98} r={8} fill={c.skin} />
        <Circle s={shade} cx={143} cy={98} r={8} fill={c.skin} />
        {hairFront}
        <ellipse cx="84" cy="98" rx="5" ry="6" fill="#2B1B14" />
        <ellipse cx="116" cy="98" rx="5" ry="6" fill="#2B1B14" />
        <circle cx="86" cy="96" r="1.6" fill="#fff" />
        <circle cx="118" cy="96" r="1.6" fill="#fff" />
        {c.glasses === "round" && (
          <g stroke="#3B2A22" strokeWidth="3" fill="#fff" fillOpacity="0.12">
            <circle cx="84" cy="98" r="12" />
            <circle cx="116" cy="98" r="12" />
            <path d="M96 97 Q100 94 104 97" fill="none" />
          </g>
        )}
        {c.blush && (
          <>
            <ellipse cx="72" cy="114" rx="9" ry="6" fill="#F08A7A" opacity="0.45" />
            <ellipse cx="128" cy="114" rx="9" ry="6" fill="#F08A7A" opacity="0.45" />
          </>
        )}
        <circle cx="100" cy="108" r="6" fill="#E9967F" />
        <path d="M88 120 Q100 130 112 120" stroke="#6B2A22" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        {c.scarf !== "none" && (
          <>
            <Shape s={shade} d="M66 140 C84 152 116 152 134 140 L138 154 C116 166 84 166 62 154 Z" fill={c.scarf} />
            <Shape s={shade} d="M120 150 L134 150 L140 192 L122 192 Z" fill={c.scarf} />
          </>
        )}
        {hat}
      </g>
    </svg>
  );
}
