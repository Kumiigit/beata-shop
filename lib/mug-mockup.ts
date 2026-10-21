// Reused from the user's Editorium studio: cylindrical projection, ceramic lighting and alpha.
type ProductId = string;
type SurfaceId = 'front' | 'back';
const mockupDimensions = (_productId: string, preview: boolean) => ({ width: preview ? 720 : 1254, height: preview ? 720 : 1254 });
const photoRegion = (_productId: string, _width: number, _height: number, _surface: string) => ({ x: .145, y: .237, width: .54, height: .646 });
const tshirtReferenceVariant = (_color: string) => false;

type Args = { artwork: HTMLCanvasElement | null; leftSleeve?: HTMLCanvasElement | null; rightSleeve?: HTMLCanvasElement | null; asset: string; color: string; productId: ProductId; surface: SurfaceId; bodyWidthCm: number; bodyHeightCm: number; preview?: boolean };
const photoCache = new Map<string, Promise<HTMLImageElement>>();
function loadImage(url: string): Promise<HTMLImageElement> {
  if (photoCache.has(url)) return photoCache.get(url)!;
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
  photoCache.set(url, promise);
  promise.catch(() => photoCache.delete(url));
  return promise;
}
function rgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [parseInt(value.slice(0, 2), 16) / 255, parseInt(value.slice(2, 4), 16) / 255, parseInt(value.slice(4, 6), 16) / 255];
}
function shader(gl: WebGLRenderingContext, type: number, source: string) {
  const result = gl.createShader(type);
  if (!result) throw new Error("WebGL shader unavailable");
  gl.shaderSource(result, source);
  gl.compileShader(result);
  if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(result) || "Shader compilation failed");
  return result;
}
async function renderMockup({ artwork, leftSleeve, rightSleeve, asset, color, productId, surface, bodyWidthCm, bodyHeightCm, preview = false }: Args): Promise<HTMLCanvasElement> {
  const isReferenceShirt = productId === "tshirt";
  const isBlackHoodiePhoto = productId === "hoodie" && color.toLowerCase() === "#1b1c1f";
  const shirtSide = surface === "back" ? "back" : "front";
  const [photo, shirtMask, whiteLighting, mugMaterialMask] = await Promise.all([
    loadImage(asset),
    loadImage(isReferenceShirt ? `/products/tshirt-${shirtSide}-mask-v2.png` : asset),
    loadImage(isReferenceShirt ? `/products/tshirt-${shirtSide}-white-v2.png` : asset),
    productId === "mug" ? loadImage("/products/plain-mug/editorium-material-mask.svg") : null,
  ]);
  const output = document.createElement("canvas");
  const dimensions = mockupDimensions(productId, preview);
  output.width = dimensions.width;
  output.height = dimensions.height;
  const gl = output.getContext("webgl", { alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
  if (!gl) throw new Error("WebGL is unavailable");
  const vertex = shader(gl, gl.VERTEX_SHADER, `
    attribute vec2 position;
    varying vec2 uv;
    void main() {
      uv = vec2((position.x + 1.0) * 0.5, (1.0 - position.y) * 0.5);
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `);
  const fragment = shader(gl, gl.FRAGMENT_SHADER, `
    precision highp float;
    varying vec2 uv;
    uniform sampler2D photo;
    uniform sampler2D art;
    uniform sampler2D leftSleeveArt;
    uniform sampler2D rightSleeveArt;
    uniform sampler2D shirtMask;
    uniform sampler2D whiteLighting;
    uniform sampler2D mugMaterialMask;
    uniform vec3 garmentColor;
    uniform vec4 artRegion;
    uniform float projection;
    uniform float hoodOcclusion;
    uniform float showSleeves;
    uniform float referenceShirt;
    uniform float exactPhotoColor;
    uniform float blackHoodiePhoto;
    uniform float fabricWarp;
    uniform float transparentShirtBackground;
    uniform float mugFront;
    uniform float cap;
    uniform float handbag;
    void main() {
      vec2 photoUv = mugFront > 0.5 ? vec2(1.0 - uv.x, uv.y) : uv;
      vec4 base = texture2D(photo, photoUv);
      if (base.a < 0.02) discard;
      float luminosity = dot(base.rgb, vec3(0.3, 0.59, 0.11));
      float shirtCoverage = referenceShirt > 0.5 ? texture2D(shirtMask, uv).a : base.a;
      float whiteLuminosity = dot(texture2D(whiteLighting, uv).rgb, vec3(0.3, 0.59, 0.11));
      vec3 tinted = garmentColor * (0.55 + luminosity * 0.5);
      if (distance(garmentColor, vec3(0.956)) < 0.08) tinted = base.rgb;
      if (blackHoodiePhoto > 0.5) tinted = base.rgb;
      if (cap > 0.5) tinted = garmentColor * clamp(luminosity / 0.94, 0.25, 1.08);
      // Cyan in the reference assets identifies only the straps and base band.
      float trim = smoothstep(0.08, 0.30, min(base.g, base.b) - base.r);
      if (handbag > 0.5) tinted = mix(base.rgb, garmentColor * clamp(max(base.g, base.b) / 0.82, 0.25, 1.15), trim);
      if (projection > 0.5 && projection < 1.5) {
        // Photo-registered material contours keep colour off the white lip and
        // body. Separate diffuse lighting from the ceramic's white reflections.
        tinted = base.rgb;
        vec3 materials = texture2D(mugMaterialMask, photoUv).rgb;
        // The source photo contains a hard rectangular softbox reflection on
        // the body. Use continuous cylinder lighting across the ceramic so it
        // cannot resemble a print-area overlay, even with no artwork loaded.
        float bodyX = (photoUv.x - 0.425) / 0.277;
        float bodyArc = sqrt(max(0.0, 1.0 - bodyX * bodyX));
        float lipY = 0.203 + 0.040 * bodyArc;
        float baseY = 0.811 + 0.083 * bodyArc;
        float bodyMask = smoothstep(lipY + 0.002, lipY + 0.016, photoUv.y)
          * (1.0 - smoothstep(baseY - 0.016, baseY, photoUv.y))
          * smoothstep(0.0, 0.045, 1.0 - abs(bodyX))
          * (1.0 - max(materials.r, materials.g));
        float ceramicLight = 0.915 + 0.045 * cos((bodyX + 0.18) * 1.5707963)
          - 0.055 * pow(min(abs(bodyX), 1.0), 8.0)
          - 0.035 * smoothstep(0.74, 0.90, photoUv.y);
        tinted = mix(base.rgb, vec3(ceramicLight) * vec3(1.0, 0.998, 0.995), bodyMask);
        float glaze = distance(garmentColor, vec3(0.956)) < 0.08 ? 0.0 : max(materials.r, materials.g);
        float diffuse = pow(clamp(luminosity / 0.94, 0.0, 1.0), 2.2);
        float reflection = smoothstep(0.89, 0.995, luminosity) * 0.24;
        vec3 pigment = pow(garmentColor, vec3(2.2));
        vec3 glazed = pow(pigment * diffuse * (1.0 - reflection) + vec3(reflection), vec3(1.0 / 2.2));
        tinted = mix(tinted, glazed, glaze);
      }
      if (referenceShirt > 0.5) {
        tinted = base.rgb;
        if (exactPhotoColor < 0.5) {
          vec3 recolored = garmentColor * clamp(whiteLuminosity / 0.96, 0.62, 1.12);
          tinted = mix(base.rgb, recolored, shirtCoverage);
        }
      }
      vec2 p = (uv - artRegion.xy) / artRegion.zw;
      vec2 flatPosition = p;
      float mugInkCoverage = 1.0;
      float mugReflection = 0.0;
      if (cap > 0.5) {
        // A gentle crown curve, confined to the front print panel.
        p.y -= 0.045 * pow((p.x - 0.5) * 2.0, 2.0);
      } else if (projection < 0.5) {
        p.x += sin(p.y * 15.0 + p.x * 8.0) * fabricWarp;
        p.y += sin(p.x * 19.0) * fabricWarp * 0.5;
      } else if (projection < 1.5) {
        float curve = (uv.x - (mugFront > 0.5 ? 0.575 : 0.425)) / 0.277;
        float arc = sqrt(max(0.0, 1.0 - curve * curve));
        float surfaceTop = 0.203 + 0.040 * arc;
        float surfaceBottom = 0.811 + 0.083 * arc;
        // Follow both elliptical edges of the photographed cylinder. A full
        // image must bend with the mug instead of filling a screen rectangle.
        p.y = (uv.y - surfaceTop) / (surfaceBottom - surfaceTop);
        flatPosition = vec2((curve + 1.0) * 0.5, p.y);
        // The texture is the full editor circumference, including its blank
        // handle margins. Front reads the first half; back reads the second.
        // Never wrap the end back to the beginning within a single view.
        float sideCentre = mugFront > 0.5 ? 0.25 : 0.75;
        p.x = sideCentre + asin(clamp(curve, -1.0, 1.0)) / 6.28318530718;
        vec3 materials = texture2D(mugMaterialMask, photoUv).rgb;
        mugInkCoverage = materials.b * (1.0 - max(materials.r, materials.g));
        float physicalX = (photoUv.x - 0.425) / 0.277;
        mugReflection = 0.045 * pow(min(abs(physicalX), 1.0), 8.0)
          + 0.028 * exp(-pow((physicalX + 0.62) / 0.20, 2.0));
      } else {
        p.x += sin(p.y * 10.0) * 0.004;
      }
      vec4 ink = vec4(0.0);
      if (flatPosition.x >= 0.0 && flatPosition.x <= 1.0 && flatPosition.y >= 0.0 && flatPosition.y <= 1.0 && p.x >= 0.0 && p.x <= 1.0 && p.y >= 0.0 && p.y <= 1.0) {
        ink = texture2D(art, p);
      }
      if (projection > 0.5 && projection < 1.5) ink *= mugInkCoverage;
      if (referenceShirt > 0.5) ink.a *= shirtCoverage;
      if (handbag > 0.5) ink.a *= 1.0 - trim;
      if (hoodOcclusion > 0.5) {
        // The back hood hangs over the print. Retain the original photo there.
        float fromCentre = abs(uv.x - 0.5);
        float hoodEdge = 0.30 - 0.14 * pow(clamp(fromCentre / 0.20, 0.0, 1.0), 1.6);
        float hoodMask = (1.0 - smoothstep(hoodEdge - 0.004, hoodEdge + 0.004, uv.y))
          * (1.0 - smoothstep(0.195, 0.21, fromCentre));
        ink.a *= 1.0 - hoodMask;
      }
      float shade = blackHoodiePhoto > 0.5 ? 1.0 : referenceShirt > 0.5 ? clamp(whiteLuminosity / 0.96, 0.65, 1.08) : clamp(luminosity, 0.4, 1.0);
      vec3 composited = mix(tinted, ink.rgb * shade, ink.a);
      // On white ceramic, unprinted white in an uploaded image must match the
      // underlying photo exactly, without exposing a rectangular shaded patch.
      if (projection > 0.5 && projection < 1.5) composited = tinted * (vec3(1.0) - (vec3(ink.a) - ink.rgb) * (1.0 - mugReflection));
      if (showSleeves > 0.5) {
        // Each flat sleeve document wraps around the arm: one half faces the
        // front photo, and the other half faces the back photo.
        float sy = (uv.y - 0.285) / 0.565;
        if (sy >= 0.0 && sy <= 1.0) {
          float leftCentre = 0.185 - sy * 0.035;
          float rightCentre = 1.0 - leftCentre;
          float halfWidth = mix(0.073, 0.056, sy);
          float dl = (uv.x - leftCentre) / halfWidth;
          float dr = (uv.x - rightCentre) / halfWidth;
          float softL = 1.0 - smoothstep(0.77, 1.0, abs(dl));
          float softR = 1.0 - smoothstep(0.77, 1.0, abs(dr));
          float taper = smoothstep(0.0, 0.08, sy) * (1.0 - smoothstep(0.89, 1.0, sy));
          float frontView = 1.0 - hoodOcclusion;
          // Wearer left is viewer right in front view, viewer left in back view.
          float leftU = frontView > 0.5 ? 0.5 + (1.0 - dr) * 0.25 : 0.5 - (dl + 1.0) * 0.25;
          float rightU = frontView > 0.5 ? 0.5 - (dl + 1.0) * 0.25 : 0.5 + (1.0 - dr) * 0.25;
          vec4 sleeveL = texture2D(leftSleeveArt, vec2(clamp(leftU, 0.0, 1.0), sy));
          vec4 sleeveR = texture2D(rightSleeveArt, vec2(clamp(rightU, 0.0, 1.0), sy));
          float leftMask = frontView > 0.5 ? softR : softL;
          float rightMask = frontView > 0.5 ? softL : softR;
          composited = mix(composited, sleeveL.rgb * shade, sleeveL.a * leftMask * taper);
          composited = mix(composited, sleeveR.rgb * shade, sleeveR.a * rightMask * taper);
        }
      }
      // Reference shirt photos include an opaque studio backdrop. Only the
      // exported mockup uses the shirt silhouette as its alpha channel.
      float outputAlpha = transparentShirtBackground > 0.5 ? shirtCoverage : base.a;
      if (projection > 0.5 && projection < 1.5) outputAlpha *= texture2D(mugMaterialMask, photoUv).b;
      gl_FragColor = vec4(composited, outputAlpha);
    }
  `);
  const program = gl.createProgram();
  if (!program) throw new Error("WebGL program unavailable");
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "WebGL link failed");
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const bind = (unit: number, source: TexImageSource) => {
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    // Filter mug artwork in premultiplied alpha so transparent pixels cannot
    // introduce dark outlines around otherwise invisible white backgrounds.
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, productId === "mug" && unit === 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  };
  const empty = document.createElement("canvas");
  empty.width = empty.height = 1;
  bind(0, photo);
  bind(1, productId === "cap" && surface !== "front" ? empty : artwork ?? empty);
  bind(2, leftSleeve ?? empty);
  bind(3, rightSleeve ?? empty);
  bind(4, shirtMask);
  bind(5, whiteLighting);
  bind(6, mugMaterialMask ?? empty);
  gl.uniform1i(gl.getUniformLocation(program, "photo"), 0);
  gl.uniform1i(gl.getUniformLocation(program, "art"), 1);
  gl.uniform1i(gl.getUniformLocation(program, "leftSleeveArt"), 2);
  gl.uniform1i(gl.getUniformLocation(program, "rightSleeveArt"), 3);
  gl.uniform1i(gl.getUniformLocation(program, "shirtMask"), 4);
  gl.uniform1i(gl.getUniformLocation(program, "whiteLighting"), 5);
  gl.uniform1i(gl.getUniformLocation(program, "mugMaterialMask"), 6);
  gl.uniform3fv(gl.getUniformLocation(program, "garmentColor"), rgb(color));
  const region = photoRegion(productId, bodyWidthCm, bodyHeightCm, surface);
  const mugFront = productId === "mug" && surface !== "back";
  gl.uniform4fv(gl.getUniformLocation(program, "artRegion"), [mugFront ? 1 - region.x - region.width : region.x, region.y, region.width, region.height]);
  gl.uniform1f(gl.getUniformLocation(program, "mugFront"), mugFront ? 1 : 0);
  gl.uniform1f(gl.getUniformLocation(program, "cap"), productId === "cap" ? 1 : 0);
  gl.uniform1f(gl.getUniformLocation(program, "handbag"), productId === "handbag" ? 1 : 0);
  gl.uniform1f(gl.getUniformLocation(program, "hoodOcclusion"), productId === "hoodie" && surface === "back" ? 1 : 0);
  gl.uniform1f(gl.getUniformLocation(program, "showSleeves"), productId === "hoodie" ? 1 : 0);
  gl.uniform1f(gl.getUniformLocation(program, "referenceShirt"), isReferenceShirt ? 1 : 0);
  gl.uniform1f(gl.getUniformLocation(program, "exactPhotoColor"), isReferenceShirt && tshirtReferenceVariant(color) ? 1 : 0);
  gl.uniform1f(gl.getUniformLocation(program, "blackHoodiePhoto"), isBlackHoodiePhoto ? 1 : 0);
  gl.uniform1f(gl.getUniformLocation(program, "fabricWarp"), productId === "hoodie" ? 0.0015 : 0.008);
  gl.uniform1f(gl.getUniformLocation(program, "transparentShirtBackground"), isReferenceShirt && !preview ? 1 : 0);
  gl.uniform1f(gl.getUniformLocation(program, "projection"), productId === "mug" ? 1 : productId === "pillow" ? 2 : 0);
  gl.viewport(0, 0, output.width, output.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  const raster = document.createElement('canvas');
  raster.width = output.width; raster.height = output.height;
  const context = raster.getContext('2d');
  if (!context) throw new Error('Canvas unavailable');
  context.drawImage(output, 0, 0);
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return raster;
}


export function renderMugMockup(artwork: HTMLCanvasElement, color: string, surface: SurfaceId) {
  return renderMockup({ artwork, color, surface, asset: '/products/plain-mug/editorium-base.webp', productId: 'mug', bodyWidthCm: 25.9, bodyHeightCm: 9.6, preview: true });
}
