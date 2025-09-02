/**
 * Game Configuration Constants
 * Centralized configuration to eliminate magic numbers and improve maintainability
 */

const GameConfig = {
    // Timing constants (in milliseconds)
    TIMING: {
        SPRINT_INTERVAL: 50,
        SPRINT_DURATION: 3000,
        ATTACK_LIGHT_COOLDOWN: 1000,
        ATTACK_HEAVY_COOLDOWN: 3000,
        ENEMY_ATTACK_DELAY: 2000,
        ENEMY_RESET_DELAY: 5000,
        ENEMY_DEATH_DELAY: 1250,
        ENEMY_FADE_DELAY: 5000,
        ENEMY_REVIVE_DELAY: 5000,
        HEAL_INTERVAL: 200,
        DAMAGE_TEXT_DURATION: 500,
        CURSOR_ANIMATION_DURATION: 250,
        TREE_ANIMATION_DELAYS: [2500, 3500, 4500, 5500, 6500, 7500]
    },

    // Movement and physics constants
    MOVEMENT: {
        PLAYER_BASE_VELOCITY: 100,
        PLAYER_SPRINT_VELOCITY: 175,
        PLAYER_WATER_VELOCITY: 50,
        ENEMY_BASE_VELOCITY: 50,
        KNOCKBACK_LIGHT: 250,
        KNOCKBACK_HEAVY: 375,
        BOSS_KNOCKBACK: 400,
        ENEMY_MOVEMENT_DURATION: 750,
        ENEMY_MOVEMENT_PAUSE: 500
    },

    // Health and combat constants
    COMBAT: {
        PLAYER_MAX_HEALTH: 200,
        ENEMY_SCOUT_HEALTH: 50,
        ENEMY_OBSERVER_HEALTH: 50,
        BOSS_HEALTH: 100,
        ENEMY_SCOUT_ATTACK: 7,
        ENEMY_OBSERVER_ATTACK: 12,
        BOSS_ATTACK: 16,
        LIGHT_ATTACK_MIN: 10,
        LIGHT_ATTACK_MAX: 15,
        HEAVY_ATTACK_MIN: 20,
        HEAVY_ATTACK_MAX: 25,
        BOSS_AOE_DAMAGE_MIN: 15,
        BOSS_AOE_DAMAGE_MAX: 30,
        BOSS_HEAL_AMOUNT: 10,
        BOSS_HEAL_INTERVAL: 500
    },

    // UI and display constants
    UI: {
        HEALTH_BAR_WIDTH: 150,
        HEALTH_BAR_HEIGHT: 10,
        STAMINA_BAR_WIDTH: 150,
        STAMINA_BAR_HEIGHT: 5,
        HEALTH_BAR_OFFSET_X: 75,
        HEALTH_BAR_OFFSET_Y: 165,
        STAMINA_BAR_OFFSET_Y: 155,
        QUEST_TRACKER_OFFSET_X: 10,
        QUEST_TRACKER_OFFSET_Y: 200,
        QUEST_TRACKER_BODY_OFFSET_Y: 170
    },

    // Detection and range constants
    DETECTION: {
        DEFAULT_DISTANCE: 150,
        BOSS_DETECTION: 650,
        ENEMY_OBSERVER_DETECTION: 200,
        ITEM_DETECTION: 100,
        BOSS_AOE_RANGE: 50
    },

    // Animation frame rates
    ANIMATION: {
        PLAYER_WALK_FRAMERATE: 10,
        ENEMY_IDLE_FRAMERATE: 10,
        ENEMY_DEATH_FRAMERATE: 6,
        BOSS_IDLE_FRAMERATE: 6,
        BOSS_DEATH_FRAMERATE: 6,
        BOSS_AOE_FRAMERATE: 8,
        QUEST_ICON_FRAMERATE: 5,
        WATER_FRAMERATE: 4,
        TREE_FRAMERATE: 3,
        BUSH_FRAMERATE: 5
    },

    // Scale constants
    SCALE: {
        PLAYER: 1.65,
        ENTITY_BASE: 2.5,
        ENEMY: 1.25,
        TREE: 2.5,
        WATER: 2.5,
        BUSH: 2,
        UI_BUTTON: 2,
        UI_SMALL: 0.75,
        UI_TINY: 0.5
    },

    // Spawn positions (hardcoded values that should be configurable)
    SPAWN: {
        PLAYER_X: 200,
        PLAYER_Y: 200
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameConfig
}
