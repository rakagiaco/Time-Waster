class Enemy extends Entity{
    constructor(scene, x, y, texture, frames, _name='NPC-enemy', _hitPoints, _origin=[], _attackPower, _detectionDist=150, _isBoss=false){
        super(scene, x, y, texture, frames, _name, _hitPoints)
         
        //state machine
        this.FSM = new StateMachine('idle', {
            idle: new idleEnemyState(),
            pursuit: new pursuitEnemyState(),
            combat: new combatEnemyState(),
            dead: new deadEnemyState(),
            reset: new resetEnemyState(),
            ignore: new ignoreEnemyState(),
            gamePause: new gamePauseEnemyState()
        }, [scene, this])

        
        //nonphysical
        this.isBoss = _isBoss
        this.spawnOrigin = _origin
        this.detectionDistance = _detectionDist
        this.setOrigin(0)
        this.entity_text.setAlpha(1)
        this.is_lootable = false
        this.looted = false
        this.isAttacking = false

        //overwritten
        this.attackPower = _attackPower
        this.lightAttack_dmg= Phaser.Math.Between(_attackPower, _attackPower + _attackPower/2)
        this.heavyAttack_dmg = Phaser.Math.Between( _attackPower + _attackPower/2, _attackPower * 1.5)

        //physical
        super.VELOCITY = GameConfig.MOVEMENT.ENEMY_BASE_VELOCITY
    }

    init(){}

    update(){
        if(this.isAlive){
            super.updateHealthBar()
            super.update()
            super.updateNamePlate()
            this.FSM.step()
        }
    }

    //collision handler
    handleCollision(){
        if(this.FSM.state !== 'combat' && this.FSM.state !== 'ignore' && this.FSM.state !== 'gamePause'){
            this.FSM.transition('combat')
            return
        }
    }
 
    handleClick(){
        //console.log(this.FSM.state)
        if(!listen(this.parentScene, this)){
            return
        }

        if(this.FSM.state === 'dead' && this.looted === false){
            //console.log('enemy: dead click')
        
            let x = undefined
            if(this.entity_type === 'Electro Lord Kealthis'){ //the boss
                x = new Item(this.parentScene, this.x, this.y, 'Frozen Heart', 0, 'Frozen Heart', true, true).setAlpha(0)
            }else if(this.entity_type === 'Nepian Observer' && this.is_lootable){
                x = new Item(this.parentScene, this.x, this.y, 'lesser nepian blood', 0, 'lesser nepian blood', true, true).setScale(0.5).setAlpha(0) 
            }
        
            x === undefined ? undefined:  //does x exist
            this.parentScene.p1.windowOpen ? undefined: //is there a window open
            this.looted === false? createLootInterfaceWindow(x, this.parentScene): undefined //has this entity been looted
            this.looted = true
        }
    }
}


/******************STATES****************/

class idleEnemyState extends State{
    enter(scene, enemy){
        //console.log('in enemy: idle')
        clearInterval(enemy.INTERVAL_ID)
        enemy.INTERVAL_ID = setInterval(updateMovement, (Math.round(Math.random() *(1751)) + 1750), enemy, scene)
        enemy.entity_text.setColor('#FFFFFF')
    }

    execute(scene, enemy){
        if(listen(scene, enemy)){ //player is in range
            this.stateMachine.transition('pursuit')
        } else if(enemy.y < 900 && enemy.x < 1000){ //maybe use config here for better properties
            this.stateMachine.transition('reset')
        }
    }
}

class pursuitEnemyState extends State{

    enter(scene, enemy){
        //('in enemy: pursuit')
        clearInterval(enemy.INTERVAL_ID)
        enemy.entity_text.setColor('#FF0000')
    }

    execute(scene, enemy){
        if(!listen(scene, enemy)){
            this.stateMachine.transition('idle')
        }
        pursuit(scene, enemy)
    }
}

class combatEnemyState extends State{
    enter(scene, enemy){
        if(scene.p1.HIT_POINTS <=0){
            this.stateMachine.transition('ignore')
            return
        }
        //console.log('in enemy: combat')
        clearInterval(enemy.INTERVAL_ID) 
        enemy.setVelocity(0)

        if(!enemy.isAttacking){

            //sound
          
                switch(enemy.entity_type){
                    case 'Nepian Scout':
                        scene.sound.play('enemy-1-hit', {volume: 0.05})
                        break
                    case 'Nepian Observer':
                        scene.sound.play('enemy-2-hit', {volume: 0.05})
                        break
                    default:
                        break
                }
            

            if(enemy.isBoss){
                let switchtomechanic = Math.random()
                //console.log(switchtomechanic)
                if(switchtomechanic <= 0.75){
                    let y = mechanics[Phaser.Math.Between(0,2)]
                    y(enemy, scene.p1, scene)
                }
            }

            enemy.isAttacking = true

            enemy.lightAttack_dmg= Phaser.Math.Between(enemy.attackPower, enemy.attackPower + enemy.attackPower/2)
            enemy.heavyAttack_dmg = Phaser.Math.Between( enemy.attackPower + enemy.attackPower/2, enemy.attackPower * 2)

            let x = Math.round(Math.random())
            x === 0 ? scene.p1.HIT_POINTS -= enemy.lightAttack_dmg : scene.p1.HIT_POINTS -= enemy.heavyAttack_dmg
            
            //console.log('enemy hit player -> ' + scene.p1.HIT_POINTS + '  ' + enemy.lightAttack_dmg + '  ' + enemy.heavyAttack_dmg)
            let attackText = scene.add.bitmapText(scene.p1.x + Phaser.Math.Between(-30, 30), scene.p1.y + Phaser.Math.Between(-10,-30),'pixel-red', x === 0 ? '-'+enemy.lightAttack_dmg : '-'+enemy.heavyAttack_dmg, 20)
            scene.time.delayedCall(GameConfig.TIMING.DAMAGE_TEXT_DURATION, ()=>{ attackText.destroy()})

            scene.time.delayedCall(GameConfig.TIMING.ENEMY_ATTACK_DELAY, ()=>{
                if(!(enemy.FSM.state === 'dead')){
                    enemy.isAttacking = false
                    enemy.FSM.transition('pursuit') 
                }
            })
        }
    }

    execute(scene, enemy){
        if(!listen(scene, enemy)){
            enemy.FSM.transition('idle')
        }
    }
}


class deadEnemyState extends State{
    enter(scene, enemy){

        enemy.HEALTH_BAR.clear()
        //console.log('in enemy: dying')

        switch(enemy.entity_type){
            case 'Nepian Scout':
                enemy.anims.play('enemy-1-death-anim')
                break
            case 'Nepian Observer':
                enemy.anims.play('enemy-2-death-anim')
                break
            case 'Electro Lord Kealthis':
                enemy.anims.play('boss-1-death-anim')
                break
                         
            default:
                break
        }

        //die
        enemy.isAlive = false
        clearInterval(enemy.INTERVAL_ID)   
        enemy.entity_text.setAlpha(0)

        //turn off physics
        enemy.setVelocity(0)
        enemy.body.enable = false

        //get info from players current quest, check verb
        //if verb is kill then check type
        let alias = scene.p1.questStatus
        if(alias.finished === false){
            if(alias.currentQuest.verb === 'kill' && alias.currentQuest.type == enemy.entity_type){
                if(alias.currentQuest.amount > alias.currentQuest.actual){
                    alias.currentQuest.actual += 1
                }
            }
        }

        let drops = Math.random()
        //console.log(drops)
        if(drops <= 65){
            enemy.is_lootable = true
            
            scene.time.delayedCall(GameConfig.TIMING.ENEMY_DEATH_DELAY, ()=>{
                enemy.setInteractive()
                if(enemy.entity_type === 'Nepian Observer'){
                    enemy.anims.play('enemy-2-lootable-anim')
                } else if(enemy.entity_type === 'Electro Lord Kealthis'){
                    enemy.anims.play('boss-1-lootable-anim')
                }
            })
        }
            
        scene.time.delayedCall(GameConfig.TIMING.ENEMY_FADE_DELAY, () => {
            scene.tweens.add({
                targets: enemy,
                alpha: { from: 1, to: 0 },
                duration: 2000,
                onComplete: () =>{
                    scene.time.delayedCall(GameConfig.TIMING.ENEMY_REVIVE_DELAY, ()=>{    
                        scene.tweens.add({
                            targets: [enemy, enemy.entity_text],
                            alpha: { from: 0, to: 1 },
                            duration: 2000,
                        })
                        enemy.disableInteractive()
                        enemy.x = enemy.spawnOrigin[0]
                        enemy.y = enemy.spawnOrigin[1]
                        enemy.body.enable = true
                        enemy.isAlive = true
                        enemy.looted = false
                        enemy.isAttacking = false
                        enemy.HIT_POINTS = enemy.HIT_POINTS_log
                        switch(enemy.entity_type){
                            case 'Nepian Scout':
                                enemy.anims.play('enemy-idle-anim')
                                break
                            case 'Nepian Observer':
                                enemy.anims.play('enemy2-idle-anim')
                                break
                            case 'Electro Lord Kealthis':
                                enemy.anims.play('boss-1-idle-anim')
                                break
                        }
                
                        enemy.FSM.transition('idle')  
                    })
                }
            })
        }) // remove enemy from scene after appropritte time to loot
    }
}

class resetEnemyState extends State{
    enter(scene, enemy){
        //console.log('in enemy: reset')
        clearInterval(enemy.INTERVAL_ID)
        enemy.setVelocity(0)
        enemy.setVelocityY(enemy.VELOCITY)  
    }


    execute(scene, enemy){
        if(enemy.y >= 899){
            scene.time.delayedCall(GameConfig.TIMING.ENEMY_RESET_DELAY, ()=>{this.stateMachine.transition('idle')})
        }
    }
}


class ignoreEnemyState extends State{
    enter(scene, enemy){
       // console.log('in enemy: ignore')
        clearInterval(enemy.INTERVAL_ID)
        enemy.setVelocity(0)
        scene.time.delayedCall(GameConfig.TIMING.ENEMY_RESET_DELAY, ()=> {this.stateMachine.transition('idle')})
    }
}


class gamePauseEnemyState extends State{
    enter(scene, enemy){
        //console.log('in enemy: gamepause')
        enemy.setVelocity(0)
    }
}


