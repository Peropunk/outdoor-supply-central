// Mountain-and-pine band redrawn as SVG in the spirit of the old site's hero.
// Swap for JD's original illustration file once he shares it.

const PINE_DARK = "#1f4a1c";
const PINE_MID = "#2e6a2a";
const PINE_LIGHT = "#4e8a3a";

function pine(x: number, base: number, h: number, fill: string) {
  const w = h * 0.42;
  const tiers = [0, 0.3, 0.55].map((t, i) => {
    const top = base - h + t * h;
    const bottom = base - (2 - i) * h * 0.12;
    const half = (w / 2) * (0.6 + i * 0.25);
    return `M${x} ${top} L${x + half} ${bottom} L${x - half} ${bottom} Z`;
  });
  return <path key={`${x}-${base}`} d={tiers.join(" ")} fill={fill} />;
}

// Deterministic pseudo-random so server and client render the same trees.
function rand(seed: number) {
  const s = Math.sin(seed * 9301 + 49297) * 233280;
  return s - Math.floor(s);
}

function treeLine(count: number, base: number, minH: number, maxH: number, seed: number) {
  const colors = [PINE_DARK, PINE_MID, PINE_LIGHT];
  return Array.from({ length: count }, (_, i) => {
    const x = (i / count) * 1480 - 20 + rand(seed + i) * 30;
    const h = minH + rand(seed + i * 3) * (maxH - minH);
    return pine(x, base + rand(seed + i * 7) * 10, h, colors[Math.floor(rand(seed + i * 5) * 3)]);
  });
}

export function MountainArt({ className, trees = true }: { className?: string; trees?: boolean }) {
  return (
    <svg viewBox="0 0 1440 420" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="osc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7f3ea" />
          <stop offset="1" stopColor="#d6e8ec" />
        </linearGradient>
        <linearGradient id="osc-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5d8dc2" />
          <stop offset="1" stopColor="#4a76ad" />
        </linearGradient>
      </defs>
      <rect width="1440" height="420" fill="url(#osc-sky)" />
      {/* far ridge */}
      <path
        d="M0 250 L160 170 L300 220 L470 120 L640 210 L820 140 L1000 230 L1180 130 L1330 200 L1440 160 L1440 420 L0 420Z"
        fill="#bcd5e0"
      />
      {/* main peaks */}
      <path
        d="M-20 330 L180 180 L260 230 L380 110 L520 260 L600 230 L760 330 L900 250 L1040 130 L1150 210 L1240 170 L1460 320 L1460 420 L-20 420Z"
        fill="url(#osc-front)"
      />
      {/* snow and light faces */}
      <path d="M380 110 L340 160 L372 150 L395 175 L420 150 L452 175Z" fill="#f2e2d6" />
      <path d="M180 180 L150 205 L176 200 L196 214Z" fill="#f2e2d6" />
      <path d="M1040 130 L1000 175 L1030 168 L1050 190 L1068 165 L1095 180Z" fill="#f2e2d6" />
      <path d="M1240 170 L1218 190 L1240 186 L1258 196Z" fill="#f2e2d6" />
      {/* foothills */}
      <path
        d="M-20 380 C200 320 360 340 520 360 C700 385 860 320 1040 340 C1200 356 1320 330 1460 350 L1460 420 L-20 420Z"
        fill="#3f6a9c"
        opacity="0.55"
      />
      {trees && (
        <g>
          {treeLine(36, 404, 50, 90, 1)}
          {treeLine(48, 424, 60, 120, 101)}
        </g>
      )}
    </svg>
  );
}
