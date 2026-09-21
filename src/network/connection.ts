import { ConnectionState, ConnectionStateMachine } from '../app/state';

export function createConnectionStateMachine(): ConnectionStateMachine {
  return new ConnectionStateMachine();
}

export { ConnectionState, ConnectionStateMachine };
