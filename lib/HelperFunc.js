   
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


    
//player detection
function listen(scene, listener){
    let x = scene.p1.getPosition()
    let x1 = x[0]
    let y1 = x[1]

    //true if player is in range (150 px)
    if(x1 > (listener.x-listener.detectionDistance) && x1 < (listener.x+listener.detectionDistance) && y1 > (listener.y-listener.detectionDistance) && y1 < (listener.y+listener.detectionDistance)){
        return true
    } else {
        return false
    }
}