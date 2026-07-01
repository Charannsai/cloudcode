import React from "react";

export const TECH_NODES = [
  { label: "React", name: "React", bx: -180, by: -180 },
  { label: "Node.js", name: "Node", bx: 180, by: -180 },
  { label: "Python", name: "Python", bx: -280, by: -60 },
  { label: "Docker", name: "Docker", bx: 0, by: -260 },
  { label: "Go", name: "Go", bx: 280, by: -60 },
  { label: "Rust", name: "Rust", bx: -180, by: 180 },
  { label: "TypeScript", name: "TS", bx: 180, by: 180 },
  { label: "Next.js", name: "Next.js", bx: -280, by: 60 },
  { label: "Tailwind", name: "Tailwind", bx: 0, by: 260 },
  { label: "Git", name: "Git", bx: 280, by: 60 }
];

export const getIcon = (name: string) => {
  switch (name) {
    case "React":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#61DAFB" strokeWidth="2" className="w-5 h-5">
          <circle cx="12" cy="12" r="1.5" fill="#61DAFB" />
          <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(30 12 12)" />
          <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(90 12 12)" />
          <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(150 12 12)" />
        </svg>
      );
    case "Node":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#68A063" strokeWidth="2" className="w-5 h-5">
          <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" />
          <path d="M12 22V12M3 7l9 5 9-5" />
        </svg>
      );
    case "Python":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#3776AB" strokeWidth="1.8" className="w-5 h-5">
          <path d="M12 2c-3 0-3 2-3 2v2h3v1H6c-2 0-2 2-2 4v3c0 2 2 2 2 2h1v-2c0-1.2 1.2-2 2.5-2h3c1.2 0 2.5-.8 2.5-2V7.5c0-2-1.5-5-4.5-5.5z" />
          <path d="M12 22c3 0 3-2 3-2v-2h-3v-1h6c2 0 2-2 2-4v-3c0-2-2-2-2-2h-1v2c0 1.2-1.2 2-3 2h-3c-1.2 0-2.5.8-2.5 2v3.5c0 2 1.5 5 4.5 5.5z" />
        </svg>
      );
    case "Docker":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#2496ED" strokeWidth="1.8" className="w-5 h-5">
          <path d="M2 14h20M4 14v-2h2v2M8 14v-2h2v2M12 14v-2h2v2M16 14v-2h2v2M6 10v-2h2v2M10 10v-2h2v2M14 10v-2h2v2M8 6v-2h2v2" />
          <path d="M2 14c0 3 2.5 5 6 5h8c3.5 0 6-2 6-5" />
        </svg>
      );
    case "Go":
      return (
        <span className="text-[10px] font-bold text-[#00ADD8] font-mono">GO</span>
      );
    case "Rust":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#E57324" strokeWidth="1.8" className="w-5 h-5">
          <circle cx="12" cy="12" r="7" strokeDasharray="2.5 2.5" />
          <text x="12" y="15" fontSize="8" fontFamily="sans-serif" fontWeight="bold" fill="#E57324" textAnchor="middle">R</text>
        </svg>
      );
    case "TS":
      return (
        <span className="text-[10px] font-bold text-[#3178C6] font-mono">TS</span>
      );
    case "Next.js":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 15.5V8.5l8 7V8.5" />
        </svg>
      );
    case "Tailwind":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="1.8" className="w-5 h-5">
          <path d="M12 6c-3 0-5 1.5-5.5 5 2.2-1.3 4.5-.8 5.8.8.9-1.3 2.2-2 5-2 3 0 5 1.5 5.5 5-2.2-1.3-4.5-.8-5.8.8-.9-1.3-2.2-2-5-2z" transform="scale(0.8) translate(3, 3)" />
        </svg>
      );
    case "Git":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#F05032" strokeWidth="1.8" className="w-5 h-5">
          <circle cx="18" cy="6" r="2.5" />
          <circle cx="6" cy="18" r="2.5" />
          <circle cx="6" cy="6" r="2.5" />
          <path d="M6 8.5v7M8.5 18h7M18 18a2.5 2.5 0 0 0 2.5-2.5V8.5" />
        </svg>
      );
    case "Postgres":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#336791" strokeWidth="1.8" className="w-5 h-5">
          <path d="M4 6h16M4 12h16M4 18h16M4 6v12M20 6v12" />
        </svg>
      );
    case "Linux":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
          <path d="M12 2C8.5 2 6 4.5 6 8c0 3 1.8 5.5 4.5 6.5v2H8v1.5h8v-1.5h-2.5v-2c2.7-1 4.5-3.5 4.5-6.5 0-3.5-2.5-6-6-6z" />
        </svg>
      );
    default:
      return null;
  }
};

export const CLOUD_PATH = "M744.133 448.718L745.663 450.478C749.573 448.638 756.023 442.638 759.343 439.478C801.523 399.328 807.143 335.468 773.443 288.286C752.363 258.958 720.453 239.246 684.793 233.516C627.733 224.495 571.543 240.02 532.953 284.215C513.333 306.683 501.953 327.078 486.903 352.228L446.383 419.478C424.033 456.788 407.123 486.278 370.333 511.798C322.653 544.868 277.043 552.878 220.513 550.948C199.333 550.218 189.463 551.898 167.033 548.058C111.983 538.618 66.3532 511.758 33.9532 466.048C4.72322 424.818 -6.02688 369.558 3.23312 320.198C19.2031 235.074 86.2132 173.155 171.333 161.818C178.423 160.874 215.733 159.576 216.813 157.721C221.973 148.846 231.733 123.239 239.273 112.014C258.803 82.9043 278.733 62.4333 306.733 42.3943C378.113 -8.68767 483.363 -13.7167 560.263 27.9013C568.783 32.5103 577.823 38.6133 586.293 44.0923C591.413 47.4043 600.223 56.2653 605.963 58.4383C606.413 58.4743 606.863 58.5104 607.323 58.5464C625.333 70.3774 639.813 94.3024 651.953 111.494C653.613 113.836 663.243 137.014 663.103 140.089C659.363 141.274 631.283 140.277 624.573 140.763C613.183 141.589 588.323 150.591 580.113 150.2C577.063 142.857 564.713 129.099 559.173 122.493C559.073 117.483 555.773 114.043 552.203 110.704C491.283 53.7463 386.263 57.7693 331.443 121.487C304.553 152.739 287.003 190.663 285.093 232.343C219.143 232.831 161.143 218.294 109.883 270.641C87.5331 293.249 75.2332 323.908 75.7732 355.698C76.5632 387.998 90.4232 418.588 114.173 440.488C147.973 472.268 189.523 480.028 234.743 478.448C279.973 476.878 316.993 460.968 348.503 427.798C362.653 412.718 372.893 395.008 384.023 377.728C434.863 298.804 467.723 210.738 563.753 176.305C645.703 146.92 740.993 155.774 808.173 214.497C846.483 247.982 870.443 294.617 873.453 345.588C873.823 351.568 873.993 374.398 873.413 379.908C869.123 419.878 851.813 457.338 824.153 486.518C786.803 525.918 735.413 548.968 681.153 550.678C669.933 551.018 658.523 550.698 647.273 550.768C569.733 551.188 491.963 549.938 414.443 550.988C420.043 546.248 432.513 537.208 433.173 530.618C439.673 521.988 452.193 510.948 458.973 500.978C461.403 497.408 474.013 475.968 476.413 475.308C482.143 473.738 503.713 474.508 510.313 474.548L616.123 474.668C660.013 474.668 701.183 478.218 739.293 451.948C741.343 450.538 742.053 450.628 744.133 448.718Z";

export const KEYFRAMES = [
  { p: 0.0, rx: 0, ry: 0, rz: 0, s: 0.25, tx: 0, ty: 450, tz: 0, bezelOpacity: 1 },
  { p: 0.15, rx: 0, ry: 0, rz: 0, s: 1.0, tx: 0, ty: 0, tz: 0, bezelOpacity: 1 },
  { p: 0.30, rx: 0, ry: 0, rz: 0, s: 1.0, tx: 0, ty: 0, tz: 0, bezelOpacity: 1 },
  { p: 0.35, rx: 0, ry: 0, rz: 0, s: 5.5, tx: 0, ty: 0, tz: 200, bezelOpacity: 1 },
  { p: 0.48, rx: 8, ry: -10, rz: 3, s: 1.0, tx: 0, ty: 0, tz: 0, bezelOpacity: 1 },
  { p: 0.58, rx: 5, ry: 0, rz: 0, s: 1.25, tx: 0, ty: 0, tz: 30, bezelOpacity: 1 },
  { p: 0.68, rx: 0, ry: 0, rz: 0, s: 1.25, tx: 0, ty: 0, tz: 50, bezelOpacity: 1 },
  { p: 0.71, rx: 0, ry: 0, rz: 0, s: 1.6, tx: 0, ty: 0, tz: 20, bezelOpacity: 1 },
  { p: 0.78, rx: 0, ry: 0, rz: 0, s: 1.6, tx: 0, ty: 0, tz: 20, bezelOpacity: 1 },
  { p: 0.79, rx: 6, ry: -8, rz: 2, s: 1.25, tx: 0, ty: 0, tz: 10, bezelOpacity: 1 },
  { p: 0.82, rx: 0, ry: 0, rz: 0, s: 1.6, tx: 0, ty: 0, tz: 20, bezelOpacity: 1 },
  { p: 0.84, rx: 0, ry: 0, rz: 0, s: 1.45, tx: 0, ty: 0, tz: 15, bezelOpacity: 1 },
  { p: 0.86, rx: 0, ry: 0, rz: 0, s: 1.45, tx: 0, ty: 0, tz: 15, bezelOpacity: 1 },
  { p: 0.92, rx: 0, ry: 15, rz: -2, s: 1.25, tx: 0, ty: 0, tz: 50, bezelOpacity: 1 },
  { p: 0.94, rx: 0, ry: 0, rz: 0, s: 1.25, tx: 0, ty: 0, tz: 50, bezelOpacity: 1 },
  { p: 0.96, rx: 0, ry: 0, rz: 0, s: 6.0, tx: 0, ty: 0, tz: 500, bezelOpacity: 0 },
  { p: 1.0, rx: 15, ry: -20, rz: 10, s: 1.0, tx: 0, ty: 0, tz: 0, bezelOpacity: 1 }
];

export const get3DTransform = (progress: number, isMobile: boolean, mouseX: number, mouseY: number) => {
  let idx = 0;
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    if (progress >= KEYFRAMES[i].p && progress <= KEYFRAMES[i + 1].p) {
      idx = i;
      break;
    }
  }
  
  const k1 = KEYFRAMES[idx];
  const k2 = KEYFRAMES[idx + 1];
  
  const range = k2.p - k1.p;
  const t = range === 0 ? 0 : (progress - k1.p) / range;
  
  const ease = t * t * (3 - 2 * t);
  const lerp = (a: number, b: number) => a + (b - a) * ease;
  
  const factor = isMobile ? 0.25 : 1.0;
  const mouseRx = isMobile ? 0 : mouseY * -15;
  const mouseRy = isMobile ? 0 : mouseX * 15;
  
  const rx = (lerp(k1.rx, k2.rx) + mouseRx) * factor;
  const ry = (lerp(k1.ry, k2.ry) + mouseRy) * factor;
  const rz = lerp(k1.rz, k2.rz) * factor;
  const s = lerp(k1.s, k2.s) * (isMobile ? 0.8 : 1.0);
  const tx = lerp(k1.tx, k2.tx) * factor;
  const ty = lerp(k1.ty, k2.ty);
  const tz = lerp(k1.tz, k2.tz) * factor;
  
  return `perspective(1200px) translate3d(${tx}px, ${ty}px, ${tz}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s})`;
};

export const WORKFLOW_TOOLS = [
  {
    name: "GitHub",
    icon: <i className="devicon-github-original text-[15px] shrink-0 text-black dark:text-white" />
  },
  {
    name: "GitLab",
    icon: <i className="devicon-gitlab-plain colored text-[15px] shrink-0" />
  },
  {
    name: "VS Code",
    icon: <i className="devicon-vscode-plain colored text-[15px] shrink-0" />
  },
  {
    name: "npm",
    icon: <i className="devicon-npm-original-wordmark colored text-[22px] shrink-0" />
  },
  {
    name: "Docker",
    icon: <i className="devicon-docker-plain colored text-[15px] shrink-0" />
  },
  {
    name: "Node.js",
    icon: <i className="devicon-nodejs-plain colored text-[15px] shrink-0" />
  },
  {
    name: "Python",
    icon: <i className="devicon-python-plain colored text-[15px] shrink-0" />
  },
  {
    name: "Rust",
    icon: <i className="devicon-rust-plain text-[15px] shrink-0 text-black dark:text-white" />
  },
  {
    name: "Go",
    icon: <i className="devicon-go-plain colored text-[15px] shrink-0" />
  },
  {
    name: "PostgreSQL",
    icon: <i className="devicon-postgresql-plain colored text-[15px] shrink-0" />
  },
  {
    name: "Next.js",
    icon: <i className="devicon-nextjs-plain text-[15px] shrink-0 text-black dark:text-white" />
  },
  {
    name: "TypeScript",
    icon: <i className="devicon-typescript-plain colored text-[15px] shrink-0" />
  },
  {
    name: "Antigravity",
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="antiGCol" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="50%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>
        <path d="M12 2L2 12l10 10 10-10L12 2z" fill="url(#antiGCol)" />
        <circle cx="12" cy="12" r="3.5" fill="#FFFFFF" />
      </svg>
    )
  }
];
