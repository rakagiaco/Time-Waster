class Entity extends Phaser.Physics.Arcade.Sprite{
    constructor(scene, x, y, texture, frame, _name='unkown', _hitPoints=100){
        super(scene, x, y, texture, frame)
        
        scene.add.existing(this)
        scene.physics.add.existing(this)
        scene.events.on('update', this.update, this)

        //physical properties
        this.VELOCITY = 100
        this.setCollideWorldBounds(true)
        this.setScale(2.5)   
        //this.setInteractive()
        
        //nonphysical
        this.setOrigin(0)
        this.setDepth(1)
        this.parentScene = scene
        this.entity_type = _name
        this.detectionDistance = 150

        //health
        this.isAlive = true
        this.HIT_POINTS = _hitPoints
        this.HIT_POINTS_log = _hitPoints //this way we can reset it
        //healthbar
        this.HEALTH_BAR = scene.add.graphics().setAlpha(1).setDepth(1)
        this.HEALTH_BAR.width = 50
        this.updateHealthBar()

        //timing, reset
        this.INTERVAL_ID = undefined
        this.reset_e = true
        this.canMove = true
        this.entity_text = scene.add.text(this.x, this.y-20, this.entity_type, {fill: '#FFFFFF'}).setAlpha(0).setDepth(3)//nameplate 

        //damage dealing properties
        this.lightAttack_dmg = undefined
        this.heavyAttack_dmg = undefined

        //everything collides with enemies
        scene.physics.add.overlap(this, scene.enemies, (object, enemy)=>{
            //console.log(`collision between ${this.entity_type} and ${enemy.entity_type}`)
            if(this.entity_type === 'p1'){
                enemy.handleCollision()
                this.handleCollision(enemy)
            }
            
        })

        scene.physics.add.collider(this, scene.trees, (object, enemy)=>{
           // console.log(`collision between ${this.entity_type} and a tree!`)
        })

        this.on('pointerdown', ()=>{
            console.log(`entity-click ${this.entity_type}`)
            toggleCursor(scene)
            this.handleClick()
        })  
    }

    //derived classes override this
    handleCollision(){}
    handleClick(){}

    update(){}

    getPosition(){
        return [this.x, this.y]
    }

    getVelocity(){
        return [this.body.velocity.x, this.body.velocity.y]
    }

    updateNamePlate(){
        this.entity_text.x = this.x
        this.entity_text.y = this.y - 30
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
        this.HEALTH_BAR.fillRect(this.x, this.y - 15, this.HEALTH_BAR.width * currentHealthPercent, 5)
    }
}