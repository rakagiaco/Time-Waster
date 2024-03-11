class Player extends Entity{
    constructor(scene, x, y, texture, frames, _name='player', _hitPoints=100, qobj=undefined, inv=undefined){
        super(scene, x, y, texture, frames, _name, _hitPoints)

        //camera
        scene.cameras.main.startFollow(this, true, 0.25,0.25)

    /****properties**********/
        
        //inventory
        this.p1Inventory = new Inventory(inv)

        //tracks if player has a window open
        this.windowOpen = false 

        //walking noise
        this.walk_noise = scene.sound.add('walking', {rate: 1.5, repeat: -1})

        //visual quest text:
        let padding = 10
        this.questTrackerTxtTitle = scene.add.text(scene.cameras.main.scrollX + scene.cameras.main.width - scene.cameras.main.width + padding, scene.cameras.main.scrollY + scene.cameras.main.height - 150, "Current Quest: ", {fill: '#FFFFFF'}).setAlpha(0).setOrigin(0).setScrollFactor(0,0)
        this.questTrackerTxtBody = scene.add.text(scene.cameras.main.scrollX + scene.cameras.main.width - scene.cameras.main.width + padding, scene.cameras.main.scrollY + scene.cameras.main.height - 100, "nil", {fill: '#FFFFFF'}).setAlpha(0).setOrigin(0).setScrollFactor(0,0)
       
        //quest tracker 
        qobj === undefined ?
        this.questStatus = {
            number : 0,
            finished: true,
            currentQuest: undefined, // this holds quest obj
            completedQuests: [] // unused as of right now...
        } :
        this.questStatus = qobj

        //combat listener obj
        this.pkg = {
            attack_type : undefined,
            isAttacking : false,
            attackCooldown : false,
            dmg : 0,
        }

        //state machines
        this.animsFSM = new StateMachine('idle', {
            idle: new idlePlayerState(),
            moving: new movingState(),
            interacting: new interactionPlayerState(),
            swim: new inWaterPlayerState(),
            attack: new attackPlayerState(),
            dead: new deadPlayerState()
        }, [scene, this])

        //swimming!
        scene.physics.add.overlap(this, scene.watersprite, ()=>{
            if(this.animsFSM.state !== 'swim'){
                scene.sound.stopAll()
                this.animsFSM.transition('swim')
            }
        })

        //input
        keyUp = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
        keyDown = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
        keyLeft = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
        keyRight = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        keyAttackLight = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE)
        keyAttackHeavy = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO)
        keyInventory = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB)
    }

    update(){
        if(this.HIT_POINTS <= 0 && this.animsFSM.state !== 'dead'){
            this.animsFSM.transition('dead')
        }
        if(this.isAlive){
            super.updateHealthBar()
            this.displayCurrentQuests()
            this.animsFSM.step()
        } 
    }

    handleCollision(collided){

        //properties to define the attack 
        let attackVector = determineKnockbackDirection(collided,this)
        let attackVelocity = 0
        let attackText
    
        if(this.pkg.isAttacking && this.animsFSM.state === 'attack'){
            switch(this.pkg.attack_type){
                case 'light':
                    // console.log('player used light attack on enemy')
                    attackText = this.parentScene.add.text(collided.x + Phaser.Math.Between(-50, 50), collided.y + Phaser.Math.Between(-10,-60),this.pkg.dmg, {fill: '#0000FF'}).setScale(2).setOrigin(0)
                    this.parentScene.time.delayedCall(500, ()=>{ attackText.destroy()})

                    //ensure no sound overlap
                    if(this.parentScene.sound.sounds.length < 6){
                        this.parentScene.sound.play('attack-light-hit', {volume: 0.05})
                    }

                    if(collided.HIT_POINTS <= this.pkg.dmg){ //enemy will die here
                        collided.HIT_POINTS = 0
                        collided.FSM.transition('dead')
                    } else { // lives
                        collided.HIT_POINTS -= this.pkg.dmg //take damage
                        attackVelocity = 250 //knockback
                        collided.setVelocity(attackVector.x * attackVelocity, attackVector.y * attackVelocity) //apply knockback
                        this.scene.time.delayedCall(250, () => {
                            collided.FSM.transition('pursuit')
                        })
                    }
                    //console.log(collided.HIT_POINTS)
                    break
                case 'heavy':
                    // console.log('player used heavy attack on enemy')
                    attackText = this.parentScene.add.text(collided.x + Phaser.Math.Between(-50, 50), collided.y + Phaser.Math.Between(-10,-60), this.pkg.dmg, {fill: '#0000FF'}).setScale(2).setOrigin(0)
                    this.parentScene.time.delayedCall(500, ()=>{ attackText.destroy()})
    
                    //sound overlap
                    if(this.parentScene.sound.sounds.length < 6){
                        this.parentScene.sound.play('attack-heavy-hit', {volume: 0.05})
                    }

                    if(collided.HIT_POINTS <= this.pkg.dmg){
                        collided.HIT_POINTS = 0
                        collided.FSM.transition('dead')
                    } else {
                        collided.HIT_POINTS -= this.pkg.dmg
                        attackVelocity = 375
                        collided.setVelocity(attackVector.x * attackVelocity, attackVector.y * attackVelocity)
                        this.scene.time.delayedCall(350, ()=> {
                            collided.FSM.transition('pursuit')
                        })
                    }
                    //console.log(collided.HIT_POINTS)
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
        moveDirection.normalize()
        this.setVelocity(this.VELOCITY * moveDirection.x, this.VELOCITY * moveDirection.y)
    }
    
    listenForCombatInput(){
        if(keyAttackLight.isDown){
            this.pkg.attack_type = 'light'
            this.pkg.isAttacking = true
            this.pkg.dmg = Math.round(Math.random() * 15) + 10
            //console.log('Light attack -> ' + this.pkg.dmg)
        } else if (keyAttackHeavy.isDown){
            this.pkg.attack_type = 'heavy'
            this.pkg.isAttacking = true
            this.pkg.dmg = Math.round(Math.random() *30) + 20  
            //console.log('Heavy attack ->' + this.pkg.dmg)
        } else {
            this.pkg.attack_type = undefined
            this.pkg.isAttacking = false
            this.pkg.dmg = 0
        }
    }

    displayCurrentQuests(){
        if(this.questStatus.finished === false){
            this.questTrackerTxtTitle.setAlpha(1).setDepth(3)
            let alias = this.questStatus.currentQuest
            this.questTrackerTxtBody.text = alias.verb + ' ' +  alias.ammount + ' ' +  alias.type + ' ' + alias.actual + '/' + alias.ammount
            this.questTrackerTxtBody.setAlpha(1).setDepth(3)
        } else {
            this.questTrackerTxtTitle.setAlpha(0)
            this.questTrackerTxtBody.setAlpha(0)
        }
    }
}


class idlePlayerState extends State{
    enter(scene, player){
        console.log('in player: idle')
        player.setVelocity(0)
    }

    execute(scene, player){

        //attacking logic
        if(!player.pkg.isAttacking && player.pkg.attackCooldown === false){    
            player.listenForCombatInput()
        } else if(player.pkg.isAttacking) {
            player.walk_noise.stop()
            this.stateMachine.transition('attack')
        }

        //movment logic
        if(player.canMove){
            if(keyUp.isDown || keyDown.isDown || keyLeft.isDown || keyRight.isDown){
                this.stateMachine.transition('moving')
            }
        }

        if(keyInventory.isDown){
            player.windowOpen = true
            player.p1Inventory.openInventoryWindow(scene, player)
            this.stateMachine.transition('interacting')
        }
    }
}

class movingState extends State{
    enter(scene,player){
        console.log('in player: moving')
        if(!player.walk_noise.isPlaying){
            player.walk_noise.play()
        }
         
        
    }

    execute(scene, player){

        if(!player.pkg.isAttacking && player.pkg.attackCooldown === false){    
            player.listenForCombatInput()
        } else if(player.pkg.isAttacking) {
            player.walk_noise.stop()
            this.stateMachine.transition('attack')
        }

        if(!(keyUp.isDown || keyDown.isDown || keyLeft.isDown || keyRight.isDown)) {
            player.walk_noise.stop()
            this.stateMachine.transition('idle')
        }else{
            player.handleMovement()
        }
    }
}

class interactionPlayerState extends State{
    enter(scene, player){
        if(player.walk_noise.isPlaying){
            player.walk_noise.stop()
        }
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
        console.log('in player: attack')
        player.setVelocity(0)
       
        switch(player.pkg.attack_type){
            case 'light':
                scene.sound.play('attack-light', {volume: 0.05}) 
                scene.time.delayedCall(1500, () =>{ 
                    player.pkg.attackCooldown = false
                })
                break
            case 'heavy':
                scene.sound.play('attack-heavy', {volume: 0.05})
                scene.time.delayedCall(3000, () =>{ 
                    player.pkg.attackCooldown = false
                })
                break
            default:
                break
        }

        scene.time.delayedCall(25, () =>{ 
            player.pkg.isAttacking = false
            player.pkg.attackCooldown = true
            this.stateMachine.transition('idle')
        })
    }   

    execute(scene, player){
        player.setVelocity(0)
    }
}

class deadPlayerState extends State{
    enter(scene, player){
        player.walk_noise.stop()
        console.log('dead')
        player.isAlive = false
        player.setVelocity(0)
        player.HEALTH_BAR.clear()
        scene.tweens.add({
            targets: player,
            alpha: { from: 1, to: 0 },
            duration: 2000,
            onComplete: () =>{
                player.x = 200
                player.y = 200
                scene.time.delayedCall(500, ()=>{
                    scene.tweens.add({
                        targets: player,
                        alpha: { from: 0, to: 1 },
                        duration: 3000,
                        onComplete: () =>{
                            player.isAlive = true
                            player.HIT_POINTS = player.HIT_POINTS_log
                            player.animsFSM.transition('idle') 
                        }
                    })
                })              
            }
        })
    }
}