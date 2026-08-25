const wavePaths = [
  "M8 146 C42 104 70 118 101 88 S157 61 190 86 S245 139 278 103 S336 48 373 76 S428 124 492 70",
  "M0 166 C37 132 69 142 103 110 S161 80 197 105 S248 157 286 121 S344 71 381 96 S441 140 506 93",
  "M2 187 C40 157 77 166 112 137 S166 105 204 127 S258 177 294 144 S352 96 390 119 S449 159 512 115",
  "M-4 206 C32 179 73 189 119 160 S173 129 213 148 S267 195 305 166 S361 122 401 143 S460 178 518 139",
  "M-8 224 C33 202 75 210 125 183 S180 153 219 171 S273 213 314 187 S371 149 412 166 S468 197 522 163",
];

const particles = [[68, 95, "orange"], [128, 73, "pink"], [204, 137, "amber"], [287, 98, "orange"], [363, 67, "pink"], [435, 116, "amber"], [474, 78, "orange"]];

export default function WaveHero({ accentColor = "orange" }) {
  return (
    <div className={`wave-hero wave-hero-${accentColor}`} aria-hidden="true">
      <div className="wave-bloom wave-bloom-one" />
      <div className="wave-bloom wave-bloom-two" />
      <svg viewBox="0 0 510 245" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wave-hero-gradient" x1="0" x2="1">
            <stop offset="0" stopColor="var(--accent-orange)" />
            <stop offset="1" stopColor="var(--accent-pink)" />
          </linearGradient>
        </defs>
        {wavePaths.map((path, index) => (
          <path key={path} className={`hero-wave-path hero-wave-path-${index}`} d={path} pathLength="1">
            <animate attributeName="d" dur={`${10 + index}s`} repeatCount="indefinite" values={`${path};${wavePaths[(index + 1) % wavePaths.length]};${path}`} />
          </path>
        ))}
        {particles.map(([cx, cy, color], index) => <circle key={`${cx}-${cy}`} className={`hero-particle hero-particle-${color}`} cx={cx} cy={cy} r={index % 3 === 0 ? 2.8 : 1.8}><animate attributeName="opacity" dur={`${2.8 + index * .25}s`} values=".28;.9;.28" repeatCount="indefinite" /></circle>)}
      </svg>
      <span className="hero-note-glyph">♪</span>
    </div>
  );
}
