from math import cos, pi, sin
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).parent
SPRITE_DIR = ROOT / "sprites"
PREVIEW_DIR = ROOT / "previews"
P1_DIR = ROOT.parent / "decor-p1" / "sprites"

ASSETS = {
    "MOUNTAIN": ("mountains-highland-ridge.png", "mountains-highland-ridge-v2.png"),
    "PAVING": ("ruins-cracked-paving.png", "ruins-cracked-paving-v2.png"),
    "MARSH": ("marsh-reeds-stones.png", "marsh-reeds-stones-v2.png"),
    "SNOW": ("snow-snow-rocks.png", "snow-snow-rocks-v2.png"),
}

SAFE_BOX = {
    "MOUNTAIN": (1.46, 1.10),
    "PAVING": (1.42, 0.96),
    "MARSH": (1.08, 1.22),
    "SNOW": (1.34, 1.00),
}


def font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    name = "arialbd.ttf" if bold else "arial.ttf"
    try:
        return ImageFont.truetype(name, size)
    except OSError:
        return ImageFont.load_default()


def trim_with_padding(image: Image.Image, padding: int = 18) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value > 8 else 0).getbbox()
    if bbox is None:
        raise ValueError("Candidate contains no visible pixels")
    left, top, right, bottom = bbox
    return image.crop(
        (
            max(0, left - padding),
            max(0, top - padding),
            min(image.width, right + padding),
            min(image.height, bottom + padding),
        )
    )


def trim_sprites() -> None:
    for path in SPRITE_DIR.glob("*.png"):
        image = Image.open(path).convert("RGBA")
        trim_with_padding(image).save(path, optimize=True)


def pointy_hex(center_x: int, center_y: int, radius: int) -> list[tuple[float, float]]:
    return [
        (
            center_x + radius * cos((60 * index - 90) * pi / 180),
            center_y + radius * sin((60 * index - 90) * pi / 180),
        )
        for index in range(6)
    ]


def draw_hex(draw: ImageDraw.ImageDraw, x: int, y: int, radius: int) -> None:
    draw.polygon(
        pointy_hex(x, y, radius),
        fill="#d4e3bf",
        outline="#91ab83",
        width=max(1, radius // 28 + 1),
    )


def place_sprite(
    canvas: Image.Image,
    sprite_path: Path,
    family: str,
    x: int,
    y: int,
    radius: int,
) -> None:
    sprite = Image.open(sprite_path).convert("RGBA")
    width_ratio, height_ratio = SAFE_BOX[family]
    max_width = radius * width_ratio
    max_height = radius * height_ratio
    ratio = min(max_width / sprite.width, max_height / sprite.height)
    shown = sprite.resize(
        (max(1, round(sprite.width * ratio)), max(1, round(sprite.height * ratio))),
        Image.Resampling.LANCZOS,
    )
    canvas.alpha_composite(shown, (x - shown.width // 2, y - shown.height // 2 + radius // 12))


def draw_label_centered(
    draw: ImageDraw.ImageDraw,
    x: int,
    y: int,
    label: str,
    label_font: ImageFont.ImageFont,
    color: str = "#e8eee5",
) -> None:
    bounds = draw.textbbox((0, 0), label, font=label_font)
    draw.text((x - (bounds[2] - bounds[0]) / 2, y), label, font=label_font, fill=color)


def make_candidate_grid() -> None:
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    canvas = Image.new("RGBA", (1440, 720), "#101614")
    draw = ImageDraw.Draw(canvas)
    draw.text((52, 32), "HEXFRONT - SIMPLIFIED DECOR V2", font=font(34, True), fill="#f3b35b")
    draw.text((52, 78), "P1 reference above, simplified V2 candidate below - review only", font=font(17), fill="#b8c5bb")

    columns = [210, 550, 890, 1230]
    for column, (family, (p1_name, v2_name)) in zip(columns, ASSETS.items(), strict=True):
        draw_label_centered(draw, column, 122, family, font(18, True), "#d9e4d4")
        for row_y, sprite_path, version in (
            (280, P1_DIR / p1_name, "P1"),
            (535, SPRITE_DIR / v2_name, "V2"),
        ):
            draw_hex(draw, column, row_y, 108)
            place_sprite(canvas, sprite_path, family, column, row_y, 108)
            draw_label_centered(draw, column, row_y + 122, version, font(15, True), "#aebdb2")

    canvas.save(PREVIEW_DIR / "candidate-grid.png", optimize=True)


def make_game_scale_comparison() -> None:
    canvas = Image.new("RGBA", (1440, 620), "#101614")
    draw = ImageDraw.Draw(canvas)
    draw.text((52, 28), "GAME-SCALE CHECK - DESKTOP AND PORTRAIT MOBILE", font=font(30, True), fill="#f3b35b")
    draw.text((52, 70), "Same placement limits for P1 and V2; no renderer integration", font=font(16), fill="#b8c5bb")

    columns = [220, 560, 900, 1240]
    rows = [220, 465]
    for column, (family, (p1_name, v2_name)) in zip(columns, ASSETS.items(), strict=True):
        draw_label_centered(draw, column, 110, family, font(17, True), "#d9e4d4")
        for row_y, radius, scale_label in ((rows[0], 48, "48 px"), (rows[1], 31, "31 px")):
            left_x, right_x = column - 62, column + 62
            for x, sprite_path, version in (
                (left_x, P1_DIR / p1_name, "P1"),
                (right_x, SPRITE_DIR / v2_name, "V2"),
            ):
                draw_hex(draw, x, row_y, radius)
                place_sprite(canvas, sprite_path, family, x, row_y, radius)
                draw_label_centered(draw, x, row_y + radius + 18, version, font(12, True), "#aebdb2")
            draw_label_centered(draw, column, row_y - radius - 30, scale_label, font(13), "#88998d")

    canvas.save(PREVIEW_DIR / "game-scale-comparison.png", optimize=True)


def validate_sprites() -> None:
    print("file,width,height,corner_alpha,magenta_spill,visible_coverage")
    for path in sorted(SPRITE_DIR.glob("*.png")):
        image = Image.open(path).convert("RGBA")
        corners = [
            (0, 0),
            (image.width - 1, 0),
            (0, image.height - 1),
            (image.width - 1, image.height - 1),
        ]
        corner_alpha = max(image.getpixel(point)[3] for point in corners)
        pixels = list(image.getdata())
        magenta_spill = sum(
            1
            for red, green, blue, alpha in pixels
            if alpha > 32 and red > 180 and blue > 150 and green < 100
        )
        visible = sum(1 for _, _, _, alpha in pixels if alpha > 8)
        coverage = visible / len(pixels)
        print(f"{path.name},{image.width},{image.height},{corner_alpha},{magenta_spill},{coverage:.3f}")


if __name__ == "__main__":
    trim_sprites()
    make_candidate_grid()
    make_game_scale_comparison()
    validate_sprites()
