"""Build a review sheet from the real Direct3D surface readbacks."""
import base64
import sys
from pathlib import Path
from PIL import Image, ImageDraw

proof = Path(sys.argv[1])
with Image.open(proof / "michigan-patrol.ppm") as cruiser:
    cruiser.save(proof / "FEVER-after-hours.jpg", quality=92, optimize=True)
rows = [("michigan-patrol", "lake-street"), ("louisiana-patrol", "alder-kitchen"), ("vermont-patrol", "north-spur"), ("photo", "training-annex")]
sheet = Image.new("RGB", (800, 4 * 244), "#111614")
draw = ImageDraw.Draw(sheet)
for y, row in enumerate(rows):
    for x, name in enumerate(row):
        with Image.open(proof / (name + ".ppm")) as original:
            tile = original.resize((400, 225), Image.Resampling.LANCZOS)
        sheet.paste(tile, (x*400, y*244))
        draw.text((x*400+6, y*244+228), name.replace("-", " ").upper(), fill="#d8d6c6")
sheet.save(proof/"FEVER-recordings.jpg", quality=87, optimize=True)
# A small, unpackaged preview lets a reviewer inspect a run directly from its logs.
thumb = sheet.resize((560, 684), Image.Resampling.LANCZOS)
from io import BytesIO
buf = BytesIO()
thumb.save(buf, format="JPEG", quality=76, optimize=True)
print("FEVER_REVIEW_JPEG=" + base64.b64encode(buf.getvalue()).decode("ascii"))
