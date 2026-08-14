from pathlib import Path
from math import cos, pi, sin

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).parent
SHEET_DIR = ROOT / "sheets"
SPRITE_DIR = ROOT / "sprites"
PREVIEW_DIR = ROOT / "previews"
WEB_DIR = ROOT.parents[2] / "public" / "assets" / "decor-p1"

FAMILIES = {
    "mountains": ["rock-outcrop", "highland-ridge", "snow-peaks", "scree-cluster"],
    "ruins": ["collapsed-corner", "cracked-paving", "parallel-rubble", "broken-foundation"],
    "marsh": ["cattails", "sedge", "lily-leaves", "reeds-stones"],
    "snow": ["snow-conifer", "snow-bush", "snow-rocks", "snowdrift"],
}

DISPLAY_SCALE = {"mountains": 0.78, "ruins": 0.68, "marsh": 0.62, "snow": 0.68}


def font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    name = "arialbd.ttf" if bold else "arial.ttf"
    try:
        return ImageFont.truetype(name, size)
    except OSError:
        return ImageFont.load_default()


def trim_with_padding(image: Image.Image, padding: int = 12) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value > 8 else 0).getbbox()
    if bbox is None:
        raise ValueError("Candidate quadrant contains no visible pixels")
    left, top, right, bottom = bbox
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(image.width, right + padding)
    bottom = min(image.height, bottom + padding)
    return image.crop((left, top, right, bottom))


def split_sheets() -> None:
    SPRITE_DIR.mkdir(parents=True, exist_ok=True)
    for family, names in FAMILIES.items():
        sheet = Image.open(SHEET_DIR / f"{family}-alpha.png").convert("RGBA")
        half_x, half_y = sheet.width // 2, sheet.height // 2
        boxes = [
            (0, 0, half_x, half_y),
            (half_x, 0, sheet.width, half_y),
            (0, half_y, half_x, sheet.height),
            (half_x, half_y, sheet.width, sheet.height),
        ]
        for name, box in zip(names, boxes, strict=True):
            trim_with_padding(sheet.crop(box)).save(SPRITE_DIR / f"{family}-{name}.png", optimize=True)


def pointy_hex(center_x: int, center_y: int, radius: int) -> list[tuple[float, float]]:
    return [
        (center_x + radius * cos((60 * index - 90) * pi / 180), center_y + radius * sin((60 * index - 90) * pi / 180))
        for index in range(6)
    ]


def make_preview() -> None:
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    width, height = 1480, 1160
    preview = Image.new("RGBA", (width, height), "#101614")
    draw = ImageDraw.Draw(preview)
    title_font, family_font, label_font = font(34, True), font(20, True), font(16)
    draw.text((54, 34), "HEXFRONT · DECOR CANDIDATES P1", font=title_font, fill="#f3b35b")
    draw.text((54, 78), "Isolated review only · not connected to the game renderer", font=label_font, fill="#b8c5bb")
    columns = [205, 555, 905, 1255]
    rows = [220, 495, 770, 1045]
    for row, (family, names) in enumerate(FAMILIES.items()):
        draw.text((54, rows[row] - 112), family.upper(), font=family_font, fill="#d9e4d4")
        for column, name in enumerate(names):
            x, y = columns[column], rows[row]
            points = pointy_hex(x, y, 105)
            draw.polygon(points, fill="#d4e3bf", outline="#91ab83", width=3)
            sprite = Image.open(SPRITE_DIR / f"{family}-{name}.png").convert("RGBA")
            safe_width = int(170 * DISPLAY_SCALE[family])
            safe_height = int(150 * DISPLAY_SCALE[family])
            ratio = min(safe_width / sprite.width, safe_height / sprite.height)
            shown = sprite.resize((max(1, int(sprite.width * ratio)), max(1, int(sprite.height * ratio))), Image.Resampling.LANCZOS)
            preview.alpha_composite(shown, (x - shown.width // 2, y - shown.height // 2 + 6))
            label = name.replace("-", " ")
            bounds = draw.textbbox((0, 0), label, font=label_font)
            draw.text((x - (bounds[2] - bounds[0]) / 2, y + 118), label, font=label_font, fill="#e8eee5")
    preview.save(PREVIEW_DIR / "candidate-grid.png", optimize=True)

    compact = Image.new("RGBA", (920, 720), "#101614")
    compact_draw = ImageDraw.Draw(compact)
    compact_draw.text((32, 22), "GAME-SCALE CHECK · 48 PX HEX RADIUS", font=font(24, True), fill="#f3b35b")
    compact_columns = [150, 355, 560, 765]
    compact_rows = [135, 300, 465, 630]
    for row, (family, names) in enumerate(FAMILIES.items()):
        compact_draw.text((28, compact_rows[row] - 70), family.upper(), font=font(14, True), fill="#d9e4d4")
        for column, name in enumerate(names):
            x, y = compact_columns[column], compact_rows[row]
            compact_draw.polygon(pointy_hex(x, y, 48), fill="#d4e3bf", outline="#91ab83", width=2)
            sprite = Image.open(SPRITE_DIR / f"{family}-{name}.png").convert("RGBA")
            safe_width = int(78 * DISPLAY_SCALE[family])
            safe_height = int(68 * DISPLAY_SCALE[family])
            ratio = min(safe_width / sprite.width, safe_height / sprite.height)
            shown = sprite.resize((max(1, int(sprite.width * ratio)), max(1, int(sprite.height * ratio))), Image.Resampling.LANCZOS)
            compact.alpha_composite(shown, (x - shown.width // 2, y - shown.height // 2 + 3))
            compact_draw.text((x - 14, y + 53), f"{row + 1}.{column + 1}", font=font(12, True), fill="#e8eee5")
    compact.save(PREVIEW_DIR / "game-scale-grid.png", optimize=True)


def validate_sprites() -> None:
    print("file,width,height,corner_alpha,magenta_spill")
    for path in sorted(SPRITE_DIR.glob("*.png")):
        image = Image.open(path).convert("RGBA")
        corners = [(0, 0), (image.width - 1, 0), (0, image.height - 1), (image.width - 1, image.height - 1)]
        corner_alpha = max(image.getpixel(point)[3] for point in corners)
        magenta_spill = sum(1 for red, green, blue, alpha in image.getdata() if alpha > 32 and red > 180 and blue > 150 and green < 100)
        print(f"{path.name},{image.width},{image.height},{corner_alpha},{magenta_spill}")


def export_test_assets() -> None:
    WEB_DIR.mkdir(parents=True, exist_ok=True)
    for path in SPRITE_DIR.glob("*.png"):
        image = Image.open(path).convert("RGBA")
        image.save(WEB_DIR / f"{path.stem}.webp", "WEBP", quality=88, method=6)


if __name__ == "__main__":
    split_sheets()
    make_preview()
    validate_sprites()
    export_test_assets()
