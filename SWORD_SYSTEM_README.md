# Medieval Sword System

This document describes the medieval sword system implemented for the Time Waster game. The system includes graphic rendering, sprite generation, and item integration.

## Overview

The sword system consists of several components:

1. **MedievalSword** - Weapon class with stats, durability, and enchantments
2. **Inventory Integration** - Extended inventory system to handle weapons
3. **World Integration** - Sword spawning and collection in the game world

## Components

### MedievalSword (`src/prefabs/Weapon.ts`)

Weapon class extending the base Item class with:

**Properties:**
- `weaponStats` - Damage, attack speed, durability, rarity, enchantments
- `isEquipped` - Whether the weapon is currently equipped
- `iconTexture` - Texture key for inventory display

**Rarity System:**
- **Common**: Iron Sword (15 damage, 1.2 attack speed, 100 durability)
- **Uncommon**: Steel Sword (20 damage, 1.3 attack speed, 120 durability)
- **Rare**: Silver Sword (28 damage, 1.4 attack speed, 150 durability)
- **Epic**: Mithril Sword (40 damage, 1.5 attack speed, 200 durability)
- **Legendary**: Excalibur (60 damage, 1.6 attack speed, 300 durability)

**Enchantments:**
- **Sharp I-IV**: +5 damage per level
- **Durable I-IV**: Increases max durability
- **Swift I-III**: +0.1 attack speed per level
- **Vampiric I-II**: Life steal effects
- **Lightning I**: Electric damage

**Methods:**
- `getWeaponStats()` - Returns weapon statistics
- `getEffectiveDamage()` - Damage including enchantment bonuses
- `getEffectiveAttackSpeed()` - Attack speed including enchantment bonuses
- `reduceDurability(amount)` - Reduces weapon durability
- `repairWeapon(amount?)` - Repairs weapon durability

### Inventory System (`src/prefabs/Inventory.ts`)

Extended to support weapons:

**New Properties:**
- `weapons: WeaponData[]` - Array of weapon data
- `maxWeapons: number` - Maximum weapons that can be carried (10)

**New Methods:**
- `addWeapon(weaponData)` - Adds a weapon to inventory
- `getWeapons()` - Returns all weapons
- `removeWeapon(index)` - Removes weapon by index
- `canAddWeapon()` - Checks if inventory has space for weapons

### World Integration (`src/scenes/game/World.ts`)

**Sword Spawning:**
- Supports tilemap object spawn points: `sword_spawn`, `rare_sword_spawn`, `epic_sword_spawn`, `legendary_sword_spawn`
- Development test swords spawn near Narvark for testing

**Collection System:**
- Player overlap detection for item collection
- Separate handling for weapons vs regular items
- Automatic inventory management

## Usage

### Creating a Sword

```typescript
// Create a legendary sword at position (100, 100)
const sword = new MedievalSword(scene, 100, 100, 'legendary');

// Get weapon stats
const stats = sword.getWeaponStats();
console.log(`Damage: ${stats.damage}`);
console.log(`Enchantments: ${stats.enchantments?.join(', ')}`);
```

### Adding to Inventory

```typescript
const weaponData = {
    type: 'weapon' as const,
    weaponType: 'sword',
    rarity: 'rare',
    stats: sword.getWeaponStats(),
    icon: sword.getIconTexture()
};

player.p1Inventory.addWeapon(weaponData);
```

## Visual Features

### Rarity Effects
- **Common**: White glow
- **Uncommon**: Green glow
- **Rare**: Blue glow
- **Epic**: Purple glow with pulsing effect
- **Legendary**: Orange/gold glow with pulsing effect

### Sprite Details
- **32x64 pixel** full-size sword sprites
- **16x16 pixel** inventory icons
- **Pixel-art style** matching game aesthetic
- **Medieval styling** with realistic proportions

## Development Features

### Test Swords
In development mode, test swords of all rarities spawn near Narvark for easy testing and demonstration.

## Future Enhancements

Potential improvements for the sword system:
- Weapon crafting system
- Weapon upgrade/enhancement
- Different weapon types (axes, maces, spears)
- Weapon comparison UI
- Weapon repair stations
- Enchantment crafting

## Files Modified/Created

**New Files:**
- `src/prefabs/Weapon.ts` - Weapon class
- `SWORD_SYSTEM_README.md` - This documentation

**Modified Files:**
- `src/prefabs/Inventory.ts` - Added weapon support
- `src/scenes/game/World.ts` - Added sword spawning and collection
- `src/types/GameTypes.ts` - Added weapon interfaces

The sword system is now fully integrated and ready for use in the Time Waster game!
