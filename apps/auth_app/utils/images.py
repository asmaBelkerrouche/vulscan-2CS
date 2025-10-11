from io import BytesIO
from PIL import Image, ImageOps
from django.core.files.base import ContentFile

def process_avatar(file, size=(400, 400)):
    img = Image.open(file)
    img = ImageOps.exif_transpose(img)          # fix orientation
    img = ImageOps.fit(img, size, Image.LANCZOS) # square crop + resize

    buf = BytesIO()
    fmt = "WEBP" if img.mode in ("RGBA","LA") else "JPEG"
    img.convert("RGB").save(buf, fmt, quality=90)
    return ContentFile(buf.getvalue(), name="avatar." + fmt.lower())
