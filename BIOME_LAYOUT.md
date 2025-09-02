# 🌲 Biome Layout Map

## Overview
The world is now divided into 4 distinct biomes, each with its own tree type and characteristics.

## Biome Regions

### 🍃 **Oak Forest** (Northwest)
- **Location**: x: 400-1200, y: 400-1200
- **Tree Type**: tree-1 (Oak trees)
- **Tree Count**: 18 trees
- **Herbs**: 5 mysterious herbs
- **Characteristics**: Dense forest with classic oak trees, good for early exploration

### 🌲 **Pine Grove** (Northeast)  
- **Location**: x: 2800-4000, y: 400-1200
- **Tree Type**: tree-2 (Pine trees)
- **Tree Count**: 18 trees
- **Herbs**: 5 mysterious herbs
- **Characteristics**: Tall pine trees, more open spacing, northern climate feel

### 🌳 **Ancient Grove** (Central)
- **Location**: x: 1800-2600, y: 1400-2200
- **Tree Type**: tree-2-second (Ancient trees)
- **Tree Count**: 9 trees (larger, more spread out)
- **Herbs**: 4 mysterious herbs (rare and valuable)
- **Characteristics**: Massive ancient trees, mystical atmosphere, central location

### 🌸 **Cherry Blossom Grove** (Southwest)
- **Location**: x: 400-1200, y: 2800-3600
- **Tree Type**: tree-3 (Cherry blossom trees)
- **Tree Count**: 18 trees
- **Herbs**: 5 mysterious herbs
- **Characteristics**: Beautiful cherry blossoms, peaceful southern region

## Map Layout

```
┌─────────────────────────────────────────────────────────┐
│  🌲 Pine Grove (Northeast)    │    🍃 Oak Forest (NW)   │
│  tree-2 (18 trees)           │    tree-1 (18 trees)    │
│  5 herbs                     │    5 herbs              │
│  x: 2800-4000, y: 400-1200   │    x: 400-1200, y: 400-1200 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│              🌳 Ancient Grove (Central)                 │
│              tree-2-second (9 trees)                    │
│              4 herbs (rare)                             │
│              x: 1800-2600, y: 1400-2200                 │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  🌸 Cherry Blossom Grove (SW) │                         │
│  tree-3 (18 trees)           │                         │
│  5 herbs                     │                         │
│  x: 400-1200, y: 2800-3600   │                         │
└─────────────────────────────────────────────────────────┘
```

## Biome Features

### Tree Distribution
- **Total Trees**: 63 trees across all biomes
- **Density**: Varies by biome (Ancient Grove is more sparse)
- **Spacing**: Regular grid pattern within each biome
- **Fruit**: Each tree spawns 1-3 fruit items

### Herb Distribution  
- **Total Herbs**: 19 mysterious herbs
- **Biome-specific**: Herbs are placed within each biome's boundaries
- **Quest Integration**: All herbs count toward the "collect 5 mysterious herb" quest
- **Rarity**: Ancient Grove has fewer but more valuable herbs

### Exploration Benefits
- **Visual Variety**: Each biome has distinct tree types and animations
- **Strategic Placement**: Biomes are positioned for natural exploration flow
- **Resource Distribution**: Herbs and fruit spread across all regions
- **Atmosphere**: Each biome creates a unique environmental feel

## Technical Details

### Tree Types & Animations
- **tree-1**: 6 animation variants (tree-1-anim0 through tree-1-anim5)
- **tree-2**: 4 animation variants (tree-2-anim0 through tree-2-anim3)  
- **tree-2-second**: 4 animation variants (tree-2-anim4 through tree-2-anim7)
- **tree-3**: 1 animation variant (tree-3-anim)

### Scaling
- **tree-1, tree-2, tree-3**: Scale 1.0 (normal size)
- **tree-2-second**: Scale 1.5 (larger ancient trees)

### Fruit Mechanics
- **Spawn**: 1-3 fruit per tree
- **Respawn**: 30 seconds after collection
- **Positioning**: Around tree base in circular pattern
- **Sound**: collect-herb sound effect
