// 追加クロップ: cover処理後にさらに中央寄せで絞る量 (0.0=なし)
const EXTRA_CROP = 0.0;

export function createShaderProgram(
  gl: WebGLRenderingContext,
  vertSrc: string,
  fragSrc: string
): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? "Link failed");
  }
  return program;
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "Compile failed");
  }
  return shader;
}

// cover計算: 映像アスペクト比とキャンバスアスペクト比から
// テクスチャ座標上の表示範囲を返す
function coverUV(
  videoW: number,
  videoH: number,
  canvasW: number,
  canvasH: number
): { minU: number; maxU: number; minV: number; maxV: number } {
  const videoAspect = videoW / videoH;
  const canvasAspect = canvasW / canvasH;

  let minU = 0, maxU = 1, minV = 0, maxV = 1;

  if (videoAspect > canvasAspect) {
    // 映像が横長 → 左右をカット
    const scale = canvasAspect / videoAspect;
    const offset = (1 - scale) / 2;
    minU = offset;
    maxU = 1 - offset;
  } else {
    // 映像が縦長 → 上下をカット
    const scale = videoAspect / canvasAspect;
    const offset = (1 - scale) / 2;
    minV = offset;
    maxV = 1 - offset;
  }

  // 追加クロップ（cover後の表示範囲をさらに絞る）
  const uRange = maxU - minU;
  const vRange = maxV - minV;
  minU += uRange * EXTRA_CROP;
  maxU -= uRange * EXTRA_CROP;
  minV += vRange * EXTRA_CROP;
  maxV -= vRange * EXTRA_CROP;

  return { minU, maxU, minV, maxV };
}

export function setupFullscreenQuad(
  gl: WebGLRenderingContext,
  program: WebGLProgram
) {
  const positions = new Float32Array([
    -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
  ]);

  const posBuf = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  // テクスチャ座標は動的に更新するのでバッファだけ確保
  const texBuf = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, texBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(12), gl.DYNAMIC_DRAW);
  const aTex = gl.getAttribLocation(program, "a_texCoord");
  gl.enableVertexAttribArray(aTex);
  gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 0, 0);

  return texBuf;
}

// 映像サイズが判明してからテクスチャ座標を更新
export function updateTexCoords(
  gl: WebGLRenderingContext,
  texBuf: WebGLBuffer,
  videoW: number,
  videoH: number,
  canvasW: number,
  canvasH: number
) {
  const { minU, maxU, minV, maxV } = coverUV(videoW, videoH, canvasW, canvasH);
  const coords = new Float32Array([
    minU, maxV, maxU, maxV, minU, minV,
    minU, minV, maxU, maxV, maxU, minV,
  ]);
  gl.bindBuffer(gl.ARRAY_BUFFER, texBuf);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, coords);
}

export function createVideoTexture(gl: WebGLRenderingContext): WebGLTexture {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return tex;
}

export function updateTextureFromVideo(
  gl: WebGLRenderingContext,
  texture: WebGLTexture,
  video: HTMLVideoElement
) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
}

// Canvas 2Dでのcover描画（FlashMode用）
export function drawCoveredVideo(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  canvasW: number,
  canvasH: number
) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (vw === 0 || vh === 0) return;

  const { minU, maxU, minV, maxV } = coverUV(vw, vh, canvasW, canvasH);
  const sx = vw * minU;
  const sy = vh * minV;
  const sw = vw * (maxU - minU);
  const sh = vh * (maxV - minV);

  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvasW, canvasH);
}
