class Ally extends NPC{
    constructor(scene, x, y, texture, frames, _name='NPC-friendly', _hitPoints, _quests = []){
        super(scene, x, y, texture, frames, _name, _hitPoints)

        this.quests = _quests

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
}


class idleAllyState extends State{
    enter(scene, ally){
        ally.once('pointerdown', ()=>{
            console.log('movin')
            scene.p1.animsFSM.transition('interacting')
            this.stateMachine.transition('interacting')
        })  
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
        
        let closeBTN, acceptBTN

        // Create a rectangle to act as the background of the popup
        const window = scene.add.graphics();
        window.fillStyle(0x000000, 0.75); // Color and alpha (transparency)
        window.fillRect(scene.cameras.main.scrollX + scene.cameras.main.width/4 , scene.cameras.main.scrollY + scene.cameras.main.height/8, 400, 500);

        // Position and size of the rectangle
        closeBTN = scene.add.text(scene.cameras.main.scrollX + scene.cameras.main.width/4, scene.cameras.main.scrollY + scene.cameras.main.height/8, "exit", {fill: '#FFFFFF'})
        closeBTN.setInteractive()
        closeBTN.on('pointerdown', () => {
            window.destroy()
            closeBTN.destroy()
            acceptBTN.destroy()
            scene.p1.animsFSM.transition('idle')
            this.stateMachine.transition('idle')
        })

        acceptBTN = scene.add.text(scene.cameras.main.scrollX + ((scene.cameras.main.width/4)*3), scene.cameras.main.scrollY + scene.cameras.main.height/8, "accept", {fill: '#FFFFFF'})
        acceptBTN.setInteractive().setOrigin(1,0)
        acceptBTN.on('pointerdown', () => {
            window.destroy()
            closeBTN.destroy()
            acceptBTN.destroy()
            scene.p1.animsFSM.transition('idle')
            this.stateMachine.transition('idle')
        })
    }
}



