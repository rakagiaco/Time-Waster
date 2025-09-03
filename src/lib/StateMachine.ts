/**
 * State Machine System
 * 
 * A flexible finite state machine implementation for managing entity behaviors,
 * animations, and game logic. Used throughout the game for AI, player actions,
 * and UI state management.
 * 
 * Key Features:
 * - Generic state management with type safety
 * - Automatic state initialization and transition handling
 * - Shared state arguments for consistent data access
 * - Extensible State base class for custom behaviors
 * 
 * Architecture:
 * - StateMachine: Core state management and transition logic
 * - State: Abstract base class for all state implementations
 * - possibleStates: Object mapping state names to State instances
 * - stateArgs: Shared arguments passed to all state methods
 */

import { Scene } from 'phaser';

/**
 * State Machine Class
 * 
 * Manages state transitions and execution for game entities.
 * Automatically handles state initialization and provides transition methods.
 */
export class StateMachine {
    private initialState: string;                    // Name of the starting state
    private possibleStates: Record<string, State>;   // Map of state names to State instances
    private stateArgs: any[];                        // Arguments passed to all state methods
    public state: string | null;                     // Current active state name

    /**
     * Creates a new state machine with the specified configuration
     * 
     * @param initialState - Name of the state to start in
     * @param possibleStates - Object mapping state names to State instances
     * @param stateArgs - Arguments passed to enter() and execute() methods
     */
    constructor(initialState: string, possibleStates: Record<string, State>, stateArgs: any[] = []) {
        this.initialState = initialState;
        this.possibleStates = possibleStates;
        this.stateArgs = stateArgs;
        this.state = null;

        // Provide each state instance with access to this state machine
        // This allows states to trigger transitions via this.stateMachine.transition()
        for(const state of Object.values(this.possibleStates)) {
            (state as any).stateMachine = this;
        }
    }

    /**
     * Executes the current state's logic
     * 
     * Should be called every frame in the scene's update() loop.
     * Handles initial state setup and continuous state execution.
     */
    step(): void {
        // Initialize state machine on first run
        if(this.state === null) {
            this.state = this.initialState;
            this.possibleStates[this.state].enter.apply(null, this.stateArgs as any);
        }

        // Execute the current state's main logic
        this.possibleStates[this.state].execute.apply(null, this.stateArgs as any);
    }

    /**
     * Transitions to a new state
     * 
     * @param newState - Name of the state to transition to
     * @param enterArgs - Additional arguments passed only to the enter() method
     */
    transition(newState: string, ...enterArgs: any[]): void {
        this.state = newState;
        // Call enter method with both standard args and any additional enter-specific args
        this.possibleStates[this.state].enter.apply(null, [...this.stateArgs, ...enterArgs] as any);
    }

    /**
     * Stops and cleans up the state machine
     * 
     * Resets all internal state and clears references for garbage collection.
     */
    stop(): void {
        this.state = null;
        this.possibleStates = {};
        this.stateArgs = [];
    }
}

/**
 * Abstract State Base Class
 * 
 * Defines the interface that all state implementations must follow.
 * Provides structure for state behavior and optional cleanup logic.
 */
export abstract class State {
    /**
     * Called when entering this state
     * 
     * @param scene - The current Phaser scene
     * @param entity - The entity this state belongs to
     */
    abstract enter(scene: Scene, entity: any): void;
    
    /**
     * Called every frame while in this state
     * 
     * @param scene - The current Phaser scene  
     * @param entity - The entity this state belongs to
     */
    abstract execute(scene: Scene, entity: any): void;
    
    /**
     * Called when leaving this state (optional)
     * 
     * Override in subclasses to implement cleanup logic such as
     * stopping animations, clearing timers, or resetting properties.
     * 
     * @param _scene - The current Phaser scene
     * @param _entity - The entity this state belongs to
     */
    exit(_scene: Scene, _entity: any): void {
        // Default implementation does nothing
        // Subclasses can override for cleanup behavior
    }
}