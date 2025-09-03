/**
 * Helper Functions Library
 * 
 * Collection of utility functions used throughout the game for common operations
 * including UI management, movement calculations, collision detection, and
 * game state management.
 * 
 * Original implementation by C.J. Moshy for 'Time Waster'
 * Organized by functionality:
 * - UI and Interface Management
 * - Player Detection and AI
 * - Movement and Physics
 * - Quest System
 * - Audio Management
 * - Cleanup Utilities
 */

import { Scene } from 'phaser';
import { GameScene, Player, GameItem } from '../types/GameTypes';
import GameConfig from '../config/GameConfig';


// =============================================================================
// UI AND INTERFACE MANAGEMENT
// =============================================================================

/**
 * Creates an interactive loot interface window for item pickup
 * 
 * Displays a modal window allowing the player to collect items from the world.
 * Automatically handles inventory updates, quest progress, and audio feedback.
 * All window elements are properly cleaned up on closure.
 * 
 * @param item - The collectible item to display
 * @param contextScene - The scene to create the window in
 * @param player - The player object for inventory and state management
 * @param miniMapCamera - Camera to exclude window elements from minimap
 */
export function createLootInterfaceWindow(item: GameItem, contextScene: GameScene, player: Player, miniMapCamera: Phaser.Cameras.Scene2D.Camera): void {
    let closeBTN: Phaser.GameObjects.BitmapText, itemImg: Phaser.GameObjects.Image;
    
    // Create modal window background
    const window = contextScene.add.graphics().setDepth(2);
    window.fillStyle(0x000000, 1); // Black background with full opacity
    window.fillRect(
        contextScene.cameras.main.scrollX + contextScene.cameras.main.width / 2 - 100, 
        contextScene.cameras.main.scrollY + contextScene.cameras.main.height / 2 - 100, 
        200, 200
    );

    // Update player state to prevent movement during interaction
    player.windowOpen = true;
    player.animsFSM.transition('interacting');

    closeBTN = contextScene.add.bitmapText(contextScene.cameras.main.scrollX + contextScene.cameras.main.width / 2 - 90, contextScene.cameras.main.scrollY + contextScene.cameras.main.height / 2 - 100, '8-bit-white', 'exit', 25)
    closeBTN.setInteractive().setDepth(2)
    closeBTN.on('pointerdown', () => {
        toggleCursor(contextScene)
        window.destroy()
        closeBTN.destroy()
        itemImg.destroy()
        player.windowOpen = false
        player.animsFSM.transition('idle')
    })

    itemImg = contextScene.add.image(contextScene.cameras.main.scrollX + contextScene.cameras.main.width / 2, contextScene.cameras.main.scrollY + contextScene.cameras.main.height / 2, item.item_type).setOrigin(0.5).setInteractive().setDepth(2).on('pointerdown', () => {
        let invUpd = player
        invUpd.p1Inventory.add(item.item_type, 1)
        let alias = player.questStatus

        if (alias.finished === false) {
            if (alias.currentQuest.verb === 'collect' && alias.currentQuest.type == item.item_type) {
                if (alias.currentQuest.ammount > alias.currentQuest.actual) {
                    alias.currentQuest.actual += 1
                }
            }
        }

        if (item.soundEffect !== undefined) {
            contextScene.sound.play(item.soundEffect.sound, { volume: item.soundEffect.volume })
        }

        toggleCursor(contextScene)
        window.destroy()
        closeBTN.destroy()
        itemImg.destroy()
        item.destroy()
        player.windowOpen = false
        player.animsFSM.transition('idle')
    })

    let winAr = [window, closeBTN, itemImg]
    miniMapCamera.ignore(winAr)
    player.currentWindow.objs = winAr


}

// =============================================================================
// PLAYER DETECTION AND AI
// =============================================================================

/**
 * Advanced player detection system with environmental awareness
 * 
 * Determines if a listener entity can detect the player based on distance,
 * lighting conditions, and environmental factors. Supports dynamic detection
 * ranges influenced by day/night cycles and light sources.
 * 
 * @param scene - The game scene containing the player
 * @param listener - The entity attempting to detect the player
 * @returns True if the player is within effective detection range
 */
export function listen(scene: GameScene, listener: any): boolean {
    // Get player from the scene - handle both old and new scene structures
    let player: any;
    if ((scene as any).p1) {
        player = (scene as any).p1;
    } else if ((scene as any).player) {
        player = (scene as any).player;
    } else {
        // Try to find player by searching through children
        scene.children.list.forEach(child => {
            if (child.constructor.name === 'Player') {
                player = child;
            }
        });
    }

    if (!player) {
        console.warn('No player found in scene for listen function');
        return false;
    }

    // Try getPosition method first, fallback to direct x,y properties
    let playerX: number, playerY: number;
    if (player.getPosition && typeof player.getPosition === 'function') {
        const pos = player.getPosition();
        playerX = pos[0];
        playerY = pos[1];
    } else {
        playerX = player.x;
        playerY = player.y;
    }

    if (listener.detectionDistance === 0 || listener.detectionDistance === undefined) {
        listener.detectionDistance = GameConfig.DETECTION.DEFAULT_DISTANCE;
    }

    const distance = Math.sqrt(
        Math.pow(playerX - listener.x, 2) + Math.pow(playerY - listener.y, 2)
    );

    let effectiveDetectionDistance = listener.detectionDistance;

    // Check for stealth mechanics based on lighting conditions
    if ((scene as any).dayNightCycle) {
        const dayNightCycle = (scene as any).dayNightCycle;
        const isNight = dayNightCycle.isCurrentlyNight();
        const darknessIntensity = dayNightCycle.getDarknessIntensity();

        if (isNight && darknessIntensity > 0.3) {
            // Reduce detection distance at night
            effectiveDetectionDistance = listener.detectionDistance * (1 - darknessIntensity * 0.6);

            // Check if player is in flashlight or tree light
            let playerInLight = false;

            // Check flashlight
            if ((scene as any).flashlight && (scene as any).flashlight.isLightActive()) {
                if ((scene as any).flashlight.isPointInLight(playerX, playerY)) {
                    playerInLight = true;
                    // Restore full detection when in flashlight
                    effectiveDetectionDistance = listener.detectionDistance;
                }
            }

            // Check tree lights
            if (!playerInLight && (scene as any).treeLightEmission && (scene as any).treeLightEmission.isLightActive()) {
                if ((scene as any).treeLightEmission.isPointInTreeLight(playerX, playerY)) {
                    playerInLight = true;
                    // Restore partial detection when in tree light
                    effectiveDetectionDistance = listener.detectionDistance * 0.8;
                }
            }

            // If player is in darkness and not in any light, detection is much harder
            if (!playerInLight) {
                effectiveDetectionDistance = Math.max(effectiveDetectionDistance * 0.3, 50); // Minimum 50 pixel detection
            }
        }
    }

    const isInRange = distance <= effectiveDetectionDistance;

    // Debug logging (can be removed later)
    if (isInRange) {
        console.log(`Enemy ${listener.entity_type} detected player at distance ${distance.toFixed(1)} (effective range: ${effectiveDetectionDistance.toFixed(1)})`);
    }

    return isInRange;
}

// =============================================================================
// QUEST SYSTEM
// =============================================================================

/**
 * Creates a quest object from JSON data with inventory synchronization
 * 
 * Parses quest configuration files and creates standardized quest objects.
 * Automatically syncs current progress with player inventory for collection quests.
 * 
 * @param jsonData - Quest configuration data from JSON file
 * @param player - Player object with inventory access
 * @returns Formatted quest object with current progress
 */
export function CreateQuestObject(jsonData: any, player: any): any {
    let returnObj = {
        "questnumber": jsonData.questdata.questnumber,
        "verb": jsonData.questdata.verb,
        "type": jsonData.questdata.type,
        "amount": jsonData.questdata.ammount, // Note: JSON uses misspelled "ammount" but we correct it here
        "actual": 0
    }

    let x = player.p1Inventory.get(jsonData.questdata.type)

    x === false ? undefined : returnObj.actual = x

    return returnObj
}

/**
 * Calculates knockback direction vector between two entities
 * 
 * Determines the direction an entity should be knocked back when hit by another.
 * Uses position comparison with small offset tolerance for consistent behavior.
 * 
 * @param toknock - Entity being knocked back
 * @param knocker - Entity causing the knockback
 * @returns Normalized direction vector for knockback force
 */
export function determineKnockbackDirection(toknock: any, knocker: any): Phaser.Math.Vector2 {
    if (!toknock || !knocker || !toknock.getPosition || !knocker.getPosition) {
        console.warn('Invalid objects passed to determineKnockbackDirection');
        return new Phaser.Math.Vector2(0, 0);
    }

    let pos = toknock.getPosition()
    let epos = knocker.getPosition()

    let returnVec = new Phaser.Math.Vector2(0)
    //xpos
    if (pos[0] < (epos[0] + 10)) {
        returnVec.x = -1
    } else {
        returnVec.x = 1
    }

    if (pos[1] < (epos[1] + 10)) {
        returnVec.y = -1
    } else {
        returnVec.y = 1
    }

    returnVec.normalize()

    return returnVec
}

/**
 * Provides visual feedback for UI interactions
 * 
 * Briefly changes the cursor sprite to indicate successful clicks or interactions.
 * Uses a timed callback to restore the original cursor after a short duration.
 * 
 * @param scene - The scene to apply cursor changes to
 */
export function toggleCursor(scene: Scene): void {
    scene.input.setDefaultCursor('url(assets/img/cursor-2.png), pointer')
    scene.time.delayedCall(GameConfig.TIMING.CURSOR_ANIMATION_DURATION, () => { scene.input.setDefaultCursor('url(assets/img/cursor.png), pointer') })
}

// =============================================================================
// MOVEMENT AND PHYSICS
// =============================================================================

/**
 * Random movement system for enemy AI patrol behavior
 * 
 * Generates randomized movement patterns for entities to create natural
 * patrol behavior. Uses timed sequences of movement and pauses to prevent
 * predictable or mechanical AI behavior.
 * 
 * @param entity - The entity to apply movement to
 * @param scene - The scene for timer management
 */
export function updateMovement(entity: any, scene: Scene): void {
    var decider = Math.round(Math.random() * 4)
    switch (decider) {
        case 1:
            entity.setVelocityX(entity.VELOCITY)
            scene.time.delayedCall(GameConfig.MOVEMENT.ENEMY_MOVEMENT_DURATION, () => {
                entity.setVelocity(0)
                scene.time.delayedCall(GameConfig.MOVEMENT.ENEMY_MOVEMENT_PAUSE, () => { entity.setVelocityX(-entity.VELOCITY) })
            })
            break
        case 2:
            entity.setVelocityX(-entity.VELOCITY)
            scene.time.delayedCall(GameConfig.MOVEMENT.ENEMY_MOVEMENT_DURATION, () => {
                entity.setVelocity(0)
                scene.time.delayedCall(GameConfig.MOVEMENT.ENEMY_MOVEMENT_PAUSE, () => { entity.setVelocityX(entity.VELOCITY) })
            })
            break
        case 3:
            entity.setVelocityY(entity.VELOCITY)
            scene.time.delayedCall(GameConfig.MOVEMENT.ENEMY_MOVEMENT_DURATION, () => {
                entity.setVelocity(0)
                scene.time.delayedCall(GameConfig.MOVEMENT.ENEMY_MOVEMENT_PAUSE, () => { entity.setVelocityY(-entity.VELOCITY) })
            })
            break
        case 4:
            entity.setVelocityY(-entity.VELOCITY)
            scene.time.delayedCall(GameConfig.MOVEMENT.ENEMY_MOVEMENT_DURATION, () => {
                entity.setVelocity(0)
                scene.time.delayedCall(GameConfig.MOVEMENT.ENEMY_MOVEMENT_PAUSE, () => { entity.setVelocityY(entity.VELOCITY) })
            })
            break
    }
}

/**
 * Handles smooth player movement with animation updates
 * 
 * Processes keyboard input to move the player character with proper
 * diagonal movement normalization and directional animations. Supports
 * both normal and sprint movement speeds.
 * 
 * @param player - The player entity to move
 * @param keyUp - Up arrow/W key state
 * @param keyDown - Down arrow/S key state  
 * @param keyLeft - Left arrow/A key state
 * @param keyRight - Right arrow/D key state
 * @param isSprinting - Whether sprint modifier is active
 */
export function updatePlayerMovement(player: any, keyUp: Phaser.Input.Keyboard.Key, keyDown: Phaser.Input.Keyboard.Key, keyLeft: Phaser.Input.Keyboard.Key, keyRight: Phaser.Input.Keyboard.Key, isSprinting: boolean = false): void {
    // Determine movement speed based on sprint state
    const velocity = isSprinting ? GameConfig.MOVEMENT.PLAYER_SPRINT_VELOCITY : GameConfig.MOVEMENT.PLAYER_BASE_VELOCITY;

    let vx = 0;
    let vy = 0;

    // Process input keys for movement direction
    if (keyUp.isDown) vy -= velocity;
    if (keyDown.isDown) vy += velocity;
    if (keyLeft.isDown) vx -= velocity;
    if (keyRight.isDown) vx += velocity;

    // Normalize diagonal movement to prevent faster diagonal speed
    if (vx !== 0 && vy !== 0) {
        vx *= 0.707; // 1/√2 ≈ 0.707
        vy *= 0.707;
    }

    // Apply calculated velocity to player
    player.setVelocity(vx, vy);

    // Update directional animations based on primary movement axis
    if (vx !== 0 || vy !== 0) {
        if (Math.abs(vy) > Math.abs(vx)) {
            // Vertical movement takes priority
            if (vy < 0) {
                player.anims.play('player-walk-up', true);
            } else {
                player.anims.play('player-walk-down', true);
            }
        } else {
            // Horizontal movement takes priority
            if (vx < 0) {
                player.anims.play('player-walk-left', true);
            } else {
                player.anims.play('player-walk-right', true);
            }
        }
    }
}

/**
 * AI pursuit behavior for enemy entities
 * 
 * Calculates movement vector for an entity to pursue the player.
 * Uses normalized direction vectors for consistent pursuit speed.
 * 
 * @param _scene - The game scene (unused but kept for interface consistency)
 * @param entity - The entity that will pursue the player
 * @param player - The player to pursue
 */
export function pursuit(_scene: Scene, entity: any, player: any): void {
    let x = player.getPosition()
    let x1 = x[0]
    let y1 = x[1]

    let vector = new Phaser.Math.Vector2(0, 0)

    if (x1 < entity.x) {
        vector.x = -1
    } else if (x1 > entity.x) {
        vector.x = 1
    }

    if (y1 < entity.y) {
        vector.y = -1
    } else if (y1 > entity.y) {
        vector.y = 1
    }

    vector.normalize()
    entity.setVelocity(entity.VELOCITY * vector.x, entity.VELOCITY * vector.y)
}

// =============================================================================
// AUDIO MANAGEMENT
// =============================================================================

/**
 * Safely stops audio playback with proper state checking
 * 
 * Prevents errors by checking if sound exists and is currently playing
 * before attempting to stop it. Essential for preventing audio-related crashes.
 * 
 * @param sound - The Phaser sound object to stop
 */
export function safeStopSound(sound: Phaser.Sound.BaseSound): void {
    if (sound && sound.isPlaying) {
        sound.stop()
    }
}

// =============================================================================
// CLEANUP UTILITIES
// =============================================================================

/**
 * Comprehensive timer cleanup for all game entities
 * 
 * Ensures all active intervals and timers are properly cleared when changing
 * scenes or resetting game state. Prevents memory leaks and timer conflicts.
 * 
 * @param _scene - The game scene (unused but kept for interface consistency)
 * @param enemies - Array of enemy entities to clean up
 * @param player - The player entity to clean up
 */
export function clearAllInterval(_scene: Scene, enemies: any[], player: any): void {
    enemies.forEach(element => {
        if (element.INTERVAL_ID) {
            clearInterval(element.INTERVAL_ID)
        }
    })
    if (player.INTERVAL_ID) {
        clearInterval(player.INTERVAL_ID)
    }
    if (player.SPRINT_INTERVAL_ID) {
        clearInterval(player.SPRINT_INTERVAL_ID)
    }
}