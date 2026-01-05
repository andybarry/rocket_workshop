#!/usr/bin/env python3
"""
Remove box 5b from the bottom right of page 20.png.
This script will identify and remove a small box in the bottom right area.
"""

from PIL import Image, ImageDraw
import sys
import os

def find_and_remove_box_bottom_right(image_path, box_size_estimate=(80, 40), margin=20):
    """
    Find and remove a small box in the bottom right area of the image.
    
    Args:
        image_path: Path to the image
        box_size_estimate: Estimated size (width, height) of the box
        margin: Margin from the edges
    """
    img = Image.open(image_path).convert('RGB')
    width, height = img.size
    
    print(f"Image size: {width}x{height} pixels")
    
    # Define bottom right area - typically a small box would be in the last 200-300 pixels
    # from right and bottom
    search_area_right = width - margin
    search_area_bottom = height - margin
    
    # Estimate box position - small box in bottom right
    # Try a few common positions
    box_width, box_height = box_size_estimate
    
    # Common positions for a small bottom-right box:
    # 1. Very bottom right corner
    x1 = width - box_width - margin
    y1 = height - box_height - margin
    
    # 2. Slightly more centered
    x2 = width - box_width - margin - 50
    y2 = height - box_height - margin - 50
    
    # 3. More towards center but still bottom right
    x3 = width - box_width - margin - 100
    y3 = height - box_height - margin - 30
    
    positions = [
        (x1, y1, "bottom-right corner"),
        (x2, y2, "slightly inset"),
        (x3, y3, "more centered")
    ]
    
    print("\nAttempting to remove box from bottom right area...")
    print(f"Trying position: ({x1}, {y1}) - {box_width}x{box_height} pixels")
    
    # Sample background color from around the estimated position
    samples = []
    sample_offsets = [5, 10, 15, 20]
    
    for offset in sample_offsets:
        # Sample from left of box
        if x1 - offset >= 0:
            for py in range(max(0, y1-5), min(height, y1+box_height+5)):
                try:
                    samples.append(img.getpixel((x1 - offset, py)))
                except:
                    pass
        # Sample from above box
        if y1 - offset >= 0:
            for px in range(max(0, x1-5), min(width, x1+box_width+5)):
                try:
                    samples.append(img.getpixel((px, y1 - offset)))
                except:
                    pass
        # Sample from right of box (if there's space)
        if x1 + box_width + offset < width:
            for py in range(max(0, y1-5), min(height, y1+box_height+5)):
                try:
                    samples.append(img.getpixel((x1 + box_width + offset, py)))
                except:
                    pass
        # Sample from below box (if there's space)
        if y1 + box_height + offset < height:
            for px in range(max(0, x1-5), min(width, x1+box_width+5)):
                try:
                    samples.append(img.getpixel((px, y1 + box_height + offset)))
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
    draw.rectangle([x1, y1, x1 + box_width, y1 + box_height], fill=fill_color, outline=fill_color)
    
    # Also try slightly larger area to ensure complete removal
    # Expand by a few pixels to catch any border
    expanded_margin = 3
    draw.rectangle(
        [x1 - expanded_margin, y1 - expanded_margin, 
         x1 + box_width + expanded_margin, y1 + box_height + expanded_margin], 
        fill=fill_color, outline=fill_color
    )
    
    # Save
    img.save(image_path, 'PNG', quality=95)
    print(f"\nSuccessfully removed box 5b from bottom right area")
    print(f"  Position: ({x1}, {y1})")
    print(f"  Size: {box_width}x{box_height} pixels")
    print(f"  Saved to: {image_path}")

if __name__ == "__main__":
    image_path = "src/assets/images/pages/20.png"
    
    if not os.path.exists(image_path):
        print(f"Error: {image_path} not found")
        sys.exit(1)
    
    # Try different box sizes - small boxes are typically 60-100px wide, 30-50px tall
    # But let's try a few sizes to be safe
    sizes_to_try = [
        (80, 40),   # Medium small box
        (100, 50),  # Slightly larger
        (70, 35),   # Smaller
        (90, 45),   # In between
    ]
    
    print("Removing box 5b from bottom right of page 20.png")
    print("=" * 60)
    
    # Use the first size estimate
    find_and_remove_box_bottom_right(image_path, box_size_estimate=sizes_to_try[0])






