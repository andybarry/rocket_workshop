#!/usr/bin/env python3
"""
Script to remove box 5b from page 20.png image.
This script will remove a rectangular region from the image.
"""

from PIL import Image, ImageDraw
import sys
import os

def remove_box_from_image(image_path, output_path, x, y, width, height):
    """
    Remove a rectangular region from an image by filling it with white or the background color.
    
    Args:
        image_path: Path to the input image
        output_path: Path to save the modified image
        x: X coordinate of the top-left corner of the box
        y: Y coordinate of the top-left corner of the box
        width: Width of the box to remove
        height: Height of the box to remove
    """
    try:
        # Open the image
        img = Image.open(image_path)
        img = img.convert('RGB')  # Ensure RGB mode
        
        # Create a drawing context
        draw = ImageDraw.Draw(img)
        
        # Get the background color (sample from near the box area, or use white)
        # For now, we'll use white as default, but you can change this
        fill_color = (255, 255, 255)  # White
        
        # Alternative: sample background color from around the box
        # This gets the color from just outside the box area
        sample_x = max(0, x - 10)
        sample_y = max(0, y - 10)
        if sample_x < img.width and sample_y < img.height:
            try:
                fill_color = img.getpixel((sample_x, sample_y))
            except:
                fill_color = (255, 255, 255)
        
        # Draw a rectangle to cover the box (fill with background color)
        draw.rectangle([x, y, x + width, y + height], fill=fill_color, outline=fill_color)
        
        # Save the modified image
        img.save(output_path, 'PNG', quality=95)
        print(f"Successfully removed box 5b from {image_path}")
        print(f"Modified image saved to {output_path}")
        
    except Exception as e:
        print(f"Error processing image: {e}")
        sys.exit(1)

def main():
    image_path = "src/assets/images/pages/20.png"
    output_path = "src/assets/images/pages/20.png"  # Overwrite the original
    
    if not os.path.exists(image_path):
        print(f"Error: Image file not found at {image_path}")
        sys.exit(1)
    
    # Since we don't have coordinates, we'll need to get them
    # For now, let's create a helper script that can identify the box
    # Or we can use approximate coordinates if the user provides them
    
    print("To remove box 5b, we need the coordinates.")
    print("Please provide:")
    print("  - X coordinate (left edge)")
    print("  - Y coordinate (top edge)")
    print("  - Width")
    print("  - Height")
    print("\nOr run this script with coordinates as arguments:")
    print("  python remove_box_5b.py <x> <y> <width> <height>")
    
    if len(sys.argv) == 5:
        x = int(sys.argv[1])
        y = int(sys.argv[2])
        width = int(sys.argv[3])
        height = int(sys.argv[4])
        remove_box_from_image(image_path, output_path, x, y, width, height)
    else:
        print("\nNo coordinates provided. Please provide coordinates to proceed.")
        print("Example: python remove_box_5b.py 100 200 150 50")

if __name__ == "__main__":
    main()



