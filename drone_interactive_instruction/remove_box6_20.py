#!/usr/bin/env python3
"""
Remove box 6 (small square) from the bottom right of page 20.png.
This script will identify and remove a small square box in the bottom right area.
"""

from PIL import Image, ImageDraw
import sys
import os

def find_and_remove_box6_bottom_right(image_path, box_size_estimate=(60, 60), margin=20):
    """
    Find and remove box 6 (small square) in the bottom right area of the image.
    
    Args:
        image_path: Path to the image
        box_size_estimate: Estimated size (width, height) of the square box
        margin: Margin from the edges
    """
    img = Image.open(image_path).convert('RGB')
    width, height = img.size
    
    print(f"Image size: {width}x{height} pixels")
    
    # Define bottom right area - small square box in the bottom right
    # Try different positions and sizes for a small square
    box_width, box_height = box_size_estimate
    
    # Position: bottom right corner with margin
    x = width - box_width - margin
    y = height - box_height - margin
    
    print(f"\nAttempting to remove box 6 from bottom right area...")
    print(f"Position: ({x}, {y}) - {box_width}x{box_height} pixels")
    
    # Sample background color from around the box area
    samples = []
    sample_offsets = [5, 10, 15, 20]
    
    for offset in sample_offsets:
        # Sample from left of box
        if x - offset >= 0:
            for py in range(max(0, y-5), min(height, y+box_height+5)):
                try:
                    samples.append(img.getpixel((x - offset, py)))
                except:
                    pass
        # Sample from above box
        if y - offset >= 0:
            for px in range(max(0, x-5), min(width, x+box_width+5)):
                try:
                    samples.append(img.getpixel((px, y - offset)))
                except:
                    pass
        # Sample from right of box (if there's space)
        if x + box_width + offset < width:
            for py in range(max(0, y-5), min(height, y+box_height+5)):
                try:
                    samples.append(img.getpixel((x + box_width + offset, py)))
                except:
                    pass
        # Sample from below box (if there's space)
        if y + box_height + offset < height:
            for px in range(max(0, x-5), min(width, x+box_width+5)):
                try:
                    samples.append(img.getpixel((px, y + box_height + offset)))
                except:
                    pass
    
    # Calculate average background color
    if samples:
        r = sum(c[0] for c in samples) // len(samples)
        g = sum(c[1] for c in samples) // len(samples)
        b = sum(c[2] for c in samples) // len(samples)
        fill_color = (r, g, b)
        print(f"Background color detected: RGB({r}, {g}, {b})")
    else:
        fill_color = (255, 255, 255)  # White fallback
        print("Using white as fallback color")
    
    # Remove the box
    draw = ImageDraw.Draw(img)
    
    # Remove with a slightly expanded area to ensure complete removal
    expanded_margin = 3
    draw.rectangle(
        [x - expanded_margin, y - expanded_margin, 
         x + box_width + expanded_margin, y + box_height + expanded_margin], 
        fill=fill_color, outline=fill_color
    )
    
    # Save
    img.save(image_path, 'PNG', quality=95)
    print(f"\nSuccessfully removed box 6 from bottom right area")
    print(f"  Position: ({x}, {y})")
    print(f"  Size: {box_width}x{box_height} pixels")
    print(f"  Saved to: {image_path}")

if __name__ == "__main__":
    image_path = "src/assets/images/pages/20.png"
    
    if not os.path.exists(image_path):
        print(f"Error: {image_path} not found")
        sys.exit(1)
    
    print("Removing box 6 (small square) from bottom right of page 20.png")
    print("=" * 60)
    
    # Try different square sizes - small squares are typically 40-80px
    sizes_to_try = [
        (60, 60),   # Medium small square
        (50, 50),   # Smaller square
        (70, 70),   # Slightly larger
        (45, 45),   # Even smaller
    ]
    
    # Use the first size estimate
    find_and_remove_box6_bottom_right(image_path, box_size_estimate=sizes_to_try[0])







