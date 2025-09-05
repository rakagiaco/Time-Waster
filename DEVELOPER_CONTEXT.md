# Time-Waster RPG - Developer Context & Rules

## 🚨 CRITICAL RULES - NEVER BREAK THESE

### 1. SPAWN VALUES - ABSOLUTE REQUIREMENT
- **NEVER hardcode spawn positions** - XERXSEIZE was very clear about this
- **ALWAYS use tilemap object layers** for spawn points:
  - Player spawn: `player_spawn` object
  - Tree of Life spawn: `tree_of_life_spawn` object  
  - NPC spawn: `npc_spawn` object
- If spawn points don't exist in tilemap, **CREATE THEM** or **ERROR OUT CLEANLY**

### 2. CODE ORGANIZATION PRINCIPLES
- **Consolidate redundant functions** - don't repeat the same logic
- **Use utility functions** from `src/lib/HelperFunc.ts` for common patterns
- **Remove unused code** - dead functions and methods should be deleted
- **Follow existing patterns** - don't reinvent the wheel

### 3. ANIMATION HANDLING
- **Use consolidated functions**:
  - `createWalkingAnimation()` for walking/idle animations
  - `createIdleAnimation()` for single-frame idle animations
  - `createAttackAnimation()` for attack/death animations
  - `createTreeAnimation()` for tree animations with repeat delays
- **Use safe animation playing**:
  - `safePlayAnimation()` instead of direct `anims.play()`
  - `safeStopAnimation()` instead of direct `anims.stop()`

### 4. INPUT HANDLING
- **Use consolidated input functions**:
  - `isMovementKeyPressed()` for movement key checks
  - `isKeyPressed()` for single key checks
  - `isKeyJustPressed()` for single-press detection
- **Always check for null keys** before using them

### 5. ERROR HANDLING
- **Use consolidated error logging**:
  - `logCriticalError()` for critical errors
  - `logGlobalError()` for global errors
- **Don't use scattered console.error patterns**

## 📁 KEY FILE STRUCTURE

### Core Files
- `src/main.ts` - Game entry point
- `src/scenes/game/World.ts` - Main game scene
- `src/lib/HelperFunc.ts` - Utility functions library
- `src/scenes/general/Loader.ts` - Asset loading and animation setup

### Prefabs
- `src/prefabs/Player.ts` - Player character
- `src/prefabs/Enemy.ts` - Enemy AI
- `src/prefabs/UnifiedNPC.ts` - NPCs
- `src/prefabs/Weapon.ts` - Weapons
- `src/prefabs/Item.ts` - Items

### Systems
- `src/systems/DayNightCycle.ts` - Day/night system
- `src/systems/MusicManager.ts` - Audio management
- `src/systems/Pathfinding.ts` - AI pathfinding

## 🔧 COMMON PATTERNS TO FOLLOW

### State Machine Pattern
```typescript
class EntityState extends State {
    enter(scene: Phaser.Scene, entity: Entity): void {
        // Setup state
    }
    
    execute(scene: Phaser.Scene, entity: Entity): void {
        // State logic
    }
}
```

### Animation Pattern
```typescript
// Instead of:
if (entity.anims.exists(animKey)) {
    entity.anims.play(animKey, true);
}

// Use:
safePlayAnimation(entity, animKey);
```

### Input Pattern
```typescript
// Instead of:
if (keyUp && keyUp.isDown) { ... }

// Use:
if (isKeyPressed(keyUp)) { ... }
```

## 🚫 WHAT NOT TO DO

1. **Don't hardcode positions** - use tilemap objects
2. **Don't repeat code** - consolidate into utilities
3. **Don't leave unused functions** - delete them
4. **Don't use direct animation calls** - use safe functions
5. **Don't scatter error logging** - use consolidated functions
6. **Don't break existing functionality** - test changes

## 🧪 TESTING CHECKLIST

Before considering changes complete:
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] No linter errors (`npm run lint` or similar)
- [ ] Game runs without console errors
- [ ] Spawn points work from tilemap objects
- [ ] Animations play correctly
- [ ] Input handling works
- [ ] No unused functions remain

## 📝 RECENT CHANGES LOG

### Major Consolidations Completed
1. **Error Logging**: Consolidated scattered error patterns
2. **Animation Creation**: Consolidated 50+ animation creation calls
3. **Input Handling**: Consolidated key checking patterns
4. **Animation Playing**: Consolidated animation playing patterns
5. **Spawn Values**: Fixed hardcoded spawn positions

### Files Modified
- `src/lib/HelperFunc.ts` - Added utility functions
- `src/scenes/game/World.ts` - Fixed spawn values
- `src/scenes/general/Loader.ts` - Consolidated animations
- `src/prefabs/Player.ts` - Updated patterns
- `src/prefabs/Enemy.ts` - Updated patterns

## 🎯 CURRENT STATE

The codebase has been cleaned up and consolidated. All major redundant patterns have been addressed. The game should be functional with:
- Proper spawn point handling from tilemap
- Consolidated utility functions
- Clean, maintainable code structure
- No unused functions or dead code

## 🔄 NEXT SESSION PROTOCOL

1. **Read this file first** to understand context
2. **Check for any new issues** that may have arisen
3. **Follow the established patterns** and rules
4. **Test thoroughly** before considering changes complete
5. **Update this file** if new patterns or rules are established
