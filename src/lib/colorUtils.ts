export function getScoreColor(score: number, maxScore: number): string {
  const p = Math.max(0, Math.min(1, score / maxScore));
  
  // Color stops for light theme
  // 0%: Muted Coral/Brick (rgb(200, 110, 100)) - not pure red
  // 50%: Warm Golden Yellow (rgb(210, 160, 60))
  // 100%: Vibrant Leaf Green (rgb(60, 160, 80))

  let r, g, b;

  if (p < 0.5) {
    // Interpolate between Coral and Yellow
    const t = p * 2; // 0 to 1
    r = Math.round(200 + (210 - 200) * t);
    g = Math.round(110 + (160 - 110) * t);
    b = Math.round(100 + (60 - 100) * t);
  } else {
    // Interpolate between Yellow and Green
    const t = (p - 0.5) * 2; // 0 to 1
    r = Math.round(210 + (60 - 210) * t);
    g = Math.round(160 + (160 - 160) * t);
    b = Math.round(60 + (80 - 60) * t);
  }

  return `rgb(${r}, ${g}, ${b})`;
}
