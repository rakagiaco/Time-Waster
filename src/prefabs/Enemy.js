class Enemy extends Entity{
    constructor(scene, x, y, texture, frames, _name='NPC-enemy', _hitPoints, _origin=[], _attackPower, _detectionDist=150, _isBoss=false){
        super(scene, x, y, texture, frames, _name, _hitPoints)
        
        
        //fsm
        this.FSM = new StateMachine('idle', {
            idle: new idleEnemyState(),
            pursuit: new pursuitEnemyState(),
            combat: new combatEnemyState(),
            dead: new deadEnemyState(),
            reset: new resetEnemyState(),
            ignore: new ignoreEnemyState()
        }, [scene, this])

        
        //nonphysical
        this.isBoss = _isBoss
        this.spawnOrigin = _origin
        this.detectionDistance = _detectionDist
        this.setOrigin(0)
        this.entity_text.setAlpha(1)
        this.loot_table = []
        this.looted = false
        this.isAttacking = false

        //overwritted
        this.attackPower = _attackPower
        this.lightAttack_dmg= Phaser.Math.Between(_attackPower, _attackPower + _attackPower/2)
        this.heavyAttack_dmg = Phaser.Math.Between( _attackPower + _attackPower/2, _attackPower * 1.5)

        //physical
        super.VELOCITY = 50
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
        if(this.FSM.state !== 'combat' && this.FSM.state !== 'ignore'){
            this.FSM.transition('combat')
            return
        }
    }
 
    handleClick(){
        console.log(this.FSM.state)
        if(!listen(this.parentScene, this)){
            return
        }

        if(this.FSM.state === 'dead'){
            console.log('dead click')
        
            let x = undefined
            if(this.entity_type === 'Electro Lord Kealthis'){ //the boss
                x = new Item(this.parentScene, this.x, this.y, 'Frozen Heart', 0, 'Frozen Heart', true, true).setAlpha(0)
            }else if(this.entity_type === 'Nepian Observer'){
                //roll for loot
                let drops = Math.round(Math.random())
                drops === 0 ? undefined : x = new Item(this.parentScene, this.x, this.y, 'lesser nepian blood', 0, 'lesser nepian blood', true, true).setScale(0.5).setAlpha(0)
            }
        
            x === undefined ? undefined:  //does x exist
            this.parentScene.p1.windowOpen ? undefined: //is there a window open
            this.looted === false? createLootInterfaceWindow(x, this.parentScene): undefined //has this entity been looted

            this.looted = true
        }
    }
}

//-------------------------------------------------------------------------------
//HELPER FUNCTIONS

//automated movement
function updateMovement(enemy, scene){
  
    var decider =  Math.round(Math.random() * 4)

    switch(decider){
        case 1:
            enemy.setVelocityX(enemy.VELOCITY)
            scene.time.delayedCall(750, () => {
                enemy.setVelocity(0)
                scene.time.delayedCall(500, () => {enemy.setVelocityX(-enemy.VELOCITY)})})
            break
        case 2:
            enemy.setVelocityX(-enemy.VELOCITY)
            scene.time.delayedCall(750, () => {
                enemy.setVelocity(0)
                scene.time.delayedCall(500, () => {enemy.setVelocityX(enemy.VELOCITY)})})
            break
        case 3:
            enemy.setVelocityY(enemy.VELOCITY)
            scene.time.delayedCall(750, () => {
                enemy.setVelocity(0)
                scene.time.delayedCall(500, () => {enemy.setVelocityY(-enemy.VELOCITY)})})
            break
        case 4:
            enemy.setVelocityY(-enemy.VELOCITY)
            scene.time.delayedCall(750, () => {
                enemy.setVelocity(0)
                scene.time.delayedCall(500, () => {enemy.setVelocityY(enemy.VELOCITY)})})
            break
    }   
}

//player aggression
function pursuit(scene, enemy){
    let x = scene.p1.getPosition()
    let x1 = x[0]
    let y1 = x[1]

    let vector = new Phaser.Math.Vector2(0,0)

    if(x1 < enemy.x){
        vector.x = -1
    }else if(x1 > enemy.x){
        vector.x = 1
    }

    if(y1 < enemy.y){
        vector.y = -1
    }else if( y1 > enemy.y){
        vector.y = 1
    }

    vector.normalize()
    enemy.setVelocity(enemy.VELOCITY * vector.x, enemy.VELOCITY * vector.y)
}

/******************STATES****************/

class idleEnemyState extends State{
    enter(scene, enemy){
        console.log('enemy idle')
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
        console.log('in enemy: pursuit')
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
        console.log('in enemy: combat')
        clearInterval(enemy.INTERVAL_ID) 
        enemy.setVelocity(0)

        if(!enemy.isAttacking){

            //sound
            if(scene.sound.sounds.length < 4){
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
            }

            if(enemy.isBoss){
                let switchtomechanic = Math.round(Math.random())
                console.log(switchtomechanic)
                if(switchtomechanic === 1){
                    let y = mechanics[Phaser.Math.Between(0,2)]
                    y(enemy, scene.p1, scene)
                }
            }

            enemy.isAttacking = true

            enemy.lightAttack_dmg= Phaser.Math.Between(enemy.attackPower, enemy.attackPower + enemy.attackPower/2)
            enemy.heavyAttack_dmg = Phaser.Math.Between( enemy.attackPower + enemy.attackPower/2, enemy.attackPower * 2)

            let x = Math.round(Math.random())
            x === 0 ? scene.p1.HIT_POINTS -= enemy.lightAttack_dmg : scene.p1.HIT_POINTS -= enemy.heavyAttack_dmg
            
            console.log('enemy hit player -> ' + scene.p1.HIT_POINTS + '  ' + enemy.lightAttack_dmg + '  ' + enemy.heavyAttack_dmg)
            let attackText = scene.add.text(scene.p1.x + Phaser.Math.Between(-50, 50), scene.p1.y + Phaser.Math.Between(-10,-60), x === 0 ? '-'+enemy.lightAttack_dmg : '-'+enemy.heavyAttack_dmg, {fill: '#FF0000'}).setScale(2).setOrigin(0)
            scene.time.delayedCall(500, ()=>{ attackText.destroy()})

            scene.time.delayedCall(2000, ()=>{
                if(!(enemy.FSM.state === 'dead')){
                    enemy.isAttacking = false
                    enemy.FSM.transition('pursuit') 
                }
            })
        }
    }

    execute(scene, enemy){
        if(!listen(scene, enemy)){
            console.log('here')
            enemy.FSM.transition('idle')
        }
    }
}


class deadEnemyState extends State{
    enter(scene, enemy){

        enemy.HEALTH_BAR.clear()
        console.log('in enemy: dying')

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
                if(alias.currentQuest.ammount > alias.currentQuest.actual){
                    alias.currentQuest.actual += 1
                }
            }
        }

      
        scene.time.delayedCall(5000, () => {
            scene.tweens.add({
                targets: enemy,
                alpha: { from: 1, to: 0 },
                duration: 2000,
                onComplete: () =>{
                    scene.time.delayedCall(5000, ()=>{    
                        scene.tweens.add({
                            targets: [enemy, enemy.entity_text],
                            alpha: { from: 0, to: 1 },
                            duration: 2000,
                        })
                        enemy.x = enemy.spawnOrigin[0]
                        enemy.y = enemy.spawnOrigin[1]
                        enemy.body.enable = true
                        enemy.isAlive = true
                        enemy.looted = false
                        enemy.isAttacking = false
                        enemy.HIT_POINTS = enemy.HIT_POINTS_log
                        enemy.FSM.transition('idle')  
                    })
                }
            })
        }) // remove enemy from scene after appropritte time to loot
    }
}

class resetEnemyState extends State{
    enter(scene, enemy){
        console.log('in enemy reset')
        clearInterval(enemy.INTERVAL_ID)
        enemy.setVelocity(0)
        enemy.setVelocityY(enemy.VELOCITY)  
    }


    execute(scene, enemy){
        if(enemy.y >= 899){
            scene.time.delayedCall(5000, ()=>{this.stateMachine.transition('idle')})
        }
    }
}


class ignoreEnemyState extends State{
    enter(scene, enemy){
        console.log('enemy ignore')
        clearInterval(enemy.INTERVAL_ID)
        enemy.setVelocity(0)
        scene.time.delayedCall(5000, ()=> {this.stateMachine.transition('idle')})
    }
}

