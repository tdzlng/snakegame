# 🐍 Snake Game

A retro neon-style Snake game created for AI testing purposes, not intended as a production project.

---

# ✨ Visual Design

- CRT scanline overlay + vignette effect for a retro feel
- Neon green snake with head-to-tail color gradient
- Pulsing pink neon food with radial glow
- Subtle cyan grid lines on a dark background
- Glowing HUD with

  + Score
  + Level
  + Best score
- Snake has animated eyes that follow movement direction

---

# 🎮 Gameplay Features

- Arrow keys or `WASD` controls
- Swipe support for touch screens
- `Spacebar` to pause/resume
- 4 speed modes

  + Slow
  + Normal
  + Fast
  + Insane
- Level progression

  + Speed increases every `100 × level` points
- Score multiplier based on current level
- Best score saved using `localStorage`
- Death flash animation on collision

---

# ⚡ Sparky CSS Background

- 55 animated neon particles with glowing trails
- Random lightning bolt strikes across the background
- Animated drifting CSS grid
- Layered CRT vignette + scanline effects

---

# 🍒 Cherry Types

## 🍒 Red Cherry

- Standard cherry
- `+10 × level` points
- Always spawns

## ✨ Golden Cherry

- Rare spawn
- `+50 × level` points
- Triggers a canvas flash effect

## ⚡ Speed Cherry

- `+20` points
- Activates temporary speed boost (~40 ticks)
- Cyan border glow while active

## 💀 Skull Cherry

- Very rare
- `+100 × level` points
- Cuts the snake length in half

### Additional Mechanics

- Up to 4 cherries can appear simultaneously
- Extra cherries expire with a fade effect
- Floating score popups appear where cherries are eaten

---

# 🐍 Snake Skin Picker

- --NEON-- — classic green glow
- --CRIMSON-- — deep red/pink
- --CYBER-- — electric cyan
- --GOLD-- — molten yellow-orange
- --GALAXY-- — purple/violet
- --MATRIX-- — dark digital green
