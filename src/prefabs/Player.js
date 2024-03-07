class Player extends Entity{
    constructor(scene, x, y, texture, frames, _name='player', _hitPoints){
        super(scene, x, y, texture, frames, _name, _hitPoints)

        /* this.FSM = new StateMachine('vanilla', {
            vanilla: new mainState(),
        }, [scene, this])   */

        //properties
        
        //visual quest text:
        let padding = 10
        this.questTrackerTxtTitle = scene.add.text(scene.cameras.main.scrollX + scene.cameras.main.width - scene.cameras.main.width + padding, scene.cameras.main.scrollY + scene.cameras.main.height - 150, "Current Quest: ", {fill: '#FFFFFF'}).setAlpha(0).setOrigin(0).setScrollFactor(0,0)
        this.questTrackerTxtBody = scene.add.text(scene.cameras.main.scrollX + scene.cameras.main.width - scene.cameras.main.width + padding, scene.cameras.main.scrollY + scene.cameras.main.height - 100, "nil", {fill: '#FFFFFF'}).setAlpha(0).setOrigin(0).setScrollFactor(0,0)
       
       
       
        //quest tracker > could easily be expanded to hold multiple at once
        this.questStatus = {
            number : 0,
            finished: true,
            currentQuest: undefined, // this holds quest obj
            completedQuests: []
        }


        //combat listener obj
        this.pkg = {
            attack_type : undefined,
            isAttacking : false,
            attackCooldown : false,
            dmg : 0,
        }

        //camera
        scene.cameras.main.startFollow(this, true, 0.25,0.25)

        //state machines
        this.animsFSM = new StateMachine('idle', {
            idle: new idlePlayerState(),
            moving: new movingState(),
            interacting: new interactionPlayerState(),
            swim: new inWaterPlayerState(),
            attack: new attackPlayerState()
        }, [scene, this])

        //input
        keyUp = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
        keyDown = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
        keyLeft = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
        keyRight = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        keyAttackLight = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE)
        keyAttackHeavy = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO)
    }

    update(){
        this.displayCurrentQuests()
        this.animsFSM.step()
       // console.log(this.y)
       //console.log(this.questStatus.currentQuest)
    }

    handleCollision(collided){


        //get current x and y of collided
       let x =[collided.body.velocity.x, collided.body.velocity.y]
       //properties to define the attack 
       let attackVector = new Phaser.Math.Vector2(0)
       let attackVelocity = 0
    
       //set a knockback direction
       x[0] > 0 ? attackVector.x = -1 : attackVector.x = 1
       x[1] > 0 ? attackVector.y = -1 : attackVector.y = 1

        //console.log(attackVector)

        if(!this.pkg.attackCooldown && this.pkg.isAttacking && this.animsFSM.state === 'attack'){

            //attack cooldown timer so we cant spam
            this.pkg.attackCooldown = true
            // this.scene.time.delayedCall(1000, ()=>{this.pkg.attackCooldown = false})

            //tell the enemy its in combat
            collided.FSM.transition('combat')
            switch(this.pkg.attack_type){
                case 'light':
                    // console.log('player used light attack on enemy')
                    if(collided.HIT_POINTS <= this.pkg.dmg){ //enemy will survive this hit
                        collided.HIT_POINTS = 0
                        collided.FSM.transition('dead')
                    } else {
                        collided.HIT_POINTS -= this.pkg.dmg
                        attackVelocity = 500
                        collided.setVelocity(attackVector.x * attackVelocity, attackVector.y * attackVelocity)
                        this.scene.time.delayedCall(50, ()=> {collided.FSM.transition('pursuit')})
                    }
                    console.log(collided.HIT_POINTS)
                    this.scene.time.delayedCall(1000, ()=>{this.pkg.attackCooldown = false})
                    break
                case 'heavy':
                    // console.log('player used heavy attack on enemy')
                    if(collided.HIT_POINTS <= this.pkg.dmg){
                        collided.HIT_POINTS = 0
                        collided.FSM.transition('dead')
                    } else {
                        attackVelocity = 1000
                        collided.setVelocity(attackVector.x * attackVelocity, attackVector.y * attackVelocity)
                        this.scene.time.delayedCall(50, ()=> {collided.FSM.transition('pursuit')})
                    }
                    console.log(collided.HIT_POINTS)
                    this.scene.time.delayedCall(1500, ()=>{this.pkg.attackCooldown = false})
                    break
                default:
                    break
            }
        }
    }

    handleClick(){
        console.log(this.questStatus)
    }

    handleMovement(){        
        // handle movement
        let moveDirection = new Phaser.Math.Vector2(0, 0)
        if(keyUp.isDown){
            moveDirection.y = -1
        }else if(keyDown.isDown){
            moveDirection.y = 1
        }
        if(keyLeft.isDown) {
            moveDirection.x = -1
        }else if(keyRight.isDown){
            moveDirection.x = 1
        }

        // normalize movement vector, update position, and play proper animation
        moveDirection.normalize()
     
        this.setVelocity(this.VELOCITY * moveDirection.x, this.VELOCITY * moveDirection.y)
    }
    
    listenForCombatInput(){
        if(keyAttackLight.isDown){
            this.pkg.attack_type = 'light'
            this.pkg.isAttacking = true
            this.pkg.dmg = Math.round(Math.random() * 15) + 10
            console.log(this.pkg.dmg)
   
        } else if (keyAttackHeavy.isDown){
            this.pkg.attack_type = 'heavy'
            this.pkg.isAttacking = true
            this.pkg.dmg = Math.round(Math.random() *30) + 20  
            console.log(this.pkg.dmg)
        } else {
            this.pkg.attack_type = undefined
            this.pkg.isAttacking = false
            this.pkg.dmg = 0
        }
    }

    displayCurrentQuests(){
        if(this.questStatus.number !== 0 && this.questStatus.finished === false){
            this.questTrackerTxtTitle.setAlpha(1)

            let alias = this.questStatus.currentQuest
            this.questTrackerTxtBody.text = alias.verb + ' ' +  alias.ammount + ' ' +  alias.type + ' ' + alias.actual + '/' + alias.ammount
            this.questTrackerTxtBody.setAlpha(1)
        } else {
            this.questTrackerTxtTitle.setAlpha(0)
            this.questTrackerTxtBody.setAlpha(0)
        }
    }
}


class idlePlayerState extends State{
    enter(scene, player){
        //console.log('in player: idle')
        player.setVelocity(0)
    }

    execute(scene, player){
        player.listenForCombatInput()

        if(player.pkg.isAttacking){
            this.stateMachine.transition('attack')
        }

        if(player.canMove){
            if(keyUp.isDown || keyDown.isDown || keyLeft.isDown || keyRight.isDown){
                this.stateMachine.transition('moving')
                return
            }
        }
    }
}

class movingState extends State{
    enter(scene,player){
        // console.log('in player: moving')
        // scene.sound.play('walking', {rate: 2})
    }

    execute(scene, player){

        player.listenForCombatInput()

        if(player.pkg.isAttacking){

            this.stateMachine.transition('attack')
        }


        if(!(keyUp.isDown || keyDown.isDown || keyLeft.isDown || keyRight.isDown)) {
            scene.sound.stopAll()
            this.stateMachine.transition('idle')
        }else{
            player.handleMovement()
        }
    }
}

class interactionPlayerState extends State{
    enter(scene, player){
        console.log('in player: interaction')
        player.setVelocity(0)
    }
}

class inWaterPlayerState extends State{
    enter(scene, player){
        console.log('in player: water state')
        player.VELOCITY = player.VELOCITY / 2
        scene.sound.play('in-water')
    }

    execute(scene, player){
        player.handleMovement()
        if(!scene.physics.overlap(player, scene.watersprite)){
            scene.sound.stopAll()
            player.VELOCITY = player.VELOCITY*2
            this.stateMachine.transition('idle')
        }
    }

}


class attackPlayerState extends State{
    enter(scene, player){

        scene.time.delayedCall(50, () =>{ this.stateMachine.transition('idle')})
    }

}