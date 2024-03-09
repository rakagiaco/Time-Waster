class Menu extends Phaser.Scene{
    constructor(){
        super('menuScene')
    }

    create(){
        
        //title
        this.add.text(game.config.width/2, game.config.height/2 - 25, 'Time Waster',{
            fontFamily: 'Comic Sans MS',
            fontSize : '30px',
            fontStyle: 'italic',
            color : '#FFFFFF',
            align : 'right', 
            padding : {top : 5, bottom : 5},
            fixedWidth : 0,
        }).setOrigin(0.5)
  
        //buttons
        this.startButton = this.add.sprite(game.config.width/2, game.config.height/2 + 150, 'start-button').setInteractive()
        
        //button logic
        this.startButton.on('pointerdown', ()=>{
            this.scene.start('worldScene')
        }) 
    }
}