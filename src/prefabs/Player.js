class Player extends Entity{
    constructor(scene, x, y, texture, frames, _name='player', _hitPoints=10, qobj=undefined, inv=undefined){
        super(scene, x, y, texture, frames, _name, _hitPoints)

        //camera
        scene.cameras.main.startFollow(this, true, 0.25,0.25)

    /****properties**********/

        //phaser stuff
        this.setScale(1.65)

        //derived
        this.HEALTH_BAR.setScrollFactor(0).setDepth(3)
        this.HEALTH_BAR.width = 150
        //inventory
        this.p1Inventory = new Inventory(inv)

        //tracks if player has a window open
        this.windowOpen = false 
        
        /**
         * @param {Array[Phaser.GameObjects]} objs an array of phaser gameobjs in refrence to open window
         * @param {Inventory.active} array specific to this project, for the inventory manager
         */
        this.currentWindow = {
            objs: undefined,
            array: undefined
        }
    
        //walking noise
        this.walk_noise = scene.sound.add('walking', {rate: 1.5, volume: 0.25})
        this.attack_noise_light_hit = scene.sound.add('attack-light-hit', {volume: 0.05})
        this.attack_noise_heavy_hit = scene.sound.add('attack-heavy-hit', {volume: 0.05, rate: 1.2})
        this.water_noise = scene.sound.add('in-water', {volume: 0.5})

        //visual quest text:
        let padding = 10
        this.questTrackerTxtTitle = scene.add.bitmapText(game.config.width/6 + 10,game.config.height - 200,'8-bit-white', "Current Quest: ", 32).setAlpha(0).setOrigin(0).setScrollFactor(0,0)
        this.questTrackerTxtBody = scene.add.bitmapText(game.config.width/6 + 15, game.config.height - 170, '8-bit-white', "nil", 20).setAlpha(0).setOrigin(0).setScrollFactor(0,0)
       
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
        scene.physics.add.overlap(this, scene.ponds, ()=>{
            if(this.animsFSM.state !== 'swim' && this.animsFSM.state !== 'dead'){
                scene.sound.stopAll()
                this.animsFSM.transition('swim')
            }
        })

        //collide with npc
        scene.physics.add.collider(this, scene.n1, ()=>{
            console.log('collider')
        }) 

        //input
        keyUp = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
        keyDown = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
        keyLeft = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
        keyRight = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        keyAttackLight = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE)
        keyAttackHeavy = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO)
        keyInventory = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB).on('down', ()=>{ 
            if(this.animsFSM.state !== 'swim'){
                if(this.p1Inventory.isOpen === false && this.windowOpen === false){
                    this.windowOpen = true
                    this.p1Inventory.openInventoryWindow(scene, this)
                    this.animsFSM.transition('interacting')
                } else if (this.p1Inventory.isOpen === true){
                    this.checkWindow()
                    this.animsFSM.transition('idle')
                }
            }
        })
        keySprint = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT).on('down', ()=>{
            this.VELOCITY === 100 ? this.VELOCITY = 250 : this.VELOCITY = 100
        })
    }

    update(){
        if(this.HIT_POINTS <= 0 && this.animsFSM.state !== 'dead'){
            this.animsFSM.transition('dead')
        }
        if(this.isAlive){
            this.updateHealthBar()
            this.displayCurrentQuests()
            this.animsFSM.step() 
        } 
    }

    handleCollision(collided){

        //properties to define the attack 
        let attackVector = determineKnockbackDirection(collided,this)
        let attackVelocity = 0
        let attackText
    
        if(this.pkg.isAttacking && this.pkg.attackCooldown === false){
            switch(this.pkg.attack_type){
                case 'light':
                    // console.log('player used light attack on enemy')
                    attackText = this.parentScene.add.bitmapText(collided.x + Phaser.Math.Between(-50, 50), collided.y + Phaser.Math.Between(-10,-60), 'pixel-yellow', this.pkg.dmg, 24)
                    this.parentScene.time.delayedCall(500, ()=>{ attackText.destroy()})

                    //ensure no sound overlap  
                    if(!this.attack_noise_light_hit.isPlaying){
                        this.attack_noise_light_hit.play()
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
                    attackText = this.parentScene.add.bitmapText(collided.x + Phaser.Math.Between(-50, 50), collided.y + Phaser.Math.Between(-10,-60), 'pixel-yellow', this.pkg.dmg, 24)
                    this.parentScene.time.delayedCall(500, ()=>{ attackText.destroy()})
    
                    //sound overlap
                    if(!this.attack_noise_heavy_hit.isPlaying){
                        this.attack_noise_heavy_hit.play()
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

    handleClick(){}

    handleMovement(){      
        let moveDirection = new Phaser.Math.Vector2(0, 0)
        if(keyUp.isDown){
            moveDirection.y = -1
        } else if (keyDown.isDown){
            moveDirection.y = 1
        }
        if(keyLeft.isDown) {
            moveDirection.x = -1
        } else if (keyRight.isDown){
            moveDirection.x = 1
        }

        if(!this.anims.isPlaying){
            switch(moveDirection.y){
                case 1:
                    this.anims.play('player-walk-down')
                    break
                case -1:
                    this.anims.play('player-walk-up')
                    break
            }

            if(moveDirection.y === 0){
                switch(moveDirection.x){
                    case 1:
                        this.anims.play('player-walk-right')
                        break
                    case -1:
                        this.anims.play('player-walk-left')
                        break
                }
            }
        }
        moveDirection.normalize()
        this.setVelocity(this.VELOCITY * moveDirection.x, this.VELOCITY * moveDirection.y)
    }
    
    listenForCombatInput(){
        if(keyAttackLight.isDown){
            this.pkg.attack_type = 'light'
            this.pkg.isAttacking = true
            this.pkg.dmg = Math.round(Math.random() * Phaser.Math.Between(10, 15)) + Phaser.Math.Between(10, 15)
            //console.log('Light attack -> ' + this.pkg.dmg)
        } else if (keyAttackHeavy.isDown){
            this.pkg.attack_type = 'heavy'
            this.pkg.isAttacking = true
            this.pkg.dmg = Math.round(Math.random() *Phaser.Math.Between(15, 20)) + Phaser.Math.Between(20, 25)  
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
            this.parentScene.miniMapCamera.ignore([this.questTrackerTxtTitle,this.questTrackerTxtBody])
        } else {
            this.questTrackerTxtTitle.setAlpha(0)
            this.questTrackerTxtBody.setAlpha(0)
        }
    }

    checkWindow(){

        if(this.p1Inventory.isOpen === true){
            this.p1Inventory.isOpen = false
        }

        if(this.currentWindow.objs !== undefined){
            this.windowOpen = false
            this.currentWindow.objs.forEach(element => {
                element.destroy()
            })
            this.currentWindow.objs = undefined
        }

        if(this.currentWindow.array !== undefined){
            this.currentWindow.array.forEach(element => {
                element.destroy()
            })
            this.currentWindow.array = undefined
        }
    }

    updateHealthBar(){
        let currentHealthPercent = this.HIT_POINTS / this.HIT_POINTS_log
        this.HEALTH_BAR.clear()
        if(currentHealthPercent < 0.3){
            this.HEALTH_BAR.fillStyle(0xFF0000)
        }else if(currentHealthPercent < 0.5 && currentHealthPercent > 0.3){
            this.HEALTH_BAR.fillStyle(0xFFFF00)

        }else{
            this.HEALTH_BAR.fillStyle(0x00FF00)
        }
        this.HEALTH_BAR.fillRect(game.config.width/2 - 75, game.config.height/2 + 165, this.HEALTH_BAR.width * currentHealthPercent, 10)
    }
}


class idlePlayerState extends State{
    enter(scene, player){
        if(player.walk_noise.isPlaying){
            player.walk_noise.pause()
        }
        console.log('in player: idle')
        player.setVelocity(0)
    }

    execute(scene, player){
        //attacking logic
        if(!player.pkg.isAttacking && player.pkg.attackCooldown === false){    
            player.listenForCombatInput()
        } else if(player.pkg.isAttacking) {
            //console.log('here')
            if(player.animsFSM.state !== 'attack'){
                player.walk_noise.stop() //fix
                this.stateMachine.transition('attack')
            }
        }

        //movment logic
        if(player.canMove){
            if(keyUp.isDown || keyDown.isDown || keyLeft.isDown || keyRight.isDown){
                this.stateMachine.transition('moving')
            }
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
            if(player.animsFSM.state !== 'attack'){
                player.walk_noise.stop()
                this.stateMachine.transition('attack')
            }
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
        player.anims.pause()
        if(player.walk_noise.isPlaying){
            player.walk_noise.stop()
        }
        console.log('in player: interaction')
        player.setVelocity(0)
    }
}

class inWaterPlayerState extends State{
    enter(scene, player){
        if(!player.water_noise.isPlaying){
            player.water_noise.play()
        } 
        console.log('in player: water state')
        player.VELOCITY = player.VELOCITY / 2
       
        player.INTERVAL_ID = setInterval(()=>{
            if(player.HIT_POINTS < player.HIT_POINTS_log){
                player.HIT_POINTS += 1
                let healText = scene.add.bitmapText(player.x + Phaser.Math.Between(-50, 50), player.y + Phaser.Math.Between(-10,-60), 'pixel-green', '+1', 16).setScale(2).setOrigin(0)
                scene.time.delayedCall(500, ()=>{ healText.destroy()})
            }
        }, 200)
    }

    execute(scene, player){
      
        player.handleMovement()
        if(!scene.physics.overlap(player, scene.ponds)){
            scene.sound.stopAll()
            player.VELOCITY = player.VELOCITY*2
            clearInterval(player.INTERVAL_ID)
            this.stateMachine.transition('idle')
        }
    }

}

class attackPlayerState extends State{
    enter(scene, player){
        player.pkg.attackCooldown = true
        console.log('in player: attack')
        player.setVelocity(0)
       
        switch(player.pkg.attack_type){
            case 'light':
                console.log('here')
                scene.p1AttackUi.setTexture('attack-light-cooldown')
                player.anims.play('player-light-attack')
                scene.sound.play('attack-light', {volume: 0.05})
                this.stateMachine.transition('idle')
                player.pkg.isAttacking = false
                scene.time.delayedCall(1000, () =>{ 
                    scene.p1AttackUi.setTexture('attack-bar')
                    player.pkg.attackCooldown = false
                })
                break
            case 'heavy':
                scene.p1AttackUi.anims.play('attack-heavy-cooldown-anim')
                player.anims.play('player-heavy-attack')
                scene.sound.play('attack-heavy', {volume: 0.05})
                player.pkg.isAttacking = false
                this.stateMachine.transition('idle')
                scene.time.delayedCall(3000, () =>{ 
                    scene.p1AttackUi.setTexture('attack-bar')
                    player.pkg.attackCooldown = false
                })
                break
            default:
                break
        }
    }   
    execute(scene, player){}
}

class deadPlayerState extends State{
    enter(scene, player){
        console.log('in player: dead')
        clearInterval(player.INTERVAL_ID)
        player.isAlive = false
        player.setVelocity(0)
        player.HEALTH_BAR.clear()
        player.checkWindow()

        if(player.walk_noise.isPlaying){
            player.walk_noise.stop()
        }
        if(player.water_noise.isPlaying){
            player.water_noise.stop()
        }

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