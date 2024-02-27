class Entity extends Phaser.Physics.Arcade.Sprite{
    constructor(scene, x, y, texture, frame, _name='unkown', _hitPoints=100){
        super(scene, x, y, texture, frame)

        scene.add.existing(this)
        scene.physics.add.existing(this)

        //forced update
        scene.events.on('update', this.update, this)

        //physical properties
        this.VELOCITY = 300
        this.setCollideWorldBounds(true)

        //nonphysical
        this.parentScene = scene
        this.entity_type = _name
        this.isAlive = true
        this.HIT_POINTS = _hitPoints
        this.INTERVAL_ID = undefined
        this.reset = true
        this.canMove = true
        
        this.setScale(2.5)
        this.setInteractive()      
    }


    init(){}
    preload(){}
    create(){}

    update(){
        if(!this.isAlive){
            this.destroy()
        }
    }
}