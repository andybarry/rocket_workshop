#!/usr/bin/env python3
"""
Interactive script to find and remove box 5b from page 20.png.
This script will help identify the box location and remove it.
"""

from PIL import Image, ImageDraw, ImageFont
import sys
import os

def show_image_with_grid(image_path):
    """Display image dimensions and create a preview to help identify box location."""
    try:
        img = Image.open(image_path)
        print(f"Image dimensions: {img.width} x {img.height} pixels")
        print(f"Image mode: {img.mode}")
        return img
    except Exception as e:
        print(f"Error loading image: {e}")
        sys.exit(1)

def remove_box_region(img, x, y, width, height, method='inpaint_simple'):
    """
    Remove a box region from the image.
    
    Methods:
    - 'white': Fill with white
    - 'inpaint_simple': Try to blend with surrounding area
    """
    img = img.copy()
    draw = ImageDraw.Draw(img)
    
    if method == 'white':
        # Simple white fill
        draw.rectangle([x, y, x + width, y + height], fill=(255, 255, 255), outline=(255, 255, 255))
    elif method == 'inpaint_simple':
        # Try to sample background from around the box
        # Sample colors from the edges
        edge_samples = []
        for offset in range(5, 15):
            # Top edge
            if y - offset >= 0:
                for px in range(max(0, x - 5), min(img.width, x + width + 5)):
                    try:
                        edge_samples.append(img.getpixel((px, y - offset)))
                    except:
                        pass
            # Bottom edge
            if y + height + offset < img.height:
                for px in range(max(0, x - 5), min(img.width, x + width + 5)):
                    try:
                        edge_samples.append(img.getpixel((px, y + height + offset)))
                    except:
                        pass
            # Left edge
            if x - offset >= 0:
                for py in range(max(0, y - 5), min(img.height, y + height + 5)):
                    try:
                        edge_samples.append(img.getpixel((x - offset, py)))
                    except:
                        pass
            # Right edge
            if x + width + offset < img.width:
                for py in range(max(0, y - 5), min(img.height, y + height + 5)):
                    try:
                        edge_samples.append(img.getpixel((x + width + offset, py)))
                    except:
                        pass
        
        if edge_samples:
            # Use average color of edge samples
            avg_r = sum(c[0] for c in edge_samples) // len(edge_samples)
            avg_g = sum(c[1] for c in edge_samples) // len(edge_samples)
            avg_b = sum(c[2] for c in edge_samples) // len(edge_samples)
            fill_color = (avg_r, avg_g, avg_b)
        else:
            fill_color = (255, 255, 255)  # Fallback to white
        
        draw.rectangle([x, y, x + width, y + height], fill=fill_color, outline=fill_color)
    
    return img

def main():
    image_path = "src/assets/images/pages/20.png"
    
    if not os.path.exists(image_path):
        print(f"Error: Image file not found at {image_path}")
        sys.exit(1)
    
    # Load and show image info
    img = show_image_with_grid(image_path)
    
    # Check if coordinates are provided as command line arguments
    if len(sys.argv) == 5:
        x = int(sys.argv[1])
        y = int(sys.argv[2])
        width = int(sys.argv[3])
        height = int(sys.argv[4])
        
        print(f"\nRemoving box at: x={x}, y={y}, width={width}, height={height}")
        
        # Remove the box
        modified_img = remove_box_region(img, x, y, width, height, method='inpaint_simple')
        
        # Save (overwrite original)
        modified_img.save(image_path, 'PNG', quality=95)
        print(f"\n✓ Successfully removed box 5b from {image_path}")
        
    else:
        print("\n" + "="*60)
        print("Box 5b Removal Tool")
        print("="*60)
        print(f"\nImage: {image_path}")
        print(f"Size: {img.width} x {img.height} pixels")
        print("\nTo remove box 5b, please provide coordinates:")
        print("  python find_and_remove_box5b.py <x> <y> <width> <height>")
        print("\nExample:")
        print("  python find_and_remove_box5b.py 100 200 150 50")
        print("\nThis will remove a box starting at (100, 200) with")
        print("width 150 and height 50 pixels.")
        print("\nTip: You can use an image editor to find the coordinates,")
        print("or check the browser developer tools if the box is visible on the page.")

if __name__ == "__main__":
    main()


