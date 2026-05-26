#!/usr/bin/env python3
"""Generate a Bitcoin favicon (₿) for CoinTracker."""

import struct
from PIL import Image, ImageDraw


def generate_bitcoin_favicon(size=32):
    """Generate a size x size favicon with a white ₿ on orange circle."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Bitcoin orange (#f7931a) circle background
    orange = (247, 147, 26, 255)
    center = size // 2
    radius = size // 2 - 1
    draw.ellipse(
        (center - radius, center - radius, center + radius, center + radius),
        fill=orange,
    )

    # Draw a white ₿ symbol using basic shapes
    white = (255, 255, 255, 255)
    s = size / 32.0  # scale factor
    cx, cy = size // 2, size // 2

    # Vertical stem (left spoke of B)
    stem_x = int(cx - 5 * s)
    stem_w = max(1, int(3 * s))
    draw.rectangle(
        [stem_x, int(cy - 9 * s), stem_x + stem_w, int(cy + 9 * s)], fill=white
    )

    # Upper lobe (half-circle on right side of B)
    arc_w = max(1, int(2 * s))
    draw.arc(
        [int(stem_x - 1 * s), int(cy - 10 * s), int(stem_x + 11 * s), int(cy + 1 * s)],
        start=270,
        end=90,
        fill=white,
        width=arc_w,
    )

    # Lower lobe (half-circle on right side of B)
    draw.arc(
        [int(stem_x - 1 * s), int(cy - 1 * s), int(stem_x + 11 * s), int(cy + 10 * s)],
        start=270,
        end=90,
        fill=white,
        width=arc_w,
    )

    # The two horizontal strokes (the "double dash" through B)
    h = max(1, int(2 * s))
    draw.rectangle(
        [stem_x - 1, int(cy - 4 * s), int(cx + 7 * s), int(cy - 4 * s) + h],
        fill=white,
    )
    draw.rectangle(
        [stem_x - 1, int(cy + 3 * s), int(cx + 7 * s), int(cy + 3 * s) + h],
        fill=white,
    )

    return img


def save_ico(path, images):
    """Manually build a multi-size ICO file."""
    # ICO header: reserved(2) + type(2) + count(2)
    # Type 1 = icon
    header = struct.pack("<HHH", 0, 1, len(images))

    # Directory entries + image data
    dir_entries = []
    image_data = []
    offset = 6 + 16 * len(images)  # header + all directory entries

    for img in images:
        w, h = img.size
        # Convert to BGRA for BMP format
        bgra = bytearray()
        for y in range(h):
            for x in range(w):
                r, g, b, a = img.getpixel((x, y))
                bgra.extend([b, g, r, a])

        # BMP info header (40 bytes)
        bmp_header = struct.pack(
            "<IiiHHIIiiII",
            40,  # header size
            w,  # width (positive = bottom-up... but we'll handle)
            h * 2,  # height doubled for AND mask
            1,  # planes
            32,  # bits per pixel
            0,  # compression (BI_RGB)
            len(bgra),  # image size
            0,  # x pixels per meter
            0,  # y pixels per meter
            0,  # colors used
            0,  # important colors
        )

        # XOR mask (the pixel data) + AND mask (transparency)
        # For 32bpp, the AND mask is optional
        data = bmp_header + bytes(bgra)

        # Directory entry
        dir_entry = struct.pack(
            "<BBBBHHII",
            w if w < 256 else 0,
            h if h < 256 else 0,
            0,  # colors
            0,  # reserved
            1,  # color planes
            32,  # bits per pixel
            len(data),  # size of data
            offset,  # offset in file
        )
        dir_entries.append(dir_entry)
        image_data.append(data)
        offset += len(data)

    with open(path, "wb") as f:
        f.write(header)
        for entry in dir_entries:
            f.write(entry)
        for data in image_data:
            f.write(data)

    print(f"   Written {path} with {len(images)} sizes")


def main():
    sizes = [16, 32, 48]
    images = [generate_bitcoin_favicon(s) for s in sizes]

    for path in ["favicon.ico", "src/favicon.ico"]:
        save_ico(path, images)

    print("✅ Created favicon.ico and src/favicon.ico")
    print(f"   Sizes: {sizes}")
    print("   Background: #f7931a (Bitcoin orange)")
    print("   Symbol: White ₿")

    # Verify using Pillow
    verify = Image.open("favicon.ico")
    i = 0
    frames = []
    while True:
        try:
            verify.seek(i)
            frames.append(verify.size)
            i += 1
        except EOFError:
            break
    print(f"   Verified frames: {frames}")


if __name__ == "__main__":
    main()
