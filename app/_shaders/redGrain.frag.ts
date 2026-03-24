export const redGrainFrag = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float t = u_time * 1.2;

  // large-scale animated blobs — low frequency for big bright patches
  float g1 = fbm(uv * 0.15 + vec2(t * 0.6, t * 0.4));
  float g2 = fbm(uv * 0.25 + vec2(-t * 0.5, t * 0.7) + 30.0);
  float gradient = g1 * 0.5 + g2 * 0.5;

  // hard grain: step produces sharp on/off dots
  float grain = step(0.7, hash(gl_FragCoord.xy));

  // wide mask — large bright clusters
  float mask = smoothstep(0.3, 0.55, gradient);
  float v = grain * mask;

  // red base, white grain
  vec3 color = mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0), v);

  gl_FragColor = vec4(color, 1.0);
}
`;
