from pathlib import Path
from math import cos, pi, sin

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).parent
SPRITES = ROOT / "sprites"
PREVIEWS = ROOT / "previews"
PREVIEWS.mkdir(exist_ok=True)
RUNTIME = ROOT.parents[2] / "public" / "assets" / "decor-v2"

ASSETS = [
    ("MUSHROOM + MOSS", "meadow-mushroom-colony-v1.png"),
    ("NATURAL BEDROCK", "natural-bedrock-v1.png"),
    ("FERN + MOSS", "fern-moss-floor-v1.png"),
    ("DRY GRASS + STONES", "dry-grass-fieldstones-v1.png"),
]

RUNTIME_NAMES = {
    "meadow-mushroom-colony-v1.png": "lowland-mushroom-colony.webp",
    "natural-bedrock-v1.png": "lowland-natural-bedrock.webp",
    "fern-moss-floor-v1.png": "lowland-fern-moss.webp",
    "dry-grass-fieldstones-v1.png": "lowland-dry-grass-stones.webp",
}

BG = "#101815"
TILE = "#e9dcb7"
EDGE = "#aa955f"
INK = "#13272d"
MUTED = "#cbd3cc"
ACCENT = "#ffbd64"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    roots = [
        Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    ]
    for path in roots:
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def hex_points(cx: float, cy: float, radius: float) -> list[tuple[float, float]]:
    return [
        (cx + radius * cos(-pi / 2 + i * pi / 3), cy + radius * sin(-pi / 2 + i * pi / 3))
        for i in range(6)
    ]


def trimmed(path: Path) -> Image.Image:
    image = Image.open(path).convert("RGBA")
    bbox = image.getchannel("A").getbbox()
    return image.crop(bbox) if bbox else image


def draw_hex(canvas: Image.Image, cx: int, cy: int, radius: int, sprite: Image.Image, value: str = "7") -> None:
    draw = ImageDraw.Draw(canvas)
    points = hex_points(cx, cy, radius)
    draw.polygon(points, fill=TILE)

    # 85% of the pointy-top hex width: broad enough to read as field dressing,
    # while keeping a deliberate border and neighbour separation.
    target_width = max(1, round(radius * 1.47))
    target_height = max(1, round(sprite.height * target_width / sprite.width))
    max_height = round(radius * 1.12)
    if target_height > max_height:
        target_height = max_height
        target_width = max(1, round(sprite.width * target_height / sprite.height))
    scaled = sprite.resize((target_width, target_height), Image.Resampling.LANCZOS)
    canvas.alpha_composite(scaled, (round(cx - target_width / 2), round(cy - target_height / 2 + radius * .11)))

    draw.line(points + [points[0]], fill=EDGE, width=max(1, round(radius * .035)), joint="curve")
    value_font = font(max(10, round(radius * .33)), bold=True)
    box = draw.textbbox((0, 0), value, font=value_font)
    draw.text((cx - (box[2] - box[0]) / 2, cy - (box[3] - box[1]) / 2 - box[1]), value, fill=INK, font=value_font)


sprites = [(label, trimmed(SPRITES / filename)) for label, filename in ASSETS]

# Export the approved transparent cut-outs without changing their proportions.
RUNTIME.mkdir(parents=True, exist_ok=True)
for _, filename in ASSETS:
    sprite = trimmed(SPRITES / filename)
    if sprite.width > 512:
        height = round(sprite.height * 512 / sprite.width)
        sprite = sprite.resize((512, height), Image.Resampling.LANCZOS)
    sprite.save(RUNTIME / RUNTIME_NAMES[filename], "WEBP", quality=88, method=6)

# Enlarged evaluation sheet with the real draw ratio and number priority.
sheet = Image.new("RGBA", (1480, 570), BG)
draw = ImageDraw.Draw(sheet)
draw.text((44, 30), "RUIN REPLACEMENT CANDIDATES", fill=ACCENT, font=font(35, True))
draw.text((44, 78), "Broad 85% interior coverage · number and hex edge rendered above the asset", fill=MUTED, font=font(19))
centers = [190, 555, 920, 1285]
for (label, sprite), cx in zip(sprites, centers):
    draw_hex(sheet, cx, 285, 142, sprite, "7")
    box = draw.textbbox((0, 0), label, font=font(18, True))
    draw.text((cx - (box[2] - box[0]) / 2, 460), label, fill="#edf1ec", font=font(18, True))
    draw.text((cx - 71, 492), "mobile-safe crop test", fill=MUTED, font=font(14))
sheet.convert("RGB").save(PREVIEWS / "hex-coverage-comparison.jpg", quality=94)

# Exact 31 px mobile radius, repeated like a real map fragment.
mobile = Image.new("RGBA", (780, 460), "#cfdcb9")
draw = ImageDraw.Draw(mobile)
radius = 31
dx = 54
dy = 47
origin_x = 45
origin_y = 48
for row in range(8):
    for col in range(14):
        cx = origin_x + col * dx + (row % 2) * (dx // 2)
        cy = origin_y + row * dy
        label, sprite = sprites[(row * 3 + col) % len(sprites)]
        draw_hex(mobile, cx, cy, radius, sprite, str(2 + ((row * 7 + col * 3) % 10)))
mobile.convert("RGB").save(PREVIEWS / "mobile-map-density-test.jpg", quality=95)

print(PREVIEWS / "hex-coverage-comparison.jpg")
print(PREVIEWS / "mobile-map-density-test.jpg")
