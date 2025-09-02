# Time Waster - RPG Game

A Phaser.js RPG game built with Vite and TypeScript, featuring quest systems, dynamic inventory, custom AI, and local storage saves.

## Features

- **Quest System**: Easily scalable quest chain with JSON formatting support
- **Dynamic Inventory**: Flexible item management system
- **Entity Framework**: High-level abstractions for game objects
- **Custom AI**: Intelligent enemy units with state machines
- **Local Storage**: Game state persistence
- **Custom Tilemaps**: Made in Tiled for unlimited map resizing

## Tech Stack

- **Phaser.js 3.70+**: Game framework
- **TypeScript**: Type-safe development
- **Vite**: Modern build tool and dev server
- **State Machine Pattern**: For entity behavior management

## Prerequisites

- Node.js 18+ 
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd time-waster-game
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
├── src/
│   ├── config/
│   │   └── GameConfig.ts          # Game constants and configuration
│   ├── prefabs/
│   │   ├── Entity.ts              # Base entity class
│   │   ├── Player.ts              # Player character
│   │   ├── Enemy.ts               # Enemy AI and behavior
│   │   ├── Ally.ts                # NPC ally system
│   │   ├── Item.ts                # Collectible items
│   │   └── Inventory.ts           # Inventory management
│   └── scenes/
│       ├── general/
│       │   ├── Loader.ts          # Asset loading
│       │   ├── Menu.ts            # Main menu
│       │   ├── Credits.ts         # Credits scene
│       │   └── GameOver.ts        # Game over scene
│       └── game/
│           └── World.ts           # Main game world
├── lib/
│   ├── StateMachine.ts            # State machine implementation
│   ├── HelperFunc.ts              # Utility functions
│   └── BossMechanics.ts           # Boss-specific mechanics
├── assets/                         # Game assets (images, audio, etc.)
├── index.html                     # Main HTML file
├── vite.config.ts                 # Vite configuration
├── tsconfig.json                  # TypeScript configuration
└── package.json                   # Dependencies and scripts
```

## Development

### Adding New Features

1. **New Entities**: Extend the `Entity` class
2. **New States**: Extend the `State` class
3. **New Scenes**: Extend `Phaser.Scene`
4. **Configuration**: Add constants to `GameConfig.ts`

### TypeScript Benefits

- **Type Safety**: Catch errors at compile time
- **IntelliSense**: Better IDE support and autocomplete
- **Refactoring**: Safe code restructuring
- **Documentation**: Self-documenting code with types

### Vite Benefits

- **Fast HMR**: Instant hot module replacement
- **ES Modules**: Modern JavaScript features
- **Optimized Builds**: Efficient production builds
- **Plugin Ecosystem**: Rich plugin support

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Credits

- **Original Game**: C.J. Moshy for UCSC's CMPM 120
- **Audio Assets**: Pixabay (licensed under Pixabay License)
- **Visual Assets**: Made in-house
- **Build System**: Converted to Vite + TypeScript by AI Assistant

## Support

For issues and questions:
1. Check the existing issues
2. Create a new issue with detailed information
3. Include steps to reproduce the problem
