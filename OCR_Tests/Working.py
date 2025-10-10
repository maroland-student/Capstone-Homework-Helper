import pytesseract
from PIL import Image


pytesseract.pytesseract.tesseract_cmd = "/usr/local/bin/tesseract"


img_file = "data/book.jpg"


img = Image.open(img_file)

ocr_result = pytesseract.image_to_string(img)

print(ocr_result)