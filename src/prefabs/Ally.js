class Ally extends Entity{
    constructor(scene, x, y, texture, frames, _name='NPC-friendly', _hitPoints){
        super(scene, x, y, texture, frames, _name, _hitPoints)

        this.FSM = new StateMachine('idle',{
            idle: new idleAllyState(),
            interacting: new interactionAllyState() // we want to be able to pass the players state in as an argement and do something based on the state
        }, [scene, this])

        this.icon_sprite = undefined
        this.HEALTH_BAR.setAlpha(0)
    }

    update(){
        this.FSM.step()
    }

    handleCollision(){}
    handleClick(){
        if(listen(this.parentScene, this ))
        if(this.FSM.state !== 'interacting'){
            this.icon_sprite === undefined ? undefined : this.icon_sprite.destroy()
            this.parentScene.p1.animsFSM.transition('interacting')
            this.FSM.transition('interacting')
        }
    }
}

class idleAllyState extends State{
    enter(scene, ally){
        if(scene.p1.questStatus.finished === true && scene.p1.questStatus.number < ammountOfQuests){
            ally.icon_sprite = scene.add.sprite(ally.x+18, ally.y-2,'quest-icon', 0).play('quest-icon')
        }
    }
}

class interactionAllyState extends State{
    enter(scene, ally){
        console.log('interaction')
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
        const window = scene.add.graphics().setDepth(2)
        window.fillStyle(0x000000, 0.75) // Color and alpha (transparency)
        window.fillRect(scene.cameras.main.scrollX + scene.cameras.main.width/4 , scene.cameras.main.scrollY + scene.cameras.main.height/8, 500, 600)

        closeBTN = scene.add.text(scene.cameras.main.scrollX + scene.cameras.main.width/4, scene.cameras.main.scrollY + scene.cameras.main.height/8, "exit", {fill: '#FFFFFF'})
        closeBTN.setInteractive().setDepth(2)
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

        acceptBTN = scene.add.text(scene.cameras.main.scrollX + ((scene.cameras.main.width/4)*3), scene.cameras.main.scrollY + scene.cameras.main.height/8, "accept", {fill: '#FFFFFF'})
        acceptBTN.setOrigin(1,0).setAlpha(0).setDepth(2)
        
        //available quests
        avaQ = scene.add.text(scene.cameras.main.scrollX + (scene.cameras.main.width/2), scene.cameras.main.scrollY + scene.cameras.main.height/6, "Quests", {fill: '#FFFFFF'}).setOrigin(0.5)
        avaQ.setOrigin(0.5).setDepth(2)

        scene.quests.forEach(element => {
            if(element.questdata.questnumber == playercurrentquest.number + 1){
                if(playercurrentquest.finished === true){
                    questTxt = scene.add.text(scene.cameras.main.scrollX + ((scene.cameras.main.width/4)+25), scene.cameras.main.scrollY + scene.cameras.main.height/4, 
                    element.name , {fontSize: '10px' , fill: '#FFFFFF',  wordWrap : { width: 450, useAdvancedWrap: true }})
                    questTxt.setInteractive().setOrigin(0).setDepth(2)

                
                    questTxt.on('pointerdown', () => {
                        if (count === 0){ questTxt.text =  element.description} else {
                            questTxt.text = element.requirements
                            acceptBTN.setInteractive().setAlpha(1).setDepth(2)
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
                    questTxt = scene.add.text(scene.cameras.main.scrollX + ((scene.cameras.main.width/4)+25), scene.cameras.main.scrollY + scene.cameras.main.height/4, 
                    element.completiontext , {fontSize: '10px' , fill: '#FFFFFF',  wordWrap : { width: 450, useAdvancedWrap: true }}).setDepth(2)

                    if(playercurrentquest.currentQuest.actual === playercurrentquest.currentQuest.ammount){
                        completeBTN = scene.add.text(scene.cameras.main.scrollX + ((scene.cameras.main.width/2)), scene.cameras.main.scrollY + scene.cameras.main.height/2, 
                        'complete quest', {fontSize: '10px' , fill: '#FFFFFF',  wordWrap : { width: 450, useAdvancedWrap: true }}).setOrigin(0.5).setInteractive().setDepth(2)
                        completeBTN.on('pointerdown', ()=>{
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
                        })
                    }    
                }
            }
        })
    }
}