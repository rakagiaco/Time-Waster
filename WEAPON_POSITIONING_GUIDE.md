# Dynamic Weapon Positioning System

## Overview

The sword positioning system now uses **dynamic calculations** based on character dimensions instead of hardcoded values. This makes it maintainable, scalable, and perfect for multiplayer.

## How It Works

### 🎯 **Dynamic Offsets**
- **Horizontal**: 50% of character width
- **Vertical**: 25% of character height  
- **Left/Right**: 12.5% of character height (smaller offset)

### 🔧 **Configuration System**
All positioning is controlled by the `WEAPON_CONFIG` object:

```typescript
private static readonly WEAPON_CONFIG = {
    HORIZONTAL_OFFSET: 0.5,        // 50% of character width
    VERTICAL_OFFSET: 0.25,         // 25% of character height
    VERTICAL_OFFSET_SMALL: 0.125,  // 12.5% for left/right
    SCALE_MULTIPLIER: 0.3,         // 30% of character size
    FALLBACK_WIDTH: 16,            // Fallback if physics body unavailable
    FALLBACK_HEIGHT: 16
};
```

## Easy Adjustment

### **Fine-tune Positioning**
```typescript
// Make sword closer to character
Player.adjustWeaponConfig({
    HORIZONTAL_OFFSET: 0.4,  // 40% instead of 50%
    VERTICAL_OFFSET: 0.2     // 20% instead of 25%
});

// Make sword larger
Player.adjustWeaponConfig({
    SCALE_MULTIPLIER: 0.4    // 40% instead of 30%
});
```

### **Debug Current Settings**
```typescript
const config = Player.getWeaponConfig();
console.log('Current weapon config:', config);
```

## Positioning Logic

### **Down Direction**
- Position: Right hip
- Offset: `+50% width, +25% height`
- Rotation: 0°
- Flip: None

### **Up Direction**  
- Position: Left shoulder/back
- Offset: `-50% width, -25% height`
- Rotation: 0°
- Flip: None

### **Left Direction**
- Position: Left hip
- Offset: `-50% width, +12.5% height`
- Rotation: 0°
- Flip: Horizontal

### **Right Direction**
- Position: Right hip
- Offset: `+50% width, +12.5% height`
- Rotation: 0°
- Flip: None

## Benefits

✅ **No Hardcoded Values** - Everything calculated dynamically
✅ **Character Size Aware** - Adapts to different character sizes
✅ **Easily Configurable** - Adjust with simple percentage changes
✅ **Multiplayer Ready** - Same logic on all clients
✅ **Maintainable** - Clear, documented configuration
✅ **Performance Optimized** - Minimal calculations per frame

## Example Usage

```typescript
// In your game initialization
Player.adjustWeaponConfig({
    HORIZONTAL_OFFSET: 0.6,  // Sword further from center
    VERTICAL_OFFSET: 0.3,    // Sword lower on character
    SCALE_MULTIPLIER: 0.35   // Slightly larger sword
});

// The sword will automatically use these new values
// for all positioning calculations
```

This system ensures your sword positioning looks perfect regardless of character size changes, sprite updates, or different character types!

