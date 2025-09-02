/**
 * written by cj moshy for 'Time Waster'
 * set of functions that are called arbitratially or by multiple gameojbs
 */


//------CreateLootInterfaceWindow
/**
* Create a loot interface window for the given item, destroys all items associated with window upon closure of window
* 
* @param {Item} item The item to create loot window for
* @param {Phaser.Scene} contextScene The scene to create the window on
* @returns {undefined} 
*/
function createLootInterfaceWindow(item, contextScene){
    
    let closeBTN, itemImg
    const window = contextScene.add.graphics().setDepth(2)
    window.fillStyle(0x000000, 1) // Color and alpha (transparency)
    window.fillRect(contextScene.cameras.main.scrollX + contextScene.cameras.main.width/2 - 100, contextScene.cameras.main.scrollY + contextScene.cameras.main.height/2 - 100, 200, 200)

    contextScene.p1.windowOpen = true
    contextScene.p1.animsFSM.transition('interacting')

    closeBTN = contextScene.add.bitmapText(contextScene.cameras.main.scrollX + contextScene.cameras.main.width/2- 90, contextScene.cameras.main.scrollY + contextScene.cameras.main.height/2-100, '8-bit-white','exit',25)
    closeBTN.setInteractive().setDepth(2)
        closeBTN.on('pointerdown', () => {
        toggleCursor(contextScene)
        window.destroy()
        closeBTN.destroy()
        itemImg.destroy()
        contextScene.p1.windowOpen = false
        contextScene.p1.animsFSM.transition('idle')
    })

    itemImg = contextScene.add.image(contextScene.cameras.main.scrollX + contextScene.cameras.main.width/2, contextScene.cameras.main.scrollY + contextScene.cameras.main.height/2, item.item_type).setOrigin(0.5).setInteractive().setDepth(2).on('pointerdown', ()=>{
        let invUpd = contextScene.p1
        invUpd.p1Inventory.add(item.item_type, 1)
        let alias = contextScene.p1.questStatus

        if(alias.finished === false){
            if(alias.currentQuest.verb === 'collect' && alias.currentQuest.type == item.item_type){
                if(alias.currentQuest.ammount > alias.currentQuest.actual){
                    alias.currentQuest.actual += 1
                }
            }
        }

        if(item.soundEffect !== undefined){
            contextScene.sound.play(item.soundEffect.sound, {volume: item.soundEffect.volume})
        } 

        toggleCursor(contextScene)
        window.destroy()
        closeBTN.destroy()
        itemImg.destroy()
        item.destroy()
        contextScene.p1.windowOpen = false
        contextScene.p1.animsFSM.transition('idle')
    })

    let winAr = [window, closeBTN, itemImg]
    contextScene.miniMapCamera.ignore(winAr)
    contextScene.p1.currentWindow.objs = winAr


}

//------listen
/**
* Takes scene and object that wants to listen for player
* 
* @param {Phaser.Scene} scene The scene where the player resides
* @param {Phaser.GameObjects.GameObject} listener The object seeking information on players current position
* @returns {boolean} 
*/
function listen(scene, listener){
    let x = scene.p1.getPosition()
    let x1 = x[0]
    let y1 = x[1]
    if(listener.detectionDistance === 0 || listener.detectionDistance === undefined){
        listener.detectionDistance = GameConfig.DETECTION.DEFAULT_DISTANCE
    }
    if(x1 > (listener.x-listener.detectionDistance) && x1 < (listener.x+listener.detectionDistance) && y1 > (listener.y-listener.detectionDistance) && y1 < (listener.y+listener.detectionDistance)){
        return true
    } else {
        return false
    }
}

//------CreateQuestObject
/**
* Takes a quest json file and a player, creates quest based on the data and p1 inventory
* 
* @param {JSON} jsonData a json file, formatted specifically for the 'quest' structure
* @param {Player} player a player object for inventory refrence
* @returns {Object} 
*/
function CreateQuestObject(jsonData, player){
    let returnObj = {
        "questnumber" : jsonData.questdata.questnumber,
        "verb" : jsonData.questdata.verb,
        "type" : jsonData.questdata.type,
        "amount" : jsonData.questdata.ammount, // Note: JSON uses misspelled "ammount" but we correct it here
        "actual" : 0
    }

    let x = player.p1Inventory.get(jsonData.questdata.type)

    x === false ? undefined : returnObj.actual = x

    return returnObj
}

//------determineKnockbackDirectin
/**
* Takes a player and entity and determines a knockback direction for the entity
*
* @param {Entity} toknock entity to knock
* @param {Entity} knocker entity that is kocking back
* @returns {Phaser.Math.Vector2}
*/
function determineKnockbackDirection(toknock, knocker){
    let pos = toknock.getPosition()
    let epos = knocker.getPosition()

    let returnVec = new Phaser.Math.Vector2(0)
    //xpos
    if(pos[0] < (epos[0] +10)){
        returnVec.x = -1
    }else{
        returnVec.x = 1
    }

    if(pos[1] < (epos[1] + 10)){
        returnVec.y = -1
    }else{
        returnVec.y = 1
    }

    returnVec.normalize()

    return returnVec
}

//------toggleCursor
/**
*plays cursor 'anim'
*
* @param {Phaser.Scene} scene the scene where the cursor exists
*/
function toggleCursor(scene){
    scene.input.setDefaultCursor('url(assets/img/cursor-2.png), pointer')
    scene.time.delayedCall(GameConfig.TIMING.CURSOR_ANIMATION_DURATION, ()=>{scene.input.setDefaultCursor('url(assets/img/cursor.png), pointer')})
}

//------updateMovement
/**
* Takes a  entity and context scene, and randomly updates that entitys movement
*
* @param {Entity} toknock entity to knock
* @param {Phaser.scene} scene the context scene
* @returns {void}
*/
function updateMovement(entity, scene){
    var decider =  Math.round(Math.random() * 4)
    switch(decider){
        case 1:
            entity.setVelocityX(entity.VELOCITY)
            scene.time.delayedCall(GameConfig.TIMING.ENEMY_MOVEMENT_DURATION, () => {
                entity.setVelocity(0)
                scene.time.delayedCall(GameConfig.TIMING.ENEMY_MOVEMENT_PAUSE, () => {entity.setVelocityX(-entity.VELOCITY)})})
            break
        case 2:
            entity.setVelocityX(-entity.VELOCITY)
            scene.time.delayedCall(GameConfig.TIMING.ENEMY_MOVEMENT_DURATION, () => {
                entity.setVelocity(0)
                scene.time.delayedCall(GameConfig.TIMING.ENEMY_MOVEMENT_PAUSE, () => {entity.setVelocityX(entity.VELOCITY)})})
            break
        case 3:
            entity.setVelocityY(entity.VELOCITY)
            scene.time.delayedCall(GameConfig.TIMING.ENEMY_MOVEMENT_DURATION, () => {
                entity.setVelocity(0)
                scene.time.delayedCall(GameConfig.TIMING.ENEMY_MOVEMENT_PAUSE, () => {entity.setVelocityY(-entity.VELOCITY)})})
            break
        case 4:
            entity.setVelocityY(-entity.VELOCITY)
            scene.time.delayedCall(GameConfig.TIMING.ENEMY_MOVEMENT_DURATION, () => {
                entity.setVelocity(0)
                scene.time.delayedCall(GameConfig.TIMING.ENEMY_MOVEMENT_PAUSE, () => {entity.setVelocityY(entity.VELOCITY)})})
            break
    }   
}

//------pursuit
/**
* Takes a  entity and context scene, and commands the entity to pursue the player
*
* @param {Entity} entity entity to apply behavior to
* @param {Phaser.scene} scene the context scene
* @returns {void}
*/
function pursuit(scene, entity){
    let x = scene.p1.getPosition()
    let x1 = x[0]
    let y1 = x[1]

    let vector = new Phaser.Math.Vector2(0,0)

    if(x1 < entity.x){
        vector.x = -1
    }else if(x1 > entity.x){
        vector.x = 1
    }

    if(y1 < entity.y){
        vector.y = -1
    }else if( y1 > entity.y){
        vector.y = 1
    }

    vector.normalize()
    entity.setVelocity(entity.VELOCITY * vector.x, entity.VELOCITY * vector.y)
}


//------updateHealthBar
/**
* Updates health bar with color coding based on health percentage
*
* @param {Phaser.Graphics} healthBar The health bar graphics object
* @param {number} currentHP Current hit points
* @param {number} maxHP Maximum hit points
* @param {number} x X position for the health bar
* @param {number} y Y position for the health bar
* @param {number} width Width of the health bar
* @param {number} height Height of the health bar
* @returns {void}
*/
function updateHealthBar(healthBar, currentHP, maxHP, x, y, width, height) {
    let currentHealthPercent = currentHP / maxHP
    healthBar.clear()
    
    if(currentHealthPercent < 0.3){
        healthBar.fillStyle(0xFF0000) // Red
    } else if(currentHealthPercent < 0.5 && currentHealthPercent > 0.3){
        healthBar.fillStyle(0xFFFF00) // Yellow
    } else {
        healthBar.fillStyle(0x00FF00) // Green
    }
    
    healthBar.fillRect(x, y, width * currentHealthPercent, height)
}

//------safeStopSound
/**
* Safely stops a sound if it's playing
*
* @param {Phaser.Sound.BaseSound} sound The sound to stop
* @returns {void}
*/
function safeStopSound(sound) {
    if(sound && sound.isPlaying) {
        sound.stop()
    }
}

//------clearAllInterval
/**
* Takes a scene and ensures all entities that have an interval id get it cleared
*
* @param {Phaser.scene} scene the context scene
* @returns {void}
*/
function clearAllInterval(scene){
    scene.enemies.forEach(element => {
        clearInterval(element.INTERVAL_ID)
    })
    clearInterval(scene.p1.INTERVAL_ID)
    clearInterval(scene.p1.SPRINT_INTERVAL_ID)
    clearInterval(scene.n1.INTERVAL_ID)
}