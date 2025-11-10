
import png

def create_placeholder_image(width, height, color, filename):
    img = []
    for _ in range(height):
        row = []
        for _ in range(width):
            row.extend(color)
        img.append(row)

    with open(filename, 'wb') as f:
        writer = png.Writer(width, height, greyscale=False)
        writer.write(f, img)

if __name__ == '__main__':
    create_placeholder_image(100, 100, (255, 255, 255), 'src/app/wardrobe/placeholder.png')
