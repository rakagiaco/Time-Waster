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

        //sprinting
        this.isSprinting = false
        this.SPRINT_INTERVAL_ID = undefined
        this.STAMINA_BAR = scene.add.graphics().setScrollFactor(0).setAlpha(1).setDepth(3)
        this.STAMINA_BAR.width = 150
        this.stamina = 5
        this.stamina_log = this.stamina

        //inventory
        this.p1Inventory = new Inventory(inv)

        //tracks if player has a window open
        this.windowOpen = false 
        
        /**
         * current window -> holds data on game objests that exist if a window is open -> so we can reset windows if we die in wierd situations...
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
        this.questTrackerTxtTitle = scene.add.bitmapText(game.config.width/6 + 10,game.config.height - 200,'8-bit-white', "Current Quest: ", 32).setAlpha(0).setOrigin(0).setScrollFactor(0,0)
        this.questTrackerTxtBody = scene.add.bitmapText(game.config.width/6 + 15, game.config.height - 170, 'pixel-white', "nil", 10).setAlpha(0).setOrigin(0).setScrollFactor(0,0)
       
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
            dead: new deadPlayerState(),
            gamePause: new gamePausePlayerState()
        }, [scene, this])

        //swimming!
        scene.physics.add.overlap(this, scene.ponds, ()=>{
            if(this.animsFSM.state !== 'swim' && this.animsFSM.state !== 'dead' && this.animsFSM.state !== 'gamePause'){
                scene.sound.stopAll()
                this.animsFSM.transition('swim')
            }
        })

        //collide with npc
        scene.physics.add.collider(this, scene.n1,undefined,undefined)

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
            if(this.animsFSM.state !== 'idle' && this.animsFSM.state !== 'swim' && this.animsFSM.state !== 'interacting'){
                this.isSprinting = !this.isSprinting 
                if(this.isSprinting){
                    clearInterval(this.SPRINT_INTERVAL_ID)
                    this.VELOCITY = 175
                    this.SPRINT_INTERVAL_ID = setInterval(()=>{
                        if(this.stamina <= 0){
                            //console.log('stamina empty, sprint done')
                            this.VELOCITY = GameConfig.MOVEMENT.PLAYER_BASE_VELOCITY
                            clearInterval(this.SPRINT_INTERVAL_ID)
                        } else{
                            //console.log('stamina -- ', this.stamina)
                            this.stamina -= 0.025
                        }
                    }, GameConfig.TIMING.SPRINT_INTERVAL)
                } else {
                    clearInterval(this.SPRINT_INTERVAL_ID)
                    this.SPRINT_INTERVAL_ID = setInterval(()=>{
                        if(this.stamina >= 5){
                            //console.log('stamina refil done ')
                            clearInterval(this.SPRINT_INTERVAL_ID)
                        }else{
                            //console.log('stamina refil, ', this.stamina)
                            this.stamina += 0.025
                        }
                    }, GameConfig.TIMING.SPRINT_INTERVAL)
                    this.VELOCITY = GameConfig.MOVEMENT.PLAYER_BASE_VELOCITY
                }
            }
        })
    }

    update(){
        if(this.HIT_POINTS <= 0 && this.animsFSM.state !== 'dead'){
            this.animsFSM.transition('dead')
        }
        if(this.isAlive){
            this.updateHealthBar()
            this.updateStaminaBar()
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
                    this.parentScene.time.delayedCall(GameConfig.TIMING.DAMAGE_TEXT_DURATION, ()=>{ attackText.destroy()})

                    //ensure no sound overlap  
                    if(!this.attack_noise_light_hit.isPlaying){
                        this.attack_noise_light_hit.play()
                    }
                    
                    if(collided.HIT_POINTS <= this.pkg.dmg){ //enemy will die here
                        collided.HIT_POINTS = 0
                        collided.FSM.transition('dead')
                    } else { // lives
                        collided.HIT_POINTS -= this.pkg.dmg //take damage
                        attackVelocity = GameConfig.MOVEMENT.KNOCKBACK_LIGHT //knockback
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
                    this.parentScene.time.delayedCall(GameConfig.TIMING.DAMAGE_TEXT_DURATION, ()=>{ attackText.destroy()})

                    //sound overlap
                    if(!this.attack_noise_heavy_hit.isPlaying){
                        this.attack_noise_heavy_hit.play()
                    }
                    
                    if(collided.HIT_POINTS <= this.pkg.dmg){
                        collided.HIT_POINTS = 0
                        collided.FSM.transition('dead')
                    } else {
                        collided.HIT_POINTS -= this.pkg.dmg
                        attackVelocity = GameConfig.MOVEMENT.KNOCKBACK_HEAVY
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
            this.pkg.dmg = Math.round(Math.random() * Phaser.Math.Between(GameConfig.COMBAT.LIGHT_ATTACK_MIN, GameConfig.COMBAT.LIGHT_ATTACK_MAX)) + Phaser.Math.Between(GameConfig.COMBAT.LIGHT_ATTACK_MIN, GameConfig.COMBAT.LIGHT_ATTACK_MAX)
            //console.log('Light attack -> ' + this.pkg.dmg)
        } else if (keyAttackHeavy.isDown){
            this.pkg.attack_type = 'heavy'
            this.pkg.isAttacking = true
            this.pkg.dmg = Math.round(Math.random() *Phaser.Math.Between(GameConfig.COMBAT.HEAVY_ATTACK_MIN, GameConfig.COMBAT.HEAVY_ATTACK_MAX)) + Phaser.Math.Between(GameConfig.COMBAT.HEAVY_ATTACK_MIN, GameConfig.COMBAT.HEAVY_ATTACK_MAX)  
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
            this.questTrackerTxtBody.text = alias.verb + ' ' +  alias.amount + ' ' +  alias.type + ' ' + alias.actual + '/' + alias.amount
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
        updateHealthBar(this.HEALTH_BAR, this.HIT_POINTS, this.HIT_POINTS_log, game.config.width/2 - 75, game.config.height/2 + 165, this.HEALTH_BAR.width, 10)
    }

    updateStaminaBar(){
        let currentStamPercent = this.stamina / this.stamina_log
        this.STAMINA_BAR.clear()
        if(currentStamPercent < 0.3){
            this.STAMINA_BAR.fillStyle(0xFF0000)
        }else{
            this.STAMINA_BAR.fillStyle(0xffcc00)
        }
        this.STAMINA_BAR.fillRect(game.config.width/2 - 75, game.config.height/2 + 155, this.STAMINA_BAR.width * currentStamPercent, 5)
    }
}


class idlePlayerState extends State{
    enter(scene, player){

        if(player.isSprinting){
            player.isSprinting = false
            clearInterval(player.SPRINT_INTERVAL_ID)
            player.VELOCITY = 100

            player.SPRINT_INTERVAL_ID = setInterval(()=>{
                if(player.stamina >= 5){
                    //console.log('stamina refil done ')
                    clearInterval(player.SPRINT_INTERVAL_ID)
                }else{
                    //console.log('stamina refil, ', player.stamina)
                    player.stamina += 0.025
                }
            }, 50)

        }
        safeStopSound(player.walk_noise)

        //console.log('in player: idle')
        player.setVelocity(0)
    }

    execute(scene, player){

        //attacking logic
        if(!player.pkg.isAttacking && player.pkg.attackCooldown === false){    
            player.listenForCombatInput()
        } else if(player.pkg.isAttacking) {
            if(player.animsFSM.state !== 'attack'){
                safeStopSound(player.walk_noise)
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
        //console.log('in player: moving')
        if(!player.walk_noise.isPlaying){
            player.walk_noise.play()
        }   
    }

    execute(scene, player){
        if(!player.pkg.isAttacking && player.pkg.attackCooldown === false){    
            player.listenForCombatInput()
        } else if(player.pkg.isAttacking) {
            if(player.animsFSM.state !== 'attack'){
                safeStopSound(player.walk_noise)
                this.stateMachine.transition('attack')
            }
        }

        if(!(keyUp.isDown || keyDown.isDown || keyLeft.isDown || keyRight.isDown)) {
            safeStopSound(player.walk_noise)
            this.stateMachine.transition('idle')
        }else{
            player.handleMovement()
        }
    }
}

class interactionPlayerState extends State{
    enter(scene, player){
        //('in player: interaction')
        player.anims.pause()

        safeStopSound(player.walk_noise)
        player.setVelocity(0)
    }
}

class inWaterPlayerState extends State{
    enter(scene, player){
        if(!player.water_noise.isPlaying){
            player.water_noise.play()
        } 
        //console.log('in player: water state')
        player.VELOCITY = 50
        clearInterval(player.SPRINT_INTERVAL_ID)
        player.INTERVAL_ID = setInterval(()=>{
            if(player.HIT_POINTS < player.HIT_POINTS_log){
                player.HIT_POINTS += 1
                let healText = scene.add.bitmapText(player.x + Phaser.Math.Between(-50, 50), player.y + Phaser.Math.Between(-10,-60), 'pixel-green', '+1', 16).setScale(2).setOrigin(0)
                scene.miniMapCamera.ignore(healText)
                scene.time.delayedCall(GameConfig.TIMING.DAMAGE_TEXT_DURATION, ()=>{ healText.destroy()})
            }
        }, GameConfig.TIMING.HEAL_INTERVAL)
    }

    execute(scene, player){
      
        player.handleMovement()
        if(!scene.physics.overlap(player, scene.ponds)){
            scene.sound.stopAll()
            clearInterval(player.INTERVAL_ID)
            this.stateMachine.transition('idle')
        }
    }

}

class attackPlayerState extends State{
    enter(scene, player){
        player.pkg.attackCooldown = true
        //console.log('in player: attack')
        player.setVelocity(0)
       
        switch(player.pkg.attack_type){
            case 'light':
                scene.p1AttackUi.setTexture('attack-light-cooldown')
                player.anims.play('player-light-attack')
                scene.sound.play('attack-light', {volume: 0.05})
                this.stateMachine.transition('idle')
                player.pkg.isAttacking = false
                scene.time.delayedCall(GameConfig.TIMING.ATTACK_LIGHT_COOLDOWN, () =>{ 
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
                scene.time.delayedCall(GameConfig.TIMING.ATTACK_HEAVY_COOLDOWN, () =>{ 
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
        //console.log('in player: dead')
        clearInterval(player.INTERVAL_ID)
        player.isAlive = false
        player.setVelocity(0)
        player.HEALTH_BAR.clear()
        player.checkWindow()

        safeStopSound(player.walk_noise)
        safeStopSound(player.water_noise)

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

class gamePausePlayerState extends State{
    enter(scene, player){
        //console.log('in player: pause')
        player.anims.pause()

        safeStopSound(player.walk_noise)
        safeStopSound(player.attack_noise_light_hit)
        safeStopSound(player.attack_noise_heavy_hit)
        safeStopSound(player.water_noise)
        player.setVelocity(0)
    } 
}