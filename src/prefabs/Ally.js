class Ally extends Entity{
    constructor(scene, x, y, texture, frames, _name='NPC-friendly', _hitPoints){
        super(scene, x, y, texture, frames, _name, _hitPoints)

        this.FSM = new StateMachine('idle',{
            idle: new idleAllyState(),
            interacting: new interactionAllyState() // we want to be able to pass the players state in as an argement and do something based on the state
        }, [scene, this])

        this.icon_sprite = undefined
        this.HEALTH_BAR.setAlpha(0)

        this.setScale(1.65)
        this.setInteractive()
    }

    update(){
        this.FSM.step()
    }

    handleCollision(){}
    handleClick(){
        if(listen(this.parentScene, this )){
            if(this.FSM.state !== 'interacting'){
                this.icon_sprite === undefined ? undefined : this.icon_sprite.destroy()
                this.icon_active = false
                this.parentScene.p1.animsFSM.transition('interacting')
                this.FSM.transition('interacting')
            }
        }
    }
}

class idleAllyState extends State{
    enter(scene, ally){
        if(scene.p1.questStatus.finished === true && scene.p1.questStatus.number < ammountOfQuests){
            ally.icon_sprite = scene.add.sprite(ally.x + 25, ally.y - 15,'quest-icon', 0).play('quest-icon')
        } else {
            ally.icon_sprite = scene.add.sprite(ally.x + 25, ally.y - 15,'quest-complete-icon', 0).play('quest-complete-icon-anim')
        }
    }

}

class interactionAllyState extends State{
    enter(scene, ally){
        //console.log('in ally: interaction')
        if(!scene.p1.windowOpen){
            this.createPopupWindow(scene)
        } else {
            this.stateMachine.transition('idle')
        } 
    }

    createPopupWindow(scene){
        
        scene.p1.windowOpen = true

        let closeBTN, acceptBTN, avaQ, questTxt, completeBTN
        var count = 0

        let playercurrentquest = scene.p1.questStatus

        // Create a rectangle to act as the background of the popup
        const window = scene.add.graphics().setDepth(3)
        window.fillStyle(0x000000, 1) // Color and alpha (transparency)
        window.fillRect(scene.cameras.main.scrollX + scene.cameras.main.width/4 , scene.cameras.main.scrollY + scene.cameras.main.height/4, 450, 400)

        closeBTN = scene.add.bitmapText(scene.cameras.main.scrollX + scene.cameras.main.width/4 + 10, scene.cameras.main.scrollY + scene.cameras.main.height/4 + 5, '8-bit-white', 'exit', 24)
        closeBTN.setInteractive().setDepth(3)
        closeBTN.on('pointerdown', () => {
            toggleCursor(scene)
            window.destroy()
            closeBTN.destroy()
            if(acceptBTN!== undefined){
                acceptBTN.destroy()
            }
            if(avaQ!== undefined){
                avaQ.destroy()
            }
            if(questTxt!== undefined){
                questTxt.destroy()
            }
            
            if(completeBTN !== undefined){
                completeBTN.destroy()
            }
            scene.p1.windowOpen = false
            scene.p1.animsFSM.transition('idle')
            this.stateMachine.transition('idle')
        })

        acceptBTN = scene.add.bitmapText(scene.cameras.main.scrollX + (scene.cameras.main.width/4) + 450 - 10, scene.cameras.main.scrollY + scene.cameras.main.height/4 + 5, '8-bit-white', 'accept', 24)
        acceptBTN.setAlpha(0).setDepth(3).setOrigin(1, 0)
        
        //available quests
        avaQ = scene.add.bitmapText(scene.cameras.main.scrollX + (scene.cameras.main.width/4) + 225, scene.cameras.main.scrollY + scene.cameras.main.height/4 + 20, '8-bit-white', 'Quests', 24)
        avaQ.setOrigin(0.5, 0).setDepth(3)

        scene.quests.forEach(element => {
            if(element.questdata.questnumber == playercurrentquest.number + 1){
                if(playercurrentquest.finished === true){
                    questTxt = scene.add.text(scene.cameras.main.scrollX + ((scene.cameras.main.width/4)+25), scene.cameras.main.scrollY + (scene.cameras.main.height/3 - 20), element.name, {font: '9px Arial' , fill: '#FFFFFF', resolution: 2,  wordWrap : { width: 400, useAdvancedWrap: true }})
                    questTxt.setInteractive().setOrigin(0).setDepth(3).on('pointerdown', () => {
                        toggleCursor(scene)
                        if (count === 0){ 
                            scene.sound.play('page-turn', {volume: 0.5})
                            questTxt.text =  element.description
                            avaQ.setText(element.name)
                        } else if(count === 1) {
                            scene.sound.play('page-turn', {volume: 0.5})
                            questTxt.text = element.requirements
                            acceptBTN.setInteractive().setAlpha(1).setDepth(3)
                        }
                        count += 1
                    })
                   
                    acceptBTN.on('pointerdown', () => {
                        toggleCursor(scene)
                        if(playercurrentquest.finished === true){
                            playercurrentquest.finished = false
                            playercurrentquest.currentQuest = CreateQuestObject(element, scene.p1)
                        } 

                        //save quest status
                        Window & typeof globalThis.localStorage.setItem('existing_quest', JSON.stringify(playercurrentquest))

                        window.destroy()
                        closeBTN.destroy()
                        avaQ.destroy()
                        questTxt.destroy()
                        acceptBTN.destroy()
                        scene.p1.windowOpen = false
                        scene.p1.animsFSM.transition('idle')
                        this.stateMachine.transition('idle')
                    })
            

                } else {
                    questTxt = scene.add.text(scene.cameras.main.scrollX + ((scene.cameras.main.width/4)+25), scene.cameras.main.scrollY + scene.cameras.main.height/3, 
                    element.completiontext , {font: '9px Arial' , fill: '#FFFFFF', resolution: 2,  wordWrap : { width: 400, useAdvancedWrap: true }}).setDepth(3)

                    if(playercurrentquest.currentQuest.actual >= playercurrentquest.currentQuest.ammount){
                        completeBTN = scene.add.bitmapText(scene.cameras.main.scrollX + ((scene.cameras.main.width/4) + 225), scene.cameras.main.scrollY + scene.cameras.main.height/2, '8-bit-white', 'complete quest', 24).setOrigin(0.5).setInteractive().setDepth(3)
                        completeBTN.on('pointerdown', ()=>{
                            scene.sound.play('complete-quest', {volume: 0.05})
                            toggleCursor(scene)

                            playercurrentquest.number = element.questdata.questnumber
                            playercurrentquest.finished = true 

                            Window & typeof globalThis.localStorage.setItem('existing_quest', JSON.stringify(playercurrentquest))
                              
                            if(playercurrentquest.currentQuest.verb != 'kill'){
                                scene.p1.p1Inventory.remove(playercurrentquest.currentQuest.type, playercurrentquest.currentQuest.actual)
                            }
                            const parse = JSON.stringify(Array.from(scene.p1.p1Inventory.inventory.entries()))
                            Window & typeof globalThis.localStorage.setItem('existing_inv', parse)

                            avaQ.destroy()
                            window.destroy()
                            closeBTN.destroy()
                            acceptBTN.destroy()
                            completeBTN.destroy()
                            questTxt.destroy()
                            scene.p1.windowOpen = false
                            scene.p1.animsFSM.transition('idle')
                            this.stateMachine.transition('idle')

                            if(playercurrentquest.number === 4){
                                scene.enemies.forEach(element => {
                                    element.FSM.transition('gamePause')
                                })
                                scene.p1.animsFSM.transition('gamePause')
                                clearAllInterval(scene)
                                scene.scene.start('gameOver')
                            }
                        })
                    }    
                }
            }
        })
    

        let winAr = [window, closeBTN]

        scene.miniMapCamera.ignore([window, closeBTN])
        if(acceptBTN!== undefined){
            scene.miniMapCamera.ignore(acceptBTN)
            winAr.push(acceptBTN)
        }
        if(avaQ!== undefined){
            scene.miniMapCamera.ignore(avaQ)
            winAr.push(avaQ)
        }
        if(questTxt!== undefined){
            scene.miniMapCamera.ignore(questTxt)
            winAr.push(questTxt)
        }
        
        if(completeBTN !== undefined){
            scene.miniMapCamera.ignore(completeBTN)
            winAr.push(completeBTN)
        }


        scene.p1.currentWindow.objs = winAr
    }
}