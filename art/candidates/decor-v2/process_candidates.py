from math import cos, pi, sin
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).parent
SPRITE_DIR = ROOT / "sprites"
PREVIEW_DIR = ROOT / "previews"
P1_DIR = ROOT.parent / "decor-p1" / "sprites"
RUNTIME_DIR = ROOT.parents[2] / "public" / "assets" / "decor-v2"

FAMILIES = {
    "mountains": ["rock-outcrop", "highland-ridge", "snow-peaks", "scree-cluster"],
    "ruins": ["collapsed-corner", "cracked-paving", "parallel-rubble", "broken-foundation"],
    "marsh": ["cattails", "sedge", "lily-leaves", "reeds-stones"],
    "snow": ["snow-conifer", "snow-bush", "snow-rocks", "snowdrift"],
}

ANCHORS = {
    "mountains": "highland-ridge",
    "ruins": "cracked-paving",
    "marsh": "reeds-stones",
    "snow": "snow-rocks",
}

SAFE_BOX = {
    "mountains": (1.46, 1.10),
    "ruins": (1.42, 0.96),
    "marsh": (1.08, 1.22),
    "snow": (1.34, 1.00),
}


def font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    name = "arialbd.ttf" if bold else "arial.ttf"
    try:
        return ImageFont.truetype(name, size)
    except OSError:
        return ImageFont.load_default()


def sprite_path(family: str, name: str, v2: bool = True) -> Path:
    suffix = "-v2" if v2 else ""
    root = SPRITE_DIR if v2 else P1_DIR
    return root / f"{family}-{name}{suffix}.png"


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


def draw_hex(draw: ImageDraw.ImageDraw, x: int, y: int, radius: int, family: str) -> None:
    palette = {
        "mountains": ("#d9d2bd", "#aaa58f"),
        "ruins": ("#e7d9b7", "#bca77c"),
        "marsh": ("#b9d9c1", "#86b39a"),
        "snow": ("#edf5f2", "#bfd4d2"),
    }
    fill, edge = palette[family]
    draw.polygon(pointy_hex(x, y, radius), fill=fill, outline=edge, width=max(1, radius // 28 + 1))


def place_sprite(
    canvas: Image.Image,
    path: Path,
    family: str,
    x: int,
    y: int,
    radius: int,
) -> None:
    sprite = Image.open(path).convert("RGBA")
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


def make_anchor_comparison() -> None:
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    canvas = Image.new("RGBA", (1440, 720), "#101614")
    draw = ImageDraw.Draw(canvas)
    draw.text((52, 32), "HEXFRONT - SIMPLIFIED DECOR V2", font=font(34, True), fill="#f3b35b")
    draw.text((52, 78), "P1 reference above, simplified V2 anchor below", font=font(17), fill="#b8c5bb")
    columns = [210, 550, 890, 1230]
    for column, (family, name) in zip(columns, ANCHORS.items(), strict=True):
        draw_label_centered(draw, column, 122, family.upper(), font(18, True), "#d9e4d4")
        for row_y, path, version in (
            (280, sprite_path(family, name, False), "P1"),
            (535, sprite_path(family, name), "V2"),
        ):
            draw_hex(draw, column, row_y, 108, family)
            place_sprite(canvas, path, family, column, row_y, 108)
            draw_label_centered(draw, column, row_y + 122, version, font(15, True), "#aebdb2")
    canvas.save(PREVIEW_DIR / "candidate-grid.png", optimize=True)


def make_anchor_scale_comparison() -> None:
    canvas = Image.new("RGBA", (1440, 620), "#101614")
    draw = ImageDraw.Draw(canvas)
    draw.text((52, 28), "GAME-SCALE CHECK - DESKTOP AND PORTRAIT MOBILE", font=font(30, True), fill="#f3b35b")
    draw.text((52, 70), "Same placement limits for P1 and V2 anchors", font=font(16), fill="#b8c5bb")
    columns = [220, 560, 900, 1240]
    for column, (family, name) in zip(columns, ANCHORS.items(), strict=True):
        draw_label_centered(draw, column, 110, family.upper(), font(17, True), "#d9e4d4")
        for row_y, radius, scale_label in ((220, 48, "48 px"), (465, 31, "31 px")):
            for x, path, version in (
                (column - 62, sprite_path(family, name, False), "P1"),
                (column + 62, sprite_path(family, name), "V2"),
            ):
                draw_hex(draw, x, row_y, radius, family)
                place_sprite(canvas, path, family, x, row_y, radius)
                draw_label_centered(draw, x, row_y + radius + 18, version, font(12, True), "#aebdb2")
            draw_label_centered(draw, column, row_y - radius - 30, scale_label, font(13), "#88998d")
    canvas.save(PREVIEW_DIR / "game-scale-comparison.png", optimize=True)


def make_full_candidate_grid() -> None:
    canvas = Image.new("RGBA", (1440, 1160), "#101614")
    draw = ImageDraw.Draw(canvas)
    draw.text((52, 30), "HEXFRONT - COMPLETE DECOR V2 RUNTIME SET", font=font(32, True), fill="#f3b35b")
    draw.text((52, 72), "16 transparent assets - no water replacement", font=font(16), fill="#b8c5bb")
    columns = [210, 550, 890, 1230]
    rows = [225, 495, 765, 1035]
    for row_y, (family, names) in zip(rows, FAMILIES.items(), strict=True):
        draw.text((45, row_y - 112), family.upper(), font=font(18, True), fill="#d9e4d4")
        for column, name in zip(columns, names, strict=True):
            draw_hex(draw, column, row_y, 100, family)
            place_sprite(canvas, sprite_path(family, name), family, column, row_y, 100)
            draw_label_centered(draw, column, row_y + 113, name.replace("-", " "), font(14), "#d9e4d4")
    canvas.save(PREVIEW_DIR / "full-candidate-grid.png", optimize=True)


def make_full_scale_grid(radius: int, filename: str, title: str) -> None:
    canvas = Image.new("RGBA", (920, 720), "#101614")
    draw = ImageDraw.Draw(canvas)
    draw.text((32, 22), title, font=font(24, True), fill="#f3b35b")
    columns = [150, 355, 560, 765]
    rows = [135, 300, 465, 630]
    for row_y, (family, names) in zip(rows, FAMILIES.items(), strict=True):
        draw.text((28, row_y - 70), family.upper(), font=font(14, True), fill="#d9e4d4")
        for column, name in zip(columns, names, strict=True):
            draw_hex(draw, column, row_y, radius, family)
            place_sprite(canvas, sprite_path(family, name), family, column, row_y, radius)
    canvas.save(PREVIEW_DIR / filename, optimize=True)


def validate_sprites() -> None:
    print("file,width,height,corner_alpha,magenta_spill,visible_coverage")
    for path in sorted(SPRITE_DIR.glob("*.png")):
        image = Image.open(path).convert("RGBA")
        corners = [(0, 0), (image.width - 1, 0), (0, image.height - 1), (image.width - 1, image.height - 1)]
        corner_alpha = max(image.getpixel(point)[3] for point in corners)
        pixels = list(image.getdata())
        magenta_spill = sum(
            1 for red, green, blue, alpha in pixels
            if alpha > 32 and red > 180 and blue > 150 and green < 100
        )
        visible = sum(1 for _, _, _, alpha in pixels if alpha > 8)
        coverage = visible / len(pixels)
        print(f"{path.name},{image.width},{image.height},{corner_alpha},{magenta_spill},{coverage:.3f}")


def export_runtime_assets() -> None:
    RUNTIME_DIR.mkdir(parents=True, exist_ok=True)
    for family, names in FAMILIES.items():
        for name in names:
            image = Image.open(sprite_path(family, name)).convert("RGBA")
            image.thumbnail((512, 512), Image.Resampling.LANCZOS)
            image.save(RUNTIME_DIR / f"{family}-{name}.webp", "WEBP", quality=88, method=6)


if __name__ == "__main__":
    trim_sprites()
    make_anchor_comparison()
    make_anchor_scale_comparison()
    make_full_candidate_grid()
    make_full_scale_grid(48, "desktop-game-scale-grid.png", "COMPLETE V2 SET - 48 PX HEX RADIUS")
    make_full_scale_grid(31, "mobile-game-scale-grid.png", "COMPLETE V2 SET - 31 PX HEX RADIUS")
    validate_sprites()
    export_runtime_assets()
