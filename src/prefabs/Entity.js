class Entity extends Phaser.Physics.Arcade.Sprite{
    constructor(scene, x, y, texture, frame, _name='unkown', _hitPoints=100){
        super(scene, x, y, texture, frame)

        scene.add.existing(this)
        scene.physics.add.existing(this)

        //forced update
        scene.events.on('update', this.update, this)

        //physical properties
        this.VELOCITY = 100
        this.setCollideWorldBounds(true)

        //nonphysical
        this.parentScene = scene
        this.entity_type = _name
        this.isAlive = true
        this.HIT_POINTS = _hitPoints
        this.INTERVAL_ID = undefined
        this.reset_e = true
        this.canMove = true
        this.entity_text = scene.add.text(this.x, this.y, this.entity_type, {fill: '#FFFFFF'}).setAlpha(0)
        this.setScale(2.5)    

        scene.physics.add.collider(this, scene.enemies, ()=>{
            //console.log(`collision between ${this.entity_type} and an enemy`)
            this.handleCollision()
        })
    }


    init(){}
    preload(){}
    create(){}

    update(){
        if(!this.isAlive){
            this.destroy()
        }
    }

    //derived classes override this
    handleCollision(){}

    getPosition(){
        return [this.x, this.y]
    }
}