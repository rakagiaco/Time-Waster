class Enemy extends Entity{
    constructor(scene, x, y, texture, frames, _name='NPC-enemy', _hitPoints, _origin=[]){
        super(scene, x, y, texture, frames, _name, _hitPoints)
        
        
        //fsm
        this.FSM = new StateMachine('idle', {
            idle: new idleEnemyState(),
            pursuit: new pursuitEnemyState()
        }, [scene, this])
        //nonphysical
        this.spawnOrigin = _origin
        this.detectionDistance = 150
        this.setOrigin(0)
        this.entity_text.setAlpha(1)


        //physical
        this.VELOCITY = 50
    }

    init(){
      
    }

    update(){

        this.FSM.step()
        
        this.entity_text.x = this.x
        this.entity_text.y = this.y
    }

    //collision handler
    handleCollision(){
        this.setVelocity(-this.body.velocity.x, -this.body.velocity.y)
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

//seems like this kind of works
function resetPosition(enemy, scene){
    console.log(enemy.y)
    clearInterval(enemy.INTERVAL_ID)
    enemy.setVelocity(0)
    enemy.setVelocityY(enemy.VELOCITY)  
    if(enemy.y >= 899){
        scene.time.delayedCall(5000, ()=>{enemy.INTERVAL_ID = setInterval(updateMovement, (Math.round(Math.random() *(3500 - 1750 + 1)) + 1750), enemy, scene)
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
        console.log('in enemy idle')
        enemy.INTERVAL_ID = setInterval(updateMovement, (Math.round(Math.random() *(3500 - 1750 + 1)) + 1750), enemy, scene)
    }

    execute(scene, enemy){
        if(listen(scene, enemy)){
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
        console.log('in pursuit state')
    }

    execute(scene, enemy){
        if(!listen(scene, enemy)){
            this.stateMachine.transition('idle')
        }
        pursuit(scene, enemy)
    }
}