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
    window.fillRect(contextScene.cameras.main.scrollX + contextScene.cameras.main.width/2 - 125 , contextScene.cameras.main.scrollY + contextScene.cameras.main.height/2 - 125, 250, 250)

    contextScene.p1.windowOpen = true
    contextScene.p1.animsFSM.transition('interacting')

    closeBTN = contextScene.add.text(contextScene.cameras.main.scrollX + contextScene.cameras.main.width/2-125, contextScene.cameras.main.scrollY + contextScene.cameras.main.height/2-125, "exit", {fill: '#FFFFFF'})
    closeBTN.setInteractive().setDepth(2)
        closeBTN.on('pointerdown', () => {
        toggleCursor(contextScene)
        window.destroy()
        closeBTN.destroy()
        itemImg.destroy()
        contextScene.p1.windowOpen = false
        contextScene.p1.animsFSM.transition('idle')
    })

    itemImg = contextScene.add.image(contextScene.cameras.main.scrollX + contextScene.cameras.main.width/2 - 50 , contextScene.cameras.main.scrollY + contextScene.cameras.main.height/2, item.item_type).setInteractive().setDepth(2).on('pointerdown', ()=>{
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
        listener.detectionDistance = 150
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
        "ammount" : jsonData.questdata.ammount,
        "actual" : 0

    }

    let x = player.p1Inventory.get(jsonData.questdata.type)

    x === false ? undefined : returnObj.actual = x

    return returnObj
}


function determineKnockbackDirection(scene, player, enemy){
    let p1pos = player.getPosition()
    let epos = enemy.getPosition()

    let returnVec = new Phaser.Math.Vector2(0)
    //xpos
    if(p1pos[0] < (epos[0] +10)){
        returnVec.x = -1
    }else{
        returnVec.x = 1
    }

    if(p1pos[1] < (epos[1] + 10)){
        returnVec.y = -1
    }else{
        returnVec.y = 1
    }

    returnVec.normalize()

    return returnVec
}


function toggleCursor(scene){
    scene.input.setDefaultCursor('url(assets/img/cursor-2.png), pointer')
    scene.time.delayedCall(250, ()=>{scene.input.setDefaultCursor('url(assets/img/cursor.png), pointer')})
}