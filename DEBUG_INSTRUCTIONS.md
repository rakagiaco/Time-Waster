# 🐛 Debug System Instructions

## Overview
A comprehensive debugging tool has been implemented for the game with toggle functionality and visual UI elements.

## Controls

### Primary Debug Controls
- **F1** - Toggle debug mode ON/OFF
- **F2** - Toggle collision boxes visibility
- **F3** - Toggle path visualization (when available)

## Debug Information Displayed

### Real-time Game Stats
- **FPS** - Current frames per second
- **Entity Count** - Total entities (enemies, allies, player)
- **Player Information**:
  - Position coordinates (x, y)
  - Health (current/max)
  - Velocity (x, y)
- **Camera Information**:
  - Position (scroll x, y)
  - Zoom level
  - World bounds
- **Active Animations** - Currently playing animations for all entities
- **Input Keys** - Shows which keys are currently pressed

### Visual Debug Elements

#### Collision Boxes
- **Green** - Player collision box
- **Red** - Enemy collision boxes
- **Blue** - Ally collision boxes

#### Entity Information
- **Name tags** above each entity showing:
  - Entity type and index
  - Current health/max health

#### Color Coding
- **Green** - Player
- **Red** - Enemies
- **Blue** - Allies
- **Orange** - Patrol paths (when implemented)

## How to Use

1. **Start the game** and enter the World scene
2. **Press F1** to enable debug mode
3. **Debug panel** appears in top-left corner with all information
4. **Visual elements** are drawn over the game world
5. **Press F1 again** to disable debug mode

## Debug Panel Layout

```
┌─────────────────────────────────────┐
│ DEBUG MODE                          │
├─────────────────────────────────────┤
│ FPS: 60                            │
│ Entities: 25 (Enemies: 20, Allies: 4, Items: 1) │
│                                     │
│ Player Position: (1250, 800)       │
│ Player Health: 100/100             │
│ Player Velocity: (0, 0)            │
│                                     │
│ Camera Position: (1000, 600)       │
│ Camera Zoom: 1.50                  │
│ World Bounds: 4800 x 4000          │
│                                     │
│ Active Animations:                 │
│ Player: player-idle                │
│ Enemy0: enemy-1-idle               │
│                                     │
│ Input Keys:                        │
│   W/Up: PRESSED                    │
│   D/Right: PRESSED                 │
└─────────────────────────────────────┘
```

## Technical Details

- **Debug Manager** - Centralized debug system in `src/debug/DebugManager.ts`
- **Integration** - Fully integrated into World scene
- **Performance** - Minimal impact when disabled
- **Memory** - Automatically cleans up visual elements each frame
- **Depth Management** - Debug elements render above game content

## Troubleshooting

- If debug panel doesn't appear, check console for errors
- If collision boxes are too small/large, entity scaling may need adjustment
- If input keys don't show, check that keyboard input is working
- Debug mode automatically disables when switching scenes

## Future Enhancements

- Add memory usage tracking
- Add render time profiling
- Add enemy AI state visualization
- Add quest system debugging
- Add inventory debugging
- Add minimap debugging overlay
