from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).parent


def font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    try:
        return ImageFont.truetype("arialbd.ttf" if bold else "arial.ttf", size)
    except OSError:
        return ImageFont.load_default()


def contact_sheet(folder: str, columns: int, target_width: int, output: str, capture_size: tuple[int, int]) -> None:
    paths = sorted((ROOT / folder).glob("level-*.png"))
    images = [Image.open(path).convert("RGB").crop((0, 0, *capture_size)) for path in paths]
    ratio = target_width / images[0].width
    target_height = round(images[0].height * ratio)
    rows = (len(images) + columns - 1) // columns
    gap, header, label = 22, 92, 34
    width = gap + columns * (target_width + gap)
    height = header + rows * (target_height + label + gap)
    sheet = Image.new("RGB", (width, height), "#101614")
    draw = ImageDraw.Draw(sheet)
    draw.text((gap, 18), f"HEXFRONT · DECOR P1 · {folder.upper()}", font=font(28, True), fill="#f3b35b")
    draw.text((gap, 54), "Visual test mode · visual=decor-p1 · not production", font=font(16), fill="#b8c5bb")
    for index, image in enumerate(images):
        row, column = divmod(index, columns)
        x = gap + column * (target_width + gap)
        y = header + row * (target_height + label + gap)
        thumb = image.resize((target_width, target_height), Image.Resampling.LANCZOS)
        sheet.paste(thumb, (x, y))
        draw.text((x, y + target_height + 7), f"LEVEL {index + 1:02d}", font=font(16, True), fill="#e8eee5")
    sheet.save(ROOT / output, optimize=True)


if __name__ == "__main__":
    # The in-app browser returns screenshots at a 1.111 backing scale while the
    # requested viewport remains anchored at the top-left. Crop to the requested
    # review frame before composing, avoiding the repeated backing-buffer edge.
    contact_sheet("desktop", columns=2, target_width=700, output="desktop-all-levels.jpg", capture_size=(1440, 900))
    contact_sheet("mobile", columns=5, target_width=240, output="mobile-all-levels.jpg", capture_size=(390, 844))
