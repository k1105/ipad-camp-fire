export const thermoFrag = `
precision mediump float;
varying vec2 v_texCoord;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;

// --- noise functions ---
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
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec4 tex = texture2D(u_texture, v_texCoord);
  float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));

  // --- contrast boost ---
  lum = clamp((lum - 0.5) * 1.8 + 0.5, 0.0, 1.0);

  // --- thermo colormap ---
  vec3 color;
  if (lum < 0.25) {
    color = mix(vec3(0.0, 0.0, 0.0), vec3(0.5, 0.0, 0.0), lum / 0.25);
  } else if (lum < 0.5) {
    color = mix(vec3(0.5, 0.0, 0.0), vec3(1.0, 0.0, 0.0), (lum - 0.25) / 0.25);
  } else if (lum < 0.75) {
    color = mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 0.6, 0.0), (lum - 0.5) / 0.25);
  } else {
    color = mix(vec3(1.0, 0.6, 0.0), vec3(1.0, 1.0, 1.0), (lum - 0.75) / 0.25);
  }

  // --- white-direction mottling (fbm blotches) ---
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float t = u_time * 0.25;
  float mottle1 = fbm(uv * 2.5 + vec2(t * 0.6, t * 0.4));
  float mottle2 = fbm(uv * 4.0 + vec2(-t * 0.5, t * 0.7) + 30.0);
  float mottle3 = fbm(uv * 8.0 + vec2(t * 1.2, -t * 0.3) + 60.0);
  float mottle = mottle1 * 0.4 + mottle2 * 0.35 + mottle3 * 0.25;

  // only push toward white (mottle 0..1 → white boost 0..1)
  float whiteBoost = smoothstep(0.35, 0.75, mottle) * 1.2;
  color = mix(color, vec3(1.0), whiteBoost * 0.6);

  // --- grain noise ---
  float grain = hash(gl_FragCoord.xy + fract(u_time * 43.17) * 100.0);
  color += (grain - 0.5) * 0.3;

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;
