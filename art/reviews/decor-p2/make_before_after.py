from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).parent
BEFORE = ROOT / "before"


def font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    try:
        return ImageFont.truetype("arialbd.ttf" if bold else "arial.ttf", size)
    except OSError:
        return ImageFont.load_default()


def comparison(
    device: str,
    capture_size: tuple[int, int],
    target_width: int,
    output: str,
) -> None:
    gap, header, row_label = 24, 102, 38
    target_height = round(capture_size[1] * target_width / capture_size[0])
    width = gap * 3 + target_width * 2
    height = header + 2 * (row_label + target_height + gap)
    sheet = Image.new("RGB", (width, height), "#101614")
    draw = ImageDraw.Draw(sheet)
    draw.text((gap, 16), f"HEXFRONT - DECOR P1 / P2 - {device.upper()}", font=font(28, True), fill="#f3b35b")
    draw.text((gap, 57), "BEFORE - decor-p1", font=font(18, True), fill="#b8c5bb")
    draw.text((gap * 2 + target_width, 57), "AFTER - decor-p2", font=font(18, True), fill="#dbe9c9")

    for row, level in enumerate((3, 4)):
        y = header + row * (row_label + target_height + gap)
        draw.text((gap, y), f"LEVEL {level:02d}", font=font(18, True), fill="#e8eee5")
        for column, root in enumerate((BEFORE, ROOT)):
            source = root / device / f"level-{level:02d}.png"
            image = Image.open(source).convert("RGB").crop((0, 0, *capture_size))
            thumb = image.resize((target_width, target_height), Image.Resampling.LANCZOS)
            x = gap + column * (target_width + gap)
            sheet.paste(thumb, (x, y + row_label))

    sheet.save(ROOT / output, quality=92, optimize=True)


if __name__ == "__main__":
    comparison("desktop", (1440, 900), 660, "before-after-desktop.jpg")
    comparison("mobile", (390, 844), 360, "before-after-mobile.jpg")
