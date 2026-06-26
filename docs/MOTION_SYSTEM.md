# AERIDIAN Motion Design System

The AERIDIAN Motion Design System dictates how all animations, transitions, and interactions behave within the storefront. It ensures consistency, performance, and accessibility.

## 1. Motion Philosophy
- **Motion must communicate hierarchy:** Larger architectural changes move slower. Micro-interactions move faster.
- **Motion must reinforce interaction:** Elements must provide immediate feedback to user input.
- **Motion must never delay usability:** Animations must not block a user from navigating or interacting.
- **Motion must always feel physical:** Use premium easing curves that mimic real-world inertia, accelerating naturally and decelerating smoothly.
- **No animation should feel robotic:** Linear easing is prohibited unless used for continuous infinite loops (e.g., marquees).

## 2. Token Reference
All motion values must be pulled from the centralized CSS variables defined in `motion-tokens.css`.

### Durations
| Token | Value | Use Case |
|---|---|---|
| `--motion-instant` | 0ms | Functional state changes |
| `--motion-fast` | 200ms | Micro-interactions (hover, focus) |
| `--motion-base` | 400ms | Component interactions (dropdowns, tooltips) |
| `--motion-medium` | 600ms | Standard UI reveals (drawers, modals) |
| `--motion-slow` | 800ms | Complex component sequences |
| `--motion-hero` | 1000ms | Section-level mounting |
| `--motion-cinematic` | 1500ms | Page transitions, immersive WebGL |

### Easings
| Token | Use Case |
|---|---|
| `--ease-standard` | General UI transitions |
| `--ease-soft` | Gentle, airy fades |
| `--ease-premium` | Luxury deceleration (rapid start, long tail) |
| `--ease-expo` | Sharp, dramatic entrances |
| `--ease-spring` | Playful or elastic feedback |
| `--ease-luxury` | Smooth, heavy, grounded movement |
| `--ease-dramatic` | High-impact cinematic reveals |

### Properties
- **Distance:** `--motion-distance-xs` (5px), `sm` (10px), `md` (20px), `lg` (40px)
- **Scale:** `--motion-scale-sm` (0.95), `md` (1.05), `lg` (1.1)
- **Opacity:** `--motion-opacity-hidden` (0), `soft` (0.5), `full` (1)
- **Rotation:** `--motion-rotation-subtle` (3deg)

## 3. Animation Categories
1. **Level 1: Micro Interaction:** Buttons, links, cursors. High speed, subtle distance.
2. **Level 2: Component Motion:** Cards, product tiles, drawers, modals. Medium speed.
3. **Level 3: Section Motion:** Hero headers, storytelling blocks. Staggered reveals.
4. **Level 4: Cinematic Motion:** Page transitions, immersive WebGL. Slow, dramatic easing.

## 4. GSAP Utility API
Future animations must utilize the centralized GSAP engine via `window.AERIDIAN.Utils.Motion`:
- `fadeIn(targets, vars)`
- `fadeOut(targets, vars)`
- `slideUp(targets, vars)`
- `slideDown(targets, vars)`
- `scaleIn(targets, vars)`
- `scaleOut(targets, vars)`
- `staggerReveal(targets, vars)`
- `parallax(targets, speed)`
- `magnetic(element, xMultiplier, yMultiplier)`

*Example:* `window.AERIDIAN.Utils.Motion.slideUp('.product-card');`

## 5. Accessibility Rules
The framework respects `prefers-reduced-motion: reduce`:
- **Decorative motion** (parallax, long slides, magnetic effects) is entirely removed by setting `--motion-distance` values to `0`.
- **Functional motion** (fade-ins for visibility) is preserved but durations are crushed to `0.01ms` to feel instant while preserving Javascript callback lifecycles.
- GSAP's global timeline is automatically fast-forwarded.

## 6. Performance Rules
Every animation must be hardware-accelerated.
- **Allowed:** `transform` (translate, scale, rotate), `opacity`, `filter` (blur, drop-shadow only when strictly necessary).
- **Prohibited:** `top`, `left`, `width`, `height`, `margin`, `padding`, `box-shadow` (unless required by design and visually unavoidable).
- **Goal:** Maintain 60 FPS by avoiding Layout and Paint thrashing.

## 7. Code Examples
```javascript
// Good
window.AERIDIAN.Utils.Motion.fadeIn('.modal');

// Good (Custom properties extending defaults)
window.AERIDIAN.Utils.Motion.slideUp('.hero-text', { 
  duration: 1.2, 
  ease: 'power4.out',
  delay: 0.2
});
```

## 8. Approved Patterns
- Transforming a drawer using `translateX(100%)` to `translateX(0)`.
- Fading in images using `opacity`.
- Scaling product cards on hover using `transform: scale(var(--motion-scale-md))`.

## 9. Prohibited Patterns
- Animating `height: 0` to `height: auto` without a transform workaround.
- Using jQuery `.slideDown()`.
- Hardcoding `transition: all 0.3s ease;` (Use CSS variables).

## 10. Future Integration Guide
For Phase 20 and beyond:
1. Wait for `DOMContentLoaded` or `shopify:section:load`.
2. Select your targets.
3. Call the appropriate method from `window.AERIDIAN.Utils.Motion`.
4. Ensure the element is cleaned up in `destroy()` if it uses a ScrollTrigger.
