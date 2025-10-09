
# Using PILLOW library
from PIL import Image

im_file = "data/book.jpg"   

# Loaded into memory
im = Image.open(im_file)

#METADATA
print(im)
print(im.size)

#Brings Up Photo
im.show()
#im.rotate(90).show()

# Save as new file 
#im.save("data/bookAgain.jpg")








