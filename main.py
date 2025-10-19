"""
FinQuest - Retro Anime Map (Pygbag WebAssembly)
Professional next-level retro landing page
"""

import pygame
import sys
import math
import random
import asyncio
from enum import Enum

pygame.init()

# Constants - Extra widescreen with more height
WIDTH = 2000
HEIGHT = 1100
FPS = 60

# Retro Anime Color Palette
class Colors:
    # Sunset sky - vibrant gradient
    SKY_LAYERS = [
        (255, 220, 180),  # Top - light peach
        (255, 190, 140),  # 
        (255, 160, 110),  # 
        (255, 130, 90),   # 
        (250, 110, 75),   # Bottom - deep orange
    ]
    
    # Grass - rich greens
    GRASS_TOP = (145, 210, 100)
    GRASS_MID = (120, 190, 80)
    GRASS_DARK = (95, 170, 65)
    
    # Path
    PATH_LIGHT = (235, 205, 150)
    PATH_MID = (220, 185, 130)
    PATH_DARK = (190, 160, 105)
    
    # Trees
    TRUNK_DARK = (110, 70, 45)
    TRUNK_LIGHT = (140, 90, 60)
    LEAF_BRIGHT = (100, 190, 75)
    LEAF_MID = (80, 160, 60)
    LEAF_DARK = (60, 130, 45)
    
    # Character
    CHAR_BLUE = (90, 150, 255)
    CHAR_DARK = (60, 110, 200)
    CHAR_LIGHT = (130, 180, 255)
    
    # Buildings
    ARCADE_ROOF = (230, 55, 85)
    ARCADE_WALL = (210, 165, 130)
    ARCADE_SIGN = (255, 245, 50)
    
    LIBRARY_ROOF = (140, 90, 50)
    LIBRARY_WALL = (220, 175, 135)
    LIBRARY_TEXT = (255, 245, 210)
    
    OFFICE_BLUE = (65, 95, 140)
    OFFICE_DARK = (45, 70, 110)
    OFFICE_WINDOW = (135, 185, 230)
    OFFICE_LIT = (255, 250, 200)
    
    BANK_TAN = (225, 200, 160)
    BANK_DARK = (190, 165, 130)
    BANK_COLUMN = (245, 235, 205)
    BANK_GOLD = (255, 210, 0)

class Location(Enum):
    ARCADE = "games"
    LIBRARY = "learn"
    BANK = "bank-api"
    NONE = None

class Particle:
    """Floating sparkle particles"""
    def __init__(self):
        self.reset()
        
    def reset(self):
        self.x = random.randint(0, WIDTH)
        self.y = random.randint(0, HEIGHT)
        self.size = random.choice([2, 2, 3, 3, 4])
        colors = [(255, 255, 220), (255, 240, 200), (250, 220, 255), (220, 255, 255)]
        self.color = random.choice(colors)
        self.speed_y = -0.2 - random.random() * 0.4
        self.speed_x = (random.random() - 0.5) * 0.3
        self.alpha = 150 + random.randint(0, 80)
        self.pulse_speed = 0.05 + random.random() * 0.05
        self.pulse = random.random() * math.pi * 2
        
    def update(self):
        self.y += self.speed_y
        self.x += self.speed_x
        self.pulse += self.pulse_speed
        
        if self.y < -10:
            self.reset()
            self.y = HEIGHT + 10
            
    def draw(self, screen):
        brightness = 0.6 + 0.4 * abs(math.sin(self.pulse))
        surf = pygame.Surface((self.size * 3, self.size * 3), pygame.SRCALPHA)
        alpha = int(self.alpha * brightness)
        
        # Glow
        for i in range(self.size, 0, -1):
            a = alpha // (self.size - i + 1)
            color = (*self.color, a)
            pygame.draw.circle(surf, color, (self.size + 1, self.size + 1), i)
        
        screen.blit(surf, (self.x - self.size - 1, self.y - self.size - 1))

class Tree:
    """Defined retro pixel art trees"""
    def __init__(self, x, y, size):
        self.x = x
        self.y = y
        self.size = size
        
    def update(self):
        pass  # No animation for simplicity
        
    def draw(self, screen):
        # Defined trunk with outline
        trunk_w = int(self.size * 0.35)
        trunk_h = int(self.size * 1.3)
        trunk_x = self.x - trunk_w // 2
        trunk_y = self.y - trunk_h // 2
        
        # Trunk body
        pygame.draw.rect(screen, Colors.TRUNK_DARK, 
                        (trunk_x, trunk_y, trunk_w, trunk_h), border_radius=2)
        # Trunk highlight
        pygame.draw.rect(screen, Colors.TRUNK_LIGHT, 
                        (trunk_x + 2, trunk_y + 2, trunk_w // 3, trunk_h - 4))
        # Trunk outline
        pygame.draw.rect(screen, (80, 50, 30), 
                        (trunk_x, trunk_y, trunk_w, trunk_h), 2, border_radius=2)
        
        # Defined circular foliage with layers
        foliage_size = int(self.size * 1.0)
        foliage_y = int(trunk_y - self.size * 0.35)
        
        # Dark layer (depth)
        pygame.draw.circle(screen, Colors.LEAF_DARK, (self.x, foliage_y + 3), foliage_size)
        # Mid layer
        pygame.draw.circle(screen, Colors.LEAF_MID, (self.x, foliage_y), foliage_size - 2)
        # Bright highlight
        pygame.draw.circle(screen, Colors.LEAF_BRIGHT, 
                         (self.x - foliage_size // 3, foliage_y - foliage_size // 3), 
                         foliage_size // 2.5)
        # Define outline
        pygame.draw.circle(screen, (50, 100, 35), (self.x, foliage_y), foliage_size, 2)

class Character:
    """Stickman character"""
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.width = 40
        self.height = 60
        self.speed = 15  # Significantly faster movement
        self.anim_frame = 0
        self.anim_counter = 0
        self.velocity_x = 0
        self.velocity_y = 0
        
    def move(self, dx, dy):
        # Smooth interpolation for movement
        target_vx = dx * self.speed
        target_vy = dy * self.speed
        
        # Smooth acceleration/deceleration
        self.velocity_x += (target_vx - self.velocity_x) * 0.3
        self.velocity_y += (target_vy - self.velocity_y) * 0.3
        
        if abs(self.velocity_x) > 0.1 or abs(self.velocity_y) > 0.1:
            self.anim_counter += 1
            if self.anim_counter >= 4:  # Faster animation for faster movement
                self.anim_frame = (self.anim_frame + 1) % 4
                self.anim_counter = 0
                
        self.x += self.velocity_x
        self.y += self.velocity_y
        
        # Constrain to grass area only - don't let character go into sky
        grass_start = int(HEIGHT * 0.25)  # 275px - where grass begins
        self.x = max(50, min(self.x, WIDTH - self.width - 50))
        self.y = max(grass_start + 20, min(self.y, HEIGHT - self.height - 50))
        
    def draw(self, screen):
        # Center point for stickman
        center_x = self.x + self.width // 2
        center_y = self.y + self.height // 2
        
        # Simple shadow
        shadow_surf = pygame.Surface((self.width, 8), pygame.SRCALPHA)
        pygame.draw.ellipse(shadow_surf, (0, 0, 0, 60), shadow_surf.get_rect())
        screen.blit(shadow_surf, (self.x, self.y + self.height - 4))
        
        stick_color = (40, 40, 50)
        stick_width = 5
        
        # Head (circle)
        head_y = self.y + 12
        pygame.draw.circle(screen, stick_color, (center_x, head_y), 10, stick_width)
        
        # Body (vertical line)
        body_top = head_y + 10
        body_bottom = self.y + 38
        pygame.draw.line(screen, stick_color, (center_x, body_top), (center_x, body_bottom), stick_width)
        
        # Arms - walking animation
        arm_y = body_top + 8
        if self.anim_frame in [0, 2]:
            # Arms neutral/mid
            pygame.draw.line(screen, stick_color, (center_x, arm_y), (center_x - 12, arm_y + 12), stick_width)
            pygame.draw.line(screen, stick_color, (center_x, arm_y), (center_x + 12, arm_y + 12), stick_width)
        else:
            # Arms swinging
            pygame.draw.line(screen, stick_color, (center_x, arm_y), (center_x - 15, arm_y + 8), stick_width)
            pygame.draw.line(screen, stick_color, (center_x, arm_y), (center_x + 15, arm_y + 14), stick_width)
        
        # Legs - walking animation
        if self.anim_frame in [0, 2]:
            # Legs in walking position
            pygame.draw.line(screen, stick_color, (center_x, body_bottom), (center_x - 10, self.y + self.height), stick_width)
            pygame.draw.line(screen, stick_color, (center_x, body_bottom), (center_x + 10, self.y + self.height - 5), stick_width)
        else:
            # Legs in opposite position
            pygame.draw.line(screen, stick_color, (center_x, body_bottom), (center_x - 10, self.y + self.height - 5), stick_width)
            pygame.draw.line(screen, stick_color, (center_x, body_bottom), (center_x + 10, self.y + self.height), stick_width)
    
    def get_rect(self):
        return pygame.Rect(self.x, self.y, self.width, self.height)

class Building:
    """Interactive buildings"""
    def __init__(self, name, x, y, w, h, location, btype):
        self.name = name
        self.x = x
        self.y = y
        self.width = w
        self.height = h
        self.location = location
        self.type = btype
        self.pulse = 0
        
    def update(self):
        self.pulse += 0.08
        
    def is_near(self, character, threshold=95):
        char = character.get_rect()
        bld = pygame.Rect(self.x, self.y, self.width, self.height)
        expanded = bld.inflate(threshold * 2, threshold * 2)
        return expanded.colliderect(char)
        
    def draw(self, screen, character):
        is_near = self.is_near(character)
        
        # Shadow
        shadow = pygame.Surface((self.width + 20, self.height + 20), pygame.SRCALPHA)
        pygame.draw.rect(shadow, (0, 0, 0, 45), shadow.get_rect(), border_radius=12)
        screen.blit(shadow, (self.x + 12, self.y + 12))
        
        # Glow when near
        if is_near:
            glow_size = int(25 + 8 * abs(math.sin(self.pulse * 2)))
            glow = pygame.Surface((self.width + glow_size * 2, 
                                  self.height + glow_size * 2), pygame.SRCALPHA)
            for i in range(glow_size, 0, -2):
                alpha = int(40 * (i / glow_size))
                pygame.draw.rect(glow, (255, 255, 150, alpha), 
                               glow.get_rect(), border_radius=20)
            screen.blit(glow, (self.x - glow_size, self.y - glow_size))
        
        # Draw building
        if self.type == "arcade":
            self.draw_arcade(screen)
        elif self.type == "library":
            self.draw_library(screen)
        elif self.type == "office":
            self.draw_office(screen)
        elif self.type == "bank":
            self.draw_bank(screen)
            
        # Interaction prompt
        if is_near and self.location != Location.NONE:
            self.draw_prompt(screen)
    
    def draw_arcade(self, screen):
        # Clean retro arcade building
        wall_y = self.y + 80
        wall_h = self.height - 80
        
        # Subtle soft shadow
        shadow_surf = pygame.Surface((self.width + 12, wall_h + 12), pygame.SRCALPHA)
        for i in range(6):
            alpha = 40 - i * 6
            pygame.draw.rect(shadow_surf, (0, 0, 0, alpha), (i, i, self.width + 12 - i*2, wall_h + 12 - i*2), border_radius=10)
        screen.blit(shadow_surf, (self.x + 6, wall_y + 6))
        
        # Main wall
        pygame.draw.rect(screen, (220, 170, 140),
                        (self.x, wall_y, self.width, wall_h), border_radius=10)
        
        # Wall shading - left and right
        pygame.draw.rect(screen, (190, 145, 115),
                        (self.x + 5, wall_y + 5, 18, wall_h - 10))
        pygame.draw.rect(screen, (235, 190, 160),
                        (self.x + self.width - 23, wall_y + 5, 18, wall_h - 10))
        
        # Clean roof - simple design, NO overlaps
        roof_w = self.width + 30
        roof_h = 75
        roof_x = self.x - 15
        roof_y = self.y + 5
        
        # Roof fill
        pygame.draw.rect(screen, (230, 60, 90),
                        (roof_x, roof_y, roof_w, roof_h), border_radius=8)
        
        # Roof stripe (internal decoration)
        pygame.draw.rect(screen, (200, 40, 70),
                        (roof_x + 8, roof_y + roof_h - 12, roof_w - 16, 6), border_radius=2)
        
        # ARCADE sign on roof - retro arcade font style
        sign_w = self.width - 35
        sign_h = 50
        sign_x = self.x + 18
        sign_y = self.y + 20
        
        # Sign background with border
        pygame.draw.rect(screen, (255, 235, 60), (sign_x - 3, sign_y - 3, sign_w + 6, sign_h + 6), border_radius=8)
        pygame.draw.rect(screen, (255, 50, 90), (sign_x, sign_y, sign_w, sign_h), border_radius=6)
        
        # RETRO ARCADE FONT - bold blocky style
        try:
            # Try to use monospace font for retro feel
            font = pygame.font.SysFont('couriernew', 44, bold=True)
        except:
            font = pygame.font.Font(None, 50)
        
        text = font.render("ARCADE", True, (255, 235, 60))
        text_rect = text.get_rect(center=(self.x + self.width // 2, sign_y + sign_h // 2))
        
        # Retro shadow
        shadow = font.render("ARCADE", True, (100, 20, 40))
        screen.blit(shadow, (text_rect.x + 3, text_rect.y + 3))
        screen.blit(text, text_rect)
        
        # Windows - square arcade style
        for wx in [self.x + 25, self.x + self.width - 55]:
            pygame.draw.rect(screen, (90, 130, 170), (wx, wall_y + 30, 30, 30), border_radius=4)
            pygame.draw.rect(screen, (60, 90, 130), (wx, wall_y + 30, 30, 30), 3, border_radius=4)
        
        # Door
        door_w = 70
        door_h = 85
        door_x = self.x + self.width // 2 - door_w // 2
        door_y = wall_y + wall_h - door_h - 8
        pygame.draw.rect(screen, (50, 40, 50), (door_x, door_y, door_w, door_h), border_radius=6)
        pygame.draw.line(screen, (70, 60, 70), (door_x + door_w//2, door_y + 8), (door_x + door_w//2, door_y + door_h - 8), 2)
        # Handle
        pygame.draw.circle(screen, (220, 180, 80), (door_x + door_w - 12, door_y + door_h // 2), 5)
        
        # Clean building outline
        pygame.draw.rect(screen, (150, 115, 90), (self.x, wall_y, self.width, wall_h), 3, border_radius=10)
    
    def draw_library(self, screen):
        # Clean retro library
        wall_y = self.y + 85
        wall_h = self.height - 85
        
        # Subtle soft shadow
        shadow_surf = pygame.Surface((self.width + 12, wall_h + 12), pygame.SRCALPHA)
        for i in range(6):
            alpha = 40 - i * 6
            pygame.draw.rect(shadow_surf, (0, 0, 0, alpha), (i, i, self.width + 12 - i*2, wall_h + 12 - i*2), border_radius=10)
        screen.blit(shadow_surf, (self.x + 6, wall_y + 6))
        
        # Warm brown wall
        pygame.draw.rect(screen, (210, 165, 120),
                        (self.x, wall_y, self.width, wall_h), border_radius=10)
        
        # Wall shading
        pygame.draw.rect(screen, (185, 145, 105),
                        (self.x + 5, wall_y + 5, 18, wall_h - 10))
        pygame.draw.rect(screen, (230, 180, 135),
                        (self.x + self.width - 23, wall_y + 5, 18, wall_h - 10))
        
        # Clean tiled roof
        roof_w = self.width + 40
        roof_h = 85
        roof_x = self.x - 20
        roof_y = self.y
        
        # Roof fill
        pygame.draw.rect(screen, (120, 75, 45),
                        (roof_x, roof_y, roof_w, roof_h), border_radius=10)
        
        # Tile pattern - clean internal lines
        for i in range(6):
            tile_y = roof_y + 15 + i * 12
            pygame.draw.rect(screen, (100, 60, 35),
                           (roof_x + 8, tile_y, roof_w - 16, 4), border_radius=1)
        
        # Roof decorative ends
        end_size = 10
        pygame.draw.circle(screen, (140, 90, 55), (roof_x + 10, roof_y + roof_h // 2), end_size)
        pygame.draw.circle(screen, (140, 90, 55), (roof_x + roof_w - 10, roof_y + roof_h // 2), end_size)
        
        # LIBRARY sign - dark wood
        sign_w = self.width - 45
        sign_h = 48
        sign_x = self.x + 23
        sign_y = self.y + 30
        
        pygame.draw.rect(screen, (130, 85, 55), (sign_x - 3, sign_y - 3, sign_w + 6, sign_h + 6), border_radius=8)
        pygame.draw.rect(screen, (80, 50, 30), (sign_x, sign_y, sign_w, sign_h), border_radius=6)
        
        # RETRO ARCADE FONT
        try:
            font = pygame.font.SysFont('couriernew', 38, bold=True)
        except:
            font = pygame.font.Font(None, 44)
        
        text = font.render("LIBRARY", True, (255, 245, 220))
        text_rect = text.get_rect(center=(self.x + self.width // 2, sign_y + sign_h // 2))
        
        # Retro shadow
        shadow = font.render("LIBRARY", True, (40, 25, 15))
        screen.blit(shadow, (text_rect.x + 3, text_rect.y + 3))
        screen.blit(text, text_rect)
        
        # Windows with cross dividers
        for i in range(3):
            win_x = self.x + 30 + i * 80
            win_y = wall_y + 28
            # Window
            pygame.draw.rect(screen, (255, 250, 220), (win_x, win_y, 62, 75), border_radius=6)
            pygame.draw.rect(screen, (130, 95, 65), (win_x, win_y, 62, 75), 3, border_radius=6)
            # Dividers
            pygame.draw.line(screen, (130, 95, 65), (win_x + 31, win_y + 3), (win_x + 31, win_y + 72), 3)
            pygame.draw.line(screen, (130, 95, 65), (win_x + 3, win_y + 37), (win_x + 59, win_y + 37), 3)
        
        # Door
        door_w = 58
        door_h = 78
        door_x = self.x + self.width // 2 - door_w // 2
        door_y = wall_y + wall_h - door_h - 8
        pygame.draw.rect(screen, (95, 65, 40), (door_x, door_y, door_w, door_h), border_radius=6)
        pygame.draw.rect(screen, (130, 95, 65), (door_x, door_y, door_w, door_h), 3, border_radius=6)
        pygame.draw.circle(screen, (180, 140, 70), (door_x + door_w - 12, door_y + door_h // 2), 5)
        
        # Clean outline
        pygame.draw.rect(screen, (145, 105, 75), (self.x, wall_y, self.width, wall_h), 3, border_radius=10)
    
    def draw_office(self, screen):
        # Building
        pygame.draw.rect(screen, Colors.OFFICE_BLUE,
                        (self.x, self.y, self.width, self.height),
                        border_radius=6)
        pygame.draw.rect(screen, Colors.OFFICE_DARK,
                        (self.x, self.y, self.width, self.height),
                        5, border_radius=6)
        
        # Antenna
        pygame.draw.rect(screen, (40, 55, 85),
                        (self.x + self.width // 2 - 7, self.y - 35, 14, 40))
        pygame.draw.circle(screen, (255, 80, 80),
                         (self.x + self.width // 2, self.y - 35), 10)
        pygame.draw.circle(screen, (255, 120, 120),
                         (self.x + self.width // 2, self.y - 35), 10, 2)
        
        # Windows
        for row in range(10):
            for col in range(3):
                wx = self.x + 26 + col * 52
                wy = self.y + 18 + row * 24
                lit = (row + col) % 3 == 0
                color = Colors.OFFICE_LIT if lit else Colors.OFFICE_WINDOW
                pygame.draw.rect(screen, color, (wx, wy, 34, 18), border_radius=2)
                pygame.draw.rect(screen, Colors.OFFICE_DARK, (wx, wy, 34, 18), 2, border_radius=2)
    
    def draw_bank(self, screen):
        # Clean retro bank
        wall_y = self.y + 85
        wall_h = self.height - 85
        
        # Subtle soft shadow
        shadow_surf = pygame.Surface((self.width + 12, wall_h + 12), pygame.SRCALPHA)
        for i in range(6):
            alpha = 40 - i * 6
            pygame.draw.rect(shadow_surf, (0, 0, 0, alpha), (i, i, self.width + 12 - i*2, wall_h + 12 - i*2), border_radius=10)
        screen.blit(shadow_surf, (self.x + 6, wall_y + 6))
        
        # Cream temple wall - rounded
        pygame.draw.rect(screen, (240, 220, 190),
                        (self.x, wall_y, self.width, wall_h), border_radius=12)
        
        # Wall depth shading
        pygame.draw.rect(screen, (215, 195, 165),
                        (self.x, wall_y, 18, wall_h), border_radius=12)
        pygame.draw.rect(screen, (255, 240, 210),
                        (self.x + self.width - 18, wall_y, 18, wall_h), border_radius=12)
        
        # Grand cartoon pediment
        ped_points = [
            (self.x + self.width // 2, self.y + 8),
            (self.x - 22, wall_y + 8),
            (self.x - 22, wall_y + 28),
            (self.x + self.width + 22, wall_y + 28),
            (self.x + self.width + 22, wall_y + 8)
        ]
        pygame.draw.polygon(screen, (250, 235, 205), ped_points)
        
        # Pediment detail line
        pygame.draw.line(screen, (220, 200, 170),
                        (self.x - 15, wall_y + 18),
                        (self.x + self.width + 15, wall_y + 18), 4)
        
        # Pediment outline - thick
        pygame.draw.lines(screen, (190, 165, 135), False, ped_points, 6)
        
        # Large decorative columns - cartoon style
        for i in range(3):
            cx = self.x + 45 + i * 95
            col_y = wall_y + 35
            col_w = 45
            col_h = 150
            
            # Column body - white/cream
            pygame.draw.rect(screen, (255, 250, 235),
                           (cx, col_y, col_w, col_h), border_radius=4)
            
            # Fluting effect (vertical highlights)
            for j in range(4):
                groove_x = cx + 9 + j * 11
                pygame.draw.line(screen, (245, 235, 210),
                               (groove_x, col_y + 10), (groove_x, col_y + col_h - 10), 3)
            
            # Column outline
            pygame.draw.rect(screen, (190, 165, 135),
                           (cx, col_y, col_w, col_h), 3, border_radius=4)
            
            # Capital (top) - detailed
            cap_h = 22
            pygame.draw.rect(screen, (255, 250, 240), 
                           (cx - 8, col_y - cap_h, col_w + 16, cap_h), border_radius=4)
            pygame.draw.rect(screen, (190, 165, 135),
                           (cx - 8, col_y - cap_h, col_w + 16, cap_h), 3, border_radius=4)
            # Capital bands
            pygame.draw.line(screen, (190, 165, 135),
                           (cx - 5, col_y - cap_h + 8),
                           (cx + col_w + 13, col_y - cap_h + 8), 2)
            
            # Base (bottom)
            base_h = 22
            pygame.draw.rect(screen, (255, 250, 240),
                           (cx - 8, col_y + col_h, col_w + 16, base_h), border_radius=4)
            pygame.draw.rect(screen, (190, 165, 135),
                           (cx - 8, col_y + col_h, col_w + 16, base_h), 3, border_radius=4)
        
        # HUGE glowing golden dollar sign
        font = pygame.font.Font(None, 125)
        
        # Multi-layer glow
        for size_offset in range(5, 0, -1):
            glow_font = pygame.font.Font(None, 125 + size_offset * 4)
            glow = glow_font.render("$", True, (255, 225, 120))
            glow.set_alpha(35)
            glow_rect = glow.get_rect(center=(self.x + self.width // 2, self.y + 155))
            screen.blit(glow, glow_rect)
        
        # Thick shadow
        for offset in [(4, 4), (3, 3), (2, 2)]:
            shadow = font.render("$", True, (140, 105, 60))
            shadow_rect = shadow.get_rect(center=(self.x + self.width // 2 + offset[0], self.y + 155 + offset[1]))
            screen.blit(shadow, shadow_rect)
        
        # Golden dollar
        dollar = font.render("$", True, (255, 210, 30))
        dollar_rect = dollar.get_rect(center=(self.x + self.width // 2, self.y + 155))
        screen.blit(dollar, dollar_rect)
        
        # Sparkles
        for pos in [(-40, -30), (40, -30), (-50, 20), (50, 20)]:
            sparkle_x = self.x + self.width // 2 + pos[0]
            sparkle_y = self.y + 155 + pos[1]
            pygame.draw.circle(screen, (255, 245, 180), (sparkle_x, sparkle_y), 5)
            pygame.draw.circle(screen, (255, 210, 30), (sparkle_x, sparkle_y), 5, 2)
        
        # Building outline
        pygame.draw.rect(screen, (175, 150, 120), (self.x, wall_y, self.width, wall_h), 3, border_radius=12)
    
    def draw_prompt(self, screen):
        # Floating prompt animation
        pulse_y = int(8 * abs(math.sin(self.pulse * 3)))
        prompt_y = self.y - 75 - pulse_y
        
        # Ensure prompt stays on screen
        if prompt_y < 10:
            prompt_y = self.y + self.height + 15 + pulse_y
        
        prompt_w = 300
        prompt_h = 55
        prompt_x = self.x + self.width // 2 - prompt_w // 2
        
        # Ensure prompt doesn't go off screen horizontally
        prompt_x = max(10, min(prompt_x, WIDTH - prompt_w - 10))
        
        # Retro-style background with layers
        pygame.draw.rect(screen, (15, 15, 35, 240),
                        (prompt_x, prompt_y, prompt_w, prompt_h),
                        border_radius=12)
        
        # Animated rainbow border
        hue = (self.pulse * 60) % 360
        r = int(127 + 127 * math.sin(math.radians(hue)))
        g = int(127 + 127 * math.sin(math.radians(hue + 120)))
        b = int(127 + 127 * math.sin(math.radians(hue + 240)))
        
        pygame.draw.rect(screen, (r, g, b),
                        (prompt_x, prompt_y, prompt_w, prompt_h),
                        5, border_radius=12)
        pygame.draw.rect(screen, (255, 255, 120),
                        (prompt_x + 4, prompt_y + 4, prompt_w - 8, prompt_h - 8),
                        2, border_radius=10)
        
        # RETRO ARCADE FONT
        try:
            font = pygame.font.SysFont('couriernew', 30, bold=True)
        except:
            font = pygame.font.Font(None, 36)
        
        # Remove emoji from display
        display_name = self.name.replace("🎮 ", "").replace("📚 ", "").replace("🏦 ", "")
        
        # Retro arcade shadow
        text_msg = f"PRESS SPACE - {display_name}"
        text_shadow = font.render(text_msg, True, (30, 30, 50))
        text_rect = text_shadow.get_rect(center=(self.x + self.width // 2 + 3, prompt_y + prompt_h // 2 + 3))
        screen.blit(text_shadow, text_rect)
        
        # Main text
        text = font.render(text_msg, True, (255, 255, 255))
        text_rect = text.get_rect(center=(self.x + self.width // 2, prompt_y + prompt_h // 2))
        screen.blit(text, text_rect)

class Game:
    def __init__(self):
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT))
        pygame.display.set_caption("FinQuest")
        self.clock = pygame.time.Clock()
        self.running = True
        
        # Character starts in center of screen
        self.character = Character(WIDTH // 2 - 27, HEIGHT // 2 - 27)
        
        # Widescreen building layout
        self.buildings = [
            Building("🎮 ARCADE", 100, 100, 280, 260, Location.ARCADE, "arcade"),
            Building("📚 LIBRARY", WIDTH - 380, 100, 280, 260, Location.LIBRARY, "library"),
            Building("🏦 BANK", WIDTH // 2 - 140, HEIGHT - 360, 280, 280, Location.BANK, "bank"),
        ]
        
        # Generate trees - simplified for less clutter
        self.trees = []
        for _ in range(25):
            x = random.randint(150, WIDTH - 150)
            y = random.randint(400, HEIGHT - 120)
            too_close = any(
                abs(x - (b.x + b.width // 2)) < 200 and 
                abs(y - (b.y + b.height // 2)) < 200 
                for b in self.buildings
            )
            if not too_close:
                self.trees.append(Tree(x, y, random.randint(25, 35)))
        
        self.particles = [Particle() for _ in range(30)]
        self.keys = {}
        
    def draw_background(self):
        # Sunset at very top - like reference image
        sky_height = int(HEIGHT * 0.25)  # Much smaller sky, sunset at top
        
        # Smooth gradient sunset
        for i in range(sky_height):
            t = i / sky_height
            # Smooth interpolation through all sky colors
            if t < 0.2:
                progress = t / 0.2
                r = int(Colors.SKY_LAYERS[0][0] * (1-progress) + Colors.SKY_LAYERS[1][0] * progress)
                g = int(Colors.SKY_LAYERS[0][1] * (1-progress) + Colors.SKY_LAYERS[1][1] * progress)
                b = int(Colors.SKY_LAYERS[0][2] * (1-progress) + Colors.SKY_LAYERS[1][2] * progress)
            elif t < 0.4:
                progress = (t - 0.2) / 0.2
                r = int(Colors.SKY_LAYERS[1][0] * (1-progress) + Colors.SKY_LAYERS[2][0] * progress)
                g = int(Colors.SKY_LAYERS[1][1] * (1-progress) + Colors.SKY_LAYERS[2][1] * progress)
                b = int(Colors.SKY_LAYERS[1][2] * (1-progress) + Colors.SKY_LAYERS[2][2] * progress)
            elif t < 0.6:
                progress = (t - 0.4) / 0.2
                r = int(Colors.SKY_LAYERS[2][0] * (1-progress) + Colors.SKY_LAYERS[3][0] * progress)
                g = int(Colors.SKY_LAYERS[2][1] * (1-progress) + Colors.SKY_LAYERS[3][1] * progress)
                b = int(Colors.SKY_LAYERS[2][2] * (1-progress) + Colors.SKY_LAYERS[3][2] * progress)
            else:
                progress = (t - 0.6) / 0.4
                r = int(Colors.SKY_LAYERS[3][0] * (1-progress) + Colors.SKY_LAYERS[4][0] * progress)
                g = int(Colors.SKY_LAYERS[3][1] * (1-progress) + Colors.SKY_LAYERS[4][1] * progress)
                b = int(Colors.SKY_LAYERS[3][2] * (1-progress) + Colors.SKY_LAYERS[4][2] * progress)
            
            pygame.draw.line(self.screen, (r, g, b), (0, i), (WIDTH, i))
        
        # Huge retro cartoon sun at top right
        sun_x = WIDTH - 180
        sun_y = 90
        sun_radius = 75
        
        # Sun glow
        for i in range(5):
            glow_radius = sun_radius + (5 - i) * 12
            alpha = 50 - i * 10
            glow_surf = pygame.Surface((glow_radius * 2, glow_radius * 2), pygame.SRCALPHA)
            pygame.draw.circle(glow_surf, (255, 230, 150, alpha), (glow_radius, glow_radius), glow_radius)
            self.screen.blit(glow_surf, (sun_x - glow_radius, sun_y - glow_radius))
        
        # Sun body - more detailed
        pygame.draw.circle(self.screen, (255, 245, 120), (sun_x, sun_y), sun_radius)
        pygame.draw.circle(self.screen, (255, 230, 90), (sun_x, sun_y), sun_radius - 6)
        pygame.draw.circle(self.screen, (255, 200, 0), (sun_x, sun_y), sun_radius, 3)
        
        # Top half is GRASS like reference
        grass_start = sky_height
        grass_height = HEIGHT - grass_start
        
        for i in range(0, grass_height, 4):
            t = i / grass_height
            if t < 0.5:
                r = int(Colors.GRASS_TOP[0] * (1-t*2) + Colors.GRASS_MID[0] * t*2)
                g = int(Colors.GRASS_TOP[1] * (1-t*2) + Colors.GRASS_MID[1] * t*2)
                b = int(Colors.GRASS_TOP[2] * (1-t*2) + Colors.GRASS_MID[2] * t*2)
            else:
                t = (t - 0.5) * 2
                r = int(Colors.GRASS_MID[0] * (1-t) + Colors.GRASS_DARK[0] * t)
                g = int(Colors.GRASS_MID[1] * (1-t) + Colors.GRASS_DARK[1] * t)
                b = int(Colors.GRASS_MID[2] * (1-t) + Colors.GRASS_DARK[2] * t)
            pygame.draw.rect(self.screen, (r, g, b), (0, grass_start + i, WIDTH, 4))
    
    def draw_paths(self):
        path_w = 92
        center_x = WIDTH // 2
        center_y = HEIGHT // 2
        grass_start = int(HEIGHT * 0.25)  # 275px - where grass begins
        
        # Horizontal path
        pygame.draw.rect(self.screen, Colors.PATH_DARK,
                        (0, center_y - path_w // 2 - 8, WIDTH, path_w + 16))
        pygame.draw.rect(self.screen, Colors.PATH_MID,
                        (0, center_y - path_w // 2 - 4, WIDTH, path_w + 8))
        pygame.draw.rect(self.screen, Colors.PATH_LIGHT,
                        (0, center_y - path_w // 2, WIDTH, path_w))
        
        # Vertical path - constrained to grass area only
        path_height = HEIGHT - grass_start
        pygame.draw.rect(self.screen, Colors.PATH_DARK,
                        (center_x - path_w // 2 - 8, grass_start, path_w + 16, path_height))
        pygame.draw.rect(self.screen, Colors.PATH_MID,
                        (center_x - path_w // 2 - 4, grass_start, path_w + 8, path_height))
        pygame.draw.rect(self.screen, Colors.PATH_LIGHT,
                        (center_x - path_w // 2, grass_start, path_w, path_height))
    
    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            elif event.type == pygame.KEYDOWN:
                self.keys[event.key] = True
                if event.key == pygame.K_SPACE:
                    for b in self.buildings:
                        if b.is_near(self.character) and b.location != Location.NONE:
                            try:
                                # Use platform.window to navigate
                                import platform
                                # Get the current origin and navigate
                                url = f"/{b.location.value}"
                                print(f"Navigating to: {url}")
                                platform.window.location.href = url
                                return
                            except Exception as e:
                                print(f"Navigation error: {e}")
                                print(f"Would navigate to: /{b.location.value}")
            elif event.type == pygame.KEYUP:
                self.keys[event.key] = False
    
    def handle_movement(self):
        dx = dy = 0
        if self.keys.get(pygame.K_a) or self.keys.get(pygame.K_LEFT):
            dx = -1
        if self.keys.get(pygame.K_d) or self.keys.get(pygame.K_RIGHT):
            dx = 1
        if self.keys.get(pygame.K_w) or self.keys.get(pygame.K_UP):
            dy = -1
        if self.keys.get(pygame.K_s) or self.keys.get(pygame.K_DOWN):
            dy = 1
        
        if dx != 0 and dy != 0:
            dx *= 0.707
            dy *= 0.707
        
        self.character.move(dx, dy)
    
    async def run(self):
        while self.running:
            self.handle_events()
            self.handle_movement()
            
            for b in self.buildings:
                b.update()
            for t in self.trees:
                t.update()
            for p in self.particles:
                p.update()
            
            # Draw - clear screen completely first to prevent trails
            self.screen.fill((0, 0, 0))
            self.draw_background()
            self.draw_paths()
            
            # Depth sorting
            for p in self.particles:
                if p.y > 420:
                    p.draw(self.screen)
            
            trees_behind = [t for t in self.trees if t.y < self.character.y]
            trees_front = [t for t in self.trees if t.y >= self.character.y]
            
            for t in trees_behind:
                t.draw(self.screen)
            
            for b in self.buildings:
                b.draw(self.screen, self.character)
            
            self.character.draw(self.screen)
            
            for t in trees_front:
                t.draw(self.screen)
            
            for p in self.particles:
                if p.y <= 420:
                    p.draw(self.screen)
            
            pygame.display.flip()
            self.clock.tick(FPS)
            await asyncio.sleep(0)
        
        pygame.quit()

async def main():
    game = Game()
    await game.run()

if __name__ == "__main__":
    asyncio.run(main())
