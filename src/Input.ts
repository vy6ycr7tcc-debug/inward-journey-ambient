export enum Action {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  OK = 'OK',
  BACK = 'BACK',
}

export class InputManager {
  private actions: Set<Action> = new Set();
  private listeners: ((action: Action) => void)[] = [];

  constructor() {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  private mapKeyToAction(key: string): Action | null {
    switch (key) {
      case 'ArrowUp':
        return Action.UP;
      case 'ArrowDown':
        return Action.DOWN;
      case 'ArrowLeft':
        return Action.LEFT;
      case 'ArrowRight':
        return Action.RIGHT;
      case 'Enter':
        return Action.OK;
      case 'Escape':
      case 'Backspace': // some TV remotes map back to backspace
        return Action.BACK;
      default:
        return null;
    }
  }

  private handleKeyDown(e: KeyboardEvent) {
    const action = this.mapKeyToAction(e.key);
    if (action && !this.actions.has(action)) {
      this.actions.add(action);
      this.listeners.forEach((listener) => listener(action));
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    const action = this.mapKeyToAction(e.key);
    if (action) {
      this.actions.delete(action);
    }
  }

  public isActionActive(action: Action): boolean {
    return this.actions.has(action);
  }

  public addListener(listener: (action: Action) => void) {
    this.listeners.push(listener);
  }

  public removeListener(listener: (action: Action) => void) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }
}
