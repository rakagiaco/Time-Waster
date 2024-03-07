class Enemy extends Entity{
    constructor(scene, x, y, texture, frames, _name='NPC-enemy', _hitPoints, _origin=[]){
        super(scene, x, y, texture, frames, _name, _hitPoints)
        
        
        //fsm
        this.FSM = new StateMachine('idle', {
            idle: new idleEnemyState(),
            pursuit: new pursuitEnemyState(),
            combat: new combatEnemyState(),
            dead: new deadEnemyState()
        }, [scene, this])

        
        //nonphysical
        this.spawnOrigin = _origin
        this.detectionDistance = 200
        this.setOrigin(0)
        this.entity_text.setAlpha(1)


        //physical
        super.VELOCITY = 50
    }

    init(){
      
    }

    update(){
        if(this.isAlive){
            super.update()
            super.updateNamePlate()
            this.FSM.step()
        }
    }

    //collision handler
    handleCollision(){
        console.log('enemy collide')
    }

    handleClick(){
        if(this.FSM.state === 'dead'){
            console.log('dead click')
        }
    }

    // reset(){
    //     console.log('here')
    //     this.body.enable = true
    //     this.isAlive = true
    //     this.x = this.spawnOrigin.x
    //     this.y = this.spawnOrigin.y
    //     this.entity_text.setAlpha(1)
    //     this.setAlpha(1)
    //     this.FSM.transition('idle')
    // }
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

//seems like this kind of works
function resetPosition(enemy, scene){
    clearInterval(enemy.INTERVAL_ID)
    enemy.setVelocity(0)
    enemy.setVelocityY(enemy.VELOCITY)  
    if(enemy.y >= 899){
        scene.time.delayedCall(5000, ()=>{enemy.INTERVAL_ID = setInterval(updateMovement, (Math.round(Math.random() *(1751)) + 1750), enemy, scene)
        })
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

//player detection
function listen(scene, enemy){
    let x = scene.p1.getPosition()
    let x1 = x[0]
    let y1 = x[1]

    //true if player is in range (150 px)
    if(x1 > (enemy.x-enemy.detectionDistance) && x1 < (enemy.x+enemy.detectionDistance) && y1 > (enemy.y-enemy.detectionDistance) && y1 < (enemy.y+enemy.detectionDistance)){
        return true
    } else {
        return false
    }
}

//---------------------------------------------------------------------
//STATES

class idleEnemyState extends State{
    enter(scene, enemy){
        enemy.INTERVAL_ID = setInterval(updateMovement, (Math.round(Math.random() *(1751)) + 1750), enemy, scene)
    }

    execute(scene, enemy){
        if(listen(scene, enemy)){ //player is in range
            this.stateMachine.transition('pursuit')
        }
        if(enemy.y < 900){ //maybe use config here for better properties
            resetPosition(enemy, scene)
        }
    }
}

class pursuitEnemyState extends State{
    enter(scene, enemy){
        clearInterval(enemy.INTERVAL_ID)
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
    }

    execute(scene, enemy){
        //enemy.setVelocity(0)
    }
}


class deadEnemyState extends State{
    enter(scene, enemy){
        console.log('enemy dying')

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
                        enemy.FSM.transition('idle')  
                    })
                }
            })
        }) // remove enemy from scene after appropritte time to loot
    }
}