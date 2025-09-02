import { Scene } from 'phaser';
import { GameScene, Player, GameItem } from '../src/types/GameTypes';
import GameConfig from '../src/config/GameConfig';

/**
 * written by cj moshy for 'Time Waster'
 * set of functions that are called arbitratially or by multiple gameojbs
 */


//------CreateLootInterfaceWindow
/**
* Create a loot interface window for the given item, destroys all items associated with window upon closure of window
* 
* @param {GameItem} item The item to create loot window for
* @param {GameScene} contextScene The scene to create the window on
* @param {Player} player The player object
* @param {Phaser.Cameras.Scene2D.Camera} miniMapCamera The minimap camera
* @returns {void} 
*/
export function createLootInterfaceWindow(item: GameItem, contextScene: GameScene, player: Player, miniMapCamera: Phaser.Cameras.Scene2D.Camera): void {

    let closeBTN: Phaser.GameObjects.BitmapText, itemImg: Phaser.GameObjects.Image
    const window = contextScene.add.graphics().setDepth(2)
    window.fillStyle(0x000000, 1) // Color and alpha (transparency)
    window.fillRect(contextScene.cameras.main.scrollX + contextScene.cameras.main.width / 2 - 100, contextScene.cameras.main.scrollY + contextScene.cameras.main.height / 2 - 100, 200, 200)

    player.windowOpen = true
    player.animsFSM.transition('interacting')

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

//------listen
/**
* Takes scene and object that wants to listen for player
* 
* @param {GameScene} scene The scene where the player resides
* @param {any} listener The object seeking information on players current position
* @returns {boolean} 
*/
export function listen(scene: GameScene, listener: any): boolean {
    // Get player from the scene - handle both old and new scene structures
    let player: any;
    if ((scene as any).p1) {
        player = (scene as any).p1;
    } else if ((scene as any).player) {
        player = (scene as any).player;
    } else {
        console.warn('No player found in scene for listen function');
        return false;
    }

    if (!player || !player.getPosition) {
        console.warn('Player object or getPosition method not available');
        return false;
    }

    let x = player.getPosition()
    let x1 = x[0]
    let y1 = x[1]
    if (listener.detectionDistance === 0 || listener.detectionDistance === undefined) {
        listener.detectionDistance = GameConfig.DETECTION.DEFAULT_DISTANCE
    }
    if (x1 > (listener.x - listener.detectionDistance) && x1 < (listener.x + listener.detectionDistance) && y1 > (listener.y - listener.detectionDistance) && y1 < (listener.y + listener.detectionDistance)) {
        return true
    } else {
        return false
    }
}

//------CreateQuestObject
/**
* Takes a quest json file and a player, creates quest based on the data and p1 inventory
* 
* @param {any} jsonData a json file, formatted specifically for the 'quest' structure
* @param {any} player a player object for inventory refrence
* @returns {any} 
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

//------determineKnockbackDirection
/**
* Takes a player and entity and determines a knockback direction for the entity
*
* @param {any} toknock entity to knock
* @param {any} knocker entity that is kocking back
* @returns {Phaser.Math.Vector2}
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

//------toggleCursor
/**
*plays cursor 'anim'
*
* @param {Scene} scene the scene where the cursor exists
*/
export function toggleCursor(scene: Scene): void {
    scene.input.setDefaultCursor('url(assets/img/cursor-2.png), pointer')
    scene.time.delayedCall(GameConfig.TIMING.CURSOR_ANIMATION_DURATION, () => { scene.input.setDefaultCursor('url(assets/img/cursor.png), pointer') })
}

//------updateMovement (Enemy AI)
/**
* Takes a  entity and context scene, and randomly updates that entitys movement
*
* @param {any} entity entity to update movement for
* @param {Scene} scene the context scene
* @returns {void}
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

//------updatePlayerMovement
/**
* Updates player movement based on input keys
*
* @param {any} player the player entity
* @param {Phaser.Input.Keyboard.Key} keyUp up key
* @param {Phaser.Input.Keyboard.Key} keyDown down key
* @param {Phaser.Input.Keyboard.Key} keyLeft left key
* @param {Phaser.Input.Keyboard.Key} keyRight right key
* @param {boolean} isSprinting whether the player is sprinting
* @returns {void}
*/
export function updatePlayerMovement(player: any, keyUp: Phaser.Input.Keyboard.Key, keyDown: Phaser.Input.Keyboard.Key, keyLeft: Phaser.Input.Keyboard.Key, keyRight: Phaser.Input.Keyboard.Key, isSprinting: boolean = false): void {
    let velocity = isSprinting ? GameConfig.MOVEMENT.PLAYER_SPRINT_VELOCITY : GameConfig.MOVEMENT.PLAYER_BASE_VELOCITY;

    let vx = 0;
    let vy = 0;

    if (keyUp.isDown) vy -= velocity;
    if (keyDown.isDown) vy += velocity;
    if (keyLeft.isDown) vx -= velocity;
    if (keyRight.isDown) vx += velocity;

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
        vx *= 0.707; // 1/√2
        vy *= 0.707;
    }

    player.setVelocity(vx, vy);

    // Update animations based on movement
    if (vx !== 0 || vy !== 0) {
        if (Math.abs(vy) > Math.abs(vx)) {
            if (vy < 0) {
                player.anims.play('player-walk-up', true);
            } else {
                player.anims.play('player-walk-down', true);
            }
        } else {
            if (vx < 0) {
                player.anims.play('player-walk-left', true);
            } else {
                player.anims.play('player-walk-right', true);
            }
        }
    }
}

//------pursuit
/**
* Takes a  entity and context scene, and commands the entity to pursue the player
*
* @param {Scene} scene the context scene
* @param {any} entity entity to apply behavior to
* @param {any} player the player to pursue
* @returns {void}
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

//------safeStopSound
/**
* Safely stops a sound if it's playing
*
* @param {Phaser.Sound.BaseSound} sound The sound to stop
* @returns {void}
*/
export function safeStopSound(sound: Phaser.Sound.BaseSound): void {
    if (sound && sound.isPlaying) {
        sound.stop()
    }
}

//------clearAllInterval
/**
* Takes a scene and ensures all entities that have an interval id get it cleared
*
* @param {Scene} scene the context scene
* @param {any[]} enemies array of enemies to clear intervals from
* @param {any} player the player to clear intervals from
* @returns {void}
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