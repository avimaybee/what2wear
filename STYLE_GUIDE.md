# what2wear Style Guide

This document outlines the visual style guide for the what2wear application. It is the single source of truth for colors, typography, spacing, and component design.

## Color Palette (Dark Mode First)

The color palette is designed to be modern, bold, and visually striking, with a default dark mode theme.

| Color      | Hex       | Usage                               |
| ---------- | --------- | ----------------------------------- |
| Background | `#1B2021` | Main background                     |
| Surface    | `#30343F` | Cards, input fields, secondary surfaces |
| Primary    | `#EA638C` | Primary buttons, links, active states |
| Secondary  | `#89023E` | Secondary accents, hover states     |
| Text       | `#FFD9DA` | Body text, headings, labels         |
| Text Light | `#a9a9a9` | Secondary text, placeholders        |
| Success    | `#2ecc71` | Success messages, notifications     |
| Error      | `#e74c3c` | Error messages, notifications       |

## Typography

The primary font for the application is **Nunito Sans**. It is a clean, modern, and highly readable sans-serif font that is well-suited for mobile interfaces.

### Type Scale

The following responsive type scale should be used throughout the application. All sizes are in `rem` units.

| Element         | Mobile (`rem`) | Desktop (`rem`) | Font Weight |
| --------------- | -------------- | --------------- | ----------- |
| Heading 1 (h1)  | 2.5            | 3               | 700 (Bold)  |
| Heading 2 (h2)  | 2              | 2.5             | 700 (Bold)  |
| Heading 3 (h3)  | 1.5            | 1.75            | 600 (Semi-Bold) |
| Body            | 1              | 1               | 400 (Regular) |
| Small           | 0.875          | 0.875           | 400 (Regular) |

## Spacing

An **8px grid system** is used for all spacing and layout. All margins, paddings, and gaps should be multiples of 8px (e.g., 8px, 16px, 24px, 32px). This ensures a consistent and harmonious layout.

## Component Design

This section provides design specifications for common UI components.

### Buttons

- **Primary Button:**
  - Background: `Primary` (`#EA638C`)
  - Text: `Background` (`#1B2021`)
  - Padding: `12px 24px`
  - Border Radius: `8px`
- **Secondary Button:**
  - Background: `Surface` (`#30343F`)
  - Text: `Text` (`#FFD9DA`)
  - Padding: `12px 24px`
  - Border Radius: `8px`
- **Accent/Destructive Button:**
  - Background: `Secondary` (`#89023E`)
  - Text: `Text` (`#FFD9DA`)
  - Padding: `12px 24px`
  - Border Radius: `8px`

### Cards

- Background: `Surface` (`#30343F`)
- Padding: `16px`
- Border Radius: `12px`
- Box Shadow: `0 4px 6px rgba(0, 0, 0, 0.1)`

### Forms

- **Input Fields:**
  - Background: `Surface` (`#30343F`)
  - Border: `1px solid #4a4a4a`
  - Padding: `12px 16px`
  - Border Radius: `8px`
- **Labels:**
  - Font Size: `1rem`
  - Font Weight: `600` (Semi-Bold)
  - Color: `Text` (`#FFD9DA`)