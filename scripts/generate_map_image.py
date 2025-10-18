"""
Generate a pixel-art style world map image using pygame.
The image approximates a retro scene with grass, a sunset sky, square-and-X tan roads,
plus three buildings (Arcade, Library, Bank/Advisor).

Usage (Windows PowerShell):
  PYTHON scripts/generate_map_image.py

Output:
  static/images/world_map.png
"""
import os
import math
import pygame

# Allow running without opening a window
os.environ.setdefault("SDL_VIDEODRIVER", "dummy")

WIDTH, HEIGHT = 1024, 700
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "static", "images", "world_map.png")
OUTPUT_PATH = os.path.abspath(OUTPUT_PATH)

# Colors
SKY_TOP = (255, 180, 87)
SKY_BOTTOM = (255, 211, 138)
GRASS = (95, 179, 95)
SPECKLE = (46, 125, 50)
TREE_DARK = (27, 94, 32)
TREE_LEAF = (46, 125, 50)
PATH = (214, 165, 94)
PATH_EDGE = (179, 136, 75)
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)

# Building palettes
ARCADE_BASE = (109, 76, 65)
ARCADE_DOOR = (62, 39, 35)
ARCADE_ROOF = (211, 47, 47)
ARCADE_SIGN = (255, 235, 59)

LIB_BASE = (141, 110, 99)
LIB_DOOR = (93, 64, 55)
LIB_ROOF = (109, 76, 65)
LIB_SIGN = (255, 224, 130)

BANK_BASE = (176, 190, 197)
BANK_COL = (236, 239, 241)
BANK_ROOF = (121, 85, 72)
BANK_SIGN = (255, 202, 40)


def draw_vertical_gradient(surf, rect, top_color, bottom_color):
    x, y, w, h = rect
    for i in range(h):
        t = i / max(1, h - 1)
        c = (
            int(top_color[0] * (1 - t) + bottom_color[0] * t),
            int(top_color[1] * (1 - t) + bottom_color[1] * t),
            int(top_color[2] * (1 - t) + bottom_color[2] * t),
        )
        pygame.draw.line(surf, c, (x, y + i), (x + w, y + i))


def draw_background(surf):
    # Sky
    sky_h = int(HEIGHT * 0.45)
    draw_vertical_gradient(surf, (0, 0, WIDTH, sky_h), SKY_TOP, SKY_BOTTOM)

    # Sun
    sun_r = int(min(WIDTH, HEIGHT) * 0.08)
    pygame.draw.circle(surf, (255, 224, 138), (WIDTH // 2, int(HEIGHT * 0.15)), sun_r)

    # Grass
    grass_rect = pygame.Rect(0, int(HEIGHT * 0.35), WIDTH, HEIGHT - int(HEIGHT * 0.35))
    pygame.draw.rect(surf, GRASS, grass_rect)

    # Speckles
    speckle = pygame.Surface((2, 2))
    speckle.fill(SPECKLE)
    speckle.set_alpha(50)
    import random
    for _ in range(400):
        x = random.randint(0, WIDTH - 2)
        y = random.randint(int(HEIGHT * 0.35), HEIGHT - 2)
        surf.blit(speckle, (x, y))

    # Trees (simple circles + trunk)
    trees = [
        (0.15, 0.55), (0.30, 0.65), (0.60, 0.62), (0.85, 0.60),
        (0.25, 0.85), (0.50, 0.85), (0.70, 0.72), (0.40, 0.50),
    ]
    for tx, ty in trees:
        x = int(WIDTH * tx); y = int(HEIGHT * ty)
        pygame.draw.circle(surf, TREE_LEAF, (x, y), 12)
        pygame.draw.rect(surf, TREE_DARK, (x - 3, y + 10, 6, 12))


def stroke_path(surf, points, width, color, edge_color):
    # Draw edge underlay
    pygame.draw.lines(surf, edge_color, False, points, width + 6)
    # Main path
    pygame.draw.lines(surf, color, False, points, width)


def draw_roads(surf):
    tl = (int(WIDTH * 0.22), int(HEIGHT * 0.34))
    tr = (int(WIDTH * 0.78), int(HEIGHT * 0.34))
    br = (int(WIDTH * 0.75), int(HEIGHT * 0.78))
    bl = (int(WIDTH * 0.22), int(HEIGHT * 0.78))
    c  = (int(WIDTH * 0.50), int(HEIGHT * 0.55))
    path_w = max(18, int(min(WIDTH, HEIGHT) * 0.06))
    # Square
    stroke_path(surf, [tl, tr], path_w, PATH, PATH_EDGE)
    stroke_path(surf, [tr, br], path_w, PATH, PATH_EDGE)
    stroke_path(surf, [br, bl], path_w, PATH, PATH_EDGE)
    stroke_path(surf, [bl, tl], path_w, PATH, PATH_EDGE)
    # X
    stroke_path(surf, [tl, c], path_w, PATH, PATH_EDGE)
    stroke_path(surf, [tr, c], path_w, PATH, PATH_EDGE)
    stroke_path(surf, [br, c], path_w, PATH, PATH_EDGE)
    stroke_path(surf, [bl, c], path_w, PATH, PATH_EDGE)


def draw_arcade(surf, center, scale=1.0):
    cx, cy = center
    w, h = int(120*scale), int(90*scale)
    body = pygame.Rect(cx - w//2, cy - h//2, w, h)
    pygame.draw.rect(surf, ARCADE_BASE, body)
    # door
    door = pygame.Rect(cx - int(12*scale), cy - int(5*scale), int(24*scale), int(30*scale))
    pygame.draw.rect(surf, ARCADE_DOOR, door)
    # roof
    roof_pts = [
        (cx - w//2 - int(6*scale), cy - h//2),
        (cx, cy - h//2 - int(28*scale)),
        (cx + w//2 + int(6*scale), cy - h//2),
    ]
    pygame.draw.polygon(surf, ARCADE_ROOF, roof_pts)
    # sign
    font = pygame.font.SysFont(None, max(16, int(16*scale)))
    text = font.render('ARCADE', True, ARCADE_SIGN)
    surf.blit(text, (cx - text.get_width()//2, cy - h//2 + int(6*scale)))


def draw_library(surf, center, scale=1.0):
    cx, cy = center
    w, h = int(140*scale), int(95*scale)
    pygame.draw.rect(surf, LIB_BASE, (cx - w//2, cy - h//2, w, h))
    pygame.draw.rect(surf, LIB_DOOR, (cx - int(14*scale), cy - int(5*scale), int(28*scale), int(30*scale)))
    pygame.draw.rect(surf, LIB_ROOF, (cx - w//2, cy - h//2 - int(18*scale), w, int(18*scale)))
    font = pygame.font.SysFont(None, max(16, int(16*scale)))
    text = font.render('LIBRARY', True, LIB_SIGN)
    surf.blit(text, (cx - text.get_width()//2, cy - h//2 + int(6*scale)))


def draw_bank(surf, center, scale=1.0):
    cx, cy = center
    w, h = int(130*scale), int(95*scale)
    pygame.draw.rect(surf, BANK_BASE, (cx - w//2, cy - h//2, w, h))
    col_w, gap = int(12*scale), int(10*scale)
    for i in range(-2, 3):
        x = cx + i*(col_w+gap) - col_w//2
        pygame.draw.rect(surf, BANK_COL, (x, cy - h//2 + int(10*scale), col_w, h - int(20*scale)))
    roof_pts = [
        (cx - w//2 - int(6*scale), cy - h//2),
        (cx, cy - h//2 - int(24*scale)),
        (cx + w//2 + int(6*scale), cy - h//2),
    ]
    pygame.draw.polygon(surf, BANK_ROOF, roof_pts)
    font = pygame.font.SysFont(None, max(26, int(26*scale)))
    text = font.render('$', True, BANK_SIGN)
    surf.blit(text, (cx - text.get_width()//2, cy - text.get_height()//2))


def main():
    pygame.init()
    surf = pygame.Surface((WIDTH, HEIGHT))
    # Background and roads
    draw_background(surf)
    draw_roads(surf)

    # Buildings placed similar to the reference
    arcade_pos = (int(WIDTH*0.22), int(HEIGHT*0.25))
    library_pos = (int(WIDTH*0.78), int(HEIGHT*0.25))
    bank_pos    = (int(WIDTH*0.76), int(HEIGHT*0.78))
    draw_arcade(surf, arcade_pos, 1.0)
    draw_library(surf, library_pos, 1.0)
    draw_bank(surf, bank_pos, 1.0)

    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    pygame.image.save(surf, OUTPUT_PATH)
    print(f"Saved map image to: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
