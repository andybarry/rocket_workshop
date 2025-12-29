#!/usr/bin/env python3
"""
Remove box 5b from page 20.png image.
Usage: python remove_box5b.py <x> <y> <width> <height>
"""

from PIL import Image, ImageDraw
import sys
import os

def remove_box(image_path, x, y, width, height):
    """Remove a rectangular region by filling with surrounding background color."""
    img = Image.open(image_path).convert('RGB')
    draw = ImageDraw.Draw(img)
    
    # Sample background color from around the box
    samples = []
    for offset in [5, 10, 15]:
        # Sample from all four sides
        if x - offset >= 0:
            for py in range(max(0, y-2), min(img.height, y+height+2)):
                try:
                    samples.append(img.getpixel((x - offset, py)))
                except:
                    pass
        if x + width + offset < img.width:
            for py in range(max(0, y-2), min(img.height, y+height+2)):
                try:
                    samples.append(img.getpixel((x + width + offset, py)))
                except:
                    pass
        if y - offset >= 0:
            for px in range(max(0, x-2), min(img.width, x+width+2)):
                try:
                    samples.append(img.getpixel((px, y - offset)))
                except:
                    pass
        if y + height + offset < img.height:
            for px in range(max(0, x-2), min(img.width, x+width+2)):
                try:
                    samples.append(img.getpixel((px, y + height + offset)))
                except:
                    pass
    
    # Calculate average background color
    if samples:
        r = sum(c[0] for c in samples) // len(samples)
        g = sum(c[1] for c in samples) // len(samples)
        b = sum(c[2] for c in samples) // len(samples)
        fill_color = (r, g, b)
    else:
        fill_color = (255, 255, 255)  # White fallback
    
    # Remove the box
    draw.rectangle([x, y, x + width, y + height], fill=fill_color, outline=fill_color)
    
    # Save
    img.save(image_path, 'PNG', quality=95)
    print(f"✓ Removed box 5b from {image_path}")

if __name__ == "__main__":
    image_path = "src/assets/images/pages/20.png"
    
    if not os.path.exists(image_path):
        print(f"Error: {image_path} not found")
        sys.exit(1)
    
    if len(sys.argv) != 5:
        print("Usage: python remove_box5b.py <x> <y> <width> <height>")
        print("\nTo find coordinates:")
        print("1. Open the image in an image editor")
        print("2. Hover over the top-left corner of box 5b to get (x, y)")
        print("3. Measure the width and height of the box")
        print("\nOr use browser DevTools:")
        print("1. Open the app in browser")
        print("2. Inspect box 5b element")
        print("3. Check computed styles for position and size")
        print("4. Convert percentages to pixels based on image size (816x1056)")
        sys.exit(1)
    
    try:
        x, y, w, h = map(int, sys.argv[1:5])
        remove_box(image_path, x, y, w, h)
    except ValueError:
        print("Error: All coordinates must be integers")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


