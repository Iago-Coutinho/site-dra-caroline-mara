"""Gera versões web das imagens originais (sem cortes): redimensiona pelo lado maior,
salva JPEG + WebP. Uso: uv run --with pillow python tools/optimize_images.py"""
from pathlib import Path
from PIL import Image, ImageOps
try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:
    pass

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "originais"
DST = ROOT / "assets" / "img"

# lado maior em px por pasta
LIMITS = {"estetica": 1400, "harmonizacao": 1400, "reabilitacao": 1400,
          "dra-caroline": 1800, "enderecos": 1600}

def process(path: Path, limit: int, out_dir: Path):
    im = Image.open(path)
    im = ImageOps.exif_transpose(im)
    if im.mode in ("RGBA", "P", "LA"):
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im.convert("RGBA"), mask=im.convert("RGBA").split()[-1])
        im = bg
    elif im.mode != "RGB":
        im = im.convert("RGB")
    w, h = im.size
    scale = min(1.0, limit / max(w, h))
    if scale < 1.0:
        im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    stem = path.stem.replace("-print-instagram", "").replace("-nao-usar", "")
    out_dir.mkdir(parents=True, exist_ok=True)
    jpg = out_dir / f"{stem}.jpg"
    webp = out_dir / f"{stem}.webp"
    im.save(jpg, "JPEG", quality=82, optimize=True, progressive=True)
    im.save(webp, "WEBP", quality=80, method=6)
    print(f"{path.name:45s} -> {im.size[0]}x{im.size[1]}  {jpg.stat().st_size//1024:4d} KB jpg  {webp.stat().st_size//1024:4d} KB webp")

for folder, limit in LIMITS.items():
    for p in sorted((SRC / folder).iterdir()):
        if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp", ".heic"):
            try:
                process(p, limit, DST / folder)
            except Exception as e:  # noqa: BLE001
                print(f"{p.name:45s} -> PULADO ({type(e).__name__})")
