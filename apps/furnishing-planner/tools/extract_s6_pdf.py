import fitz
doc = fitz.open(r"C:\Users\nlaki\Downloads\doza-djerdja-stan-006.pdf")
page = doc[0]
clip = fitz.Rect(40, 195, 745, 650)
pix = page.get_pixmap(matrix=fitz.Matrix(4, 4), clip=clip)
out = r"C:\Users\nlaki\AppData\Local\Temp\s6_plan_crop.png"
pix.save(out)
print("saved", pix.width, "x", pix.height)
