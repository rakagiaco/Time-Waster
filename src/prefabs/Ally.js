class Ally extends Entity{
    constructor(scene, x, y, texture, frames, _name='NPC-friendly', _hitPoints, _quests = []){
        super(scene, x, y, texture, frames, _name, _hitPoints)

        this.quests = _quests
        //this.setInteractive()

        this.FSM = new StateMachine('idle',{
            idle: new idleAllyState(),
            interacting: new interactionAllyState() // we want to be able to pass the players state in as an argement and do something based on the state
        }, [scene, this])

        //   //state machines
        //   this.animsFSM = new StateMachine('idle', {
        //     idle: new idlePlayerState(),
        //     moving: new movingState()
        // }, [scene, this])


        /**
         * cases
         * not on quest one
         * on quest one
         * done with quest 1
         * not one quest 2
         * on quest 2
         * done w quest 2 etc
         * 
         * 
         * this gets pretty abstract pretty fast
         * passing around bundled information and then reading it essentially
         */
    }


    update(){
        this.FSM.step()
    }

    handleCollision(){

    }

    //this function derived

    handleClick(){
        console.log('ally click')
        if(this.FSM.state !== 'interacting'){
            this.parentScene.p1.animsFSM.transition('interacting')
            this.FSM.transition('interacting')
        }
    }
}


class idleAllyState extends State{
    enter(scene, ally){
        //play some anim
        //waiting for click
    }
}

class interactionAllyState extends State{
    enter(scene, ally){
        this.createPopupWindow(scene)
        //maybe open dialogue window
    }

    execute(scene, ally){
        /*we want to show certain quests to the player based on what state 
        the game is in*/
    }

    createPopupWindow(scene){
        
        let closeBTN, acceptBTN, avaQ, questTxt
        var count = 0

        let lastquest = scene.p1.questStatus

        // Create a rectangle to act as the background of the popup
        const window = scene.add.graphics();
        window.fillStyle(0x000000, 0.75); // Color and alpha (transparency)
        window.fillRect(scene.cameras.main.scrollX + scene.cameras.main.width/4 , scene.cameras.main.scrollY + scene.cameras.main.height/8, 500, 600)


        closeBTN = scene.add.text(scene.cameras.main.scrollX + scene.cameras.main.width/4, scene.cameras.main.scrollY + scene.cameras.main.height/8, "exit", {fill: '#FFFFFF'})
        closeBTN.setInteractive()
        closeBTN.on('pointerdown', () => {
            window.destroy()
            closeBTN.destroy()
            acceptBTN.destroy()
            avaQ.destroy()
            questTxt.destroy()
            scene.p1.animsFSM.transition('idle')
            this.stateMachine.transition('idle')
        })

        acceptBTN = scene.add.text(scene.cameras.main.scrollX + ((scene.cameras.main.width/4)*3), scene.cameras.main.scrollY + scene.cameras.main.height/8, "accept", {fill: '#FFFFFF'})
        acceptBTN.setOrigin(1,0).setAlpha(0)
        // acceptBTN.on('pointerdown', () => {
        //     if(lastquest.finished === true){
        //         lastquest.finished = false
        //     }



        //     window.destroy()
        //     closeBTN.destroy()
        //     acceptBTN.destroy()
        //     avaQ.destroy()
        //     questTxt.destroy()
        //     scene.p1.animsFSM.transition('idle')
        //     this.stateMachine.transition('idle')
        // })

        
        avaQ = scene.add.text(scene.cameras.main.scrollX + ((scene.cameras.main.width/4)*2), scene.cameras.main.scrollY + scene.cameras.main.height/6, "Quests", {fill: '#FFFFFF'})
        avaQ.setInteractive().setOrigin(1,0)


        scene.quests.forEach(element => {
            if(element.questdata.questnumber == lastquest.number + 1){
                if(lastquest.finished === true){
                    questTxt = scene.add.text(scene.cameras.main.scrollX + ((scene.cameras.main.width/4)+25), scene.cameras.main.scrollY + scene.cameras.main.height/4, 
                    element.name , {fontSize: '10px' , fill: '#FFFFFF',  wordWrap : { width: 450, useAdvancedWrap: true }})
                    questTxt.setInteractive().setOrigin(0)

                
                    questTxt.on('pointerdown', () => {
                        if (count === 0){ questTxt.text =  element.description} else {
                            questTxt.text = element.requirements
                            acceptBTN.setInteractive().setAlpha(1)
                        }
                        count += 1
                    })

                    acceptBTN.on('pointerdown', () => {
                        if(lastquest.finished === true){
                            lastquest.finished = false
                            lastquest.currentQuest = CreateQuestObject(element)
                            lastquest.number = element.questdata.questnumber
                        }  
                        window.destroy()
                        closeBTN.destroy()
                        acceptBTN.destroy()
                        avaQ.destroy()
                        questTxt.destroy()
                        scene.p1.animsFSM.transition('idle')
                        this.stateMachine.transition('idle')
                    })
            

                } else {
                    questTxt = scene.add.text(scene.cameras.main.scrollX + ((scene.cameras.main.width/4)+25), scene.cameras.main.scrollY + scene.cameras.main.height/4, 
                    element.completiontext , {fontSize: '10px' , fill: '#FFFFFF',  wordWrap : { width: 450, useAdvancedWrap: true }})
                }
            }
        });


    }
}




