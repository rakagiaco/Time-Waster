   
 /**
    * Create a loot interface window for the given item, destroys all items associated with window 
    * upon closure of window
    * 
    * @param {Item} item The item to create loot window for
    * @param {Phaser.Scene} contextScene The scene to create the window on
    * @returns {undefined} 
    */
    
    function createLootInterfaceWindow(item, contextScene){

        contextScene.p1.windowOpen = true
        contextScene.p1.animsFSM.transition('interacting')

        const window = contextScene.add.graphics()
        window.fillStyle(0x000000, 1) // Color and alpha (transparency)
        window.fillRect(contextScene.cameras.main.scrollX + contextScene.cameras.main.width/2 - 125 , contextScene.cameras.main.scrollY + contextScene.cameras.main.height/2 - 125, 250, 250)

        let closeBTN, itemImg

        closeBTN = contextScene.add.text(contextScene.cameras.main.scrollX + contextScene.cameras.main.width/2-125, contextScene.cameras.main.scrollY + contextScene.cameras.main.height/2-125, "exit", {fill: '#FFFFFF'})
        closeBTN.setInteractive()
        closeBTN.on('pointerdown', () => {
            window.destroy()
            closeBTN.destroy()
            itemImg.destroy()
            contextScene.p1.windowOpen = false
            contextScene.p1.animsFSM.transition('idle')
        })

        itemImg = contextScene.add.image(contextScene.cameras.main.scrollX + contextScene.cameras.main.width/2 - 50 , contextScene.cameras.main.scrollY + contextScene.cameras.main.height/2, item.item_type).setInteractive().on('pointerdown', ()=>{

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
                console.log(item.soundEffect)
                contextScene.sound.play(item.soundEffect.sound, {volume: item.soundEffect.volume})
            }
            
            window.destroy()
            closeBTN.destroy()
            itemImg.destroy()
            item.destroy()
            contextScene.p1.windowOpen = false
            contextScene.p1.animsFSM.transition('idle')
        })

    }

 /**
    * Takes scene and object that wants to listen for player
    * 
    * @param {Phaser.Scene} scene The scene where the player resides
    * @param {Phaser.GameObjects.GameObject} listener The object seeking information on players current position
    * @returns {boolean} 
    */
//player detection
function listen(scene, listener){
    let x = scene.p1.getPosition()
    let x1 = x[0]
    let y1 = x[1]
    /*some sprites were created directly in scene, as they are just
    / animated images with little properties. check that here
    / detectionDistance is a property unique to Entity and Item gameobjs
    / */
    if(listener.detectionDistance === 0 || listener.detectionDistance === undefined){
        listener.detectionDistance = 150
        // console.log('here')
    }
    //true if player is in range (150 px)
    if(x1 > (listener.x-listener.detectionDistance) && x1 < (listener.x+listener.detectionDistance) && y1 > (listener.y-listener.detectionDistance) && y1 < (listener.y+listener.detectionDistance)){
        return true
    } else {
        return false
    }
}





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


