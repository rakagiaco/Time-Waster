class Menu extends Phaser.Scene{
    constructor(){
        super('menuScene')
    }

    create(data){
        //title
        this.add.text(game.config.width/2, game.config.height/2 - 25, 'Time Waster',{
            fontFamily: 'Helvetica',
            fontSize : '40px',
            fontStyle: 'italic',
            color : '#FFFFFF',
            align : 'right', 
            padding : {top : 5, bottom : 5},
            fixedWidth : 0,
        }).setOrigin(0.5)
  
        //todo CONTINUE ART
        this.continueButton = this.add.image(game.config.width/2 - 150, game.config.height/2+ 200, 'continue-game-button').setInteractive({ useHandCursor: true }).on('pointerdown', ()=>{
            this.scene.start('worldScene', data)
        }) 

        //todo NEW GAME ART 
        this.newGameBtn = this.add.image(game.config.width/2 + 150, game.config.height/2+ 200, 'new-game-button').setInteractive({ useHandCursor: true }).on('pointerdown', () => {
            window.localStorage.removeItem('existing_inv')
            window.localStorage.removeItem('existing_quest')
            data.inv = undefined
            data.qobj = undefined
            this.scene.start('worldScene', data)
        })
    }
}