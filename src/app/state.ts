export const enum ConnectionState {
  IDLE = 'IDLE',
  SESSION_CREATED = 'SESSION_CREATED',
  QR_DISPLAYED = 'QR_DISPLAYED',
  PAIRING = 'PAIRING',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  FAILED = 'FAILED',
  DESTROYED = 'DESTROYED',
}

export const VALID_TRANSITIONS: Record<ConnectionState, ConnectionState[]> = {
  [ConnectionState.IDLE]: [ConnectionState.SESSION_CREATED, ConnectionState.FAILED, ConnectionState.DESTROYED],
  [ConnectionState.SESSION_CREATED]: [ConnectionState.QR_DISPLAYED, ConnectionState.FAILED, ConnectionState.DESTROYED],
  [ConnectionState.QR_DISPLAYED]: [ConnectionState.PAIRING, ConnectionState.FAILED, ConnectionState.DESTROYED],
  [ConnectionState.PAIRING]: [ConnectionState.CONNECTING, ConnectionState.FAILED, ConnectionState.DESTROYED],
  [ConnectionState.CONNECTING]: [ConnectionState.CONNECTED, ConnectionState.DISCONNECTED, ConnectionState.FAILED, ConnectionState.DESTROYED],
  [ConnectionState.CONNECTED]: [ConnectionState.DISCONNECTED, ConnectionState.FAILED, ConnectionState.DESTROYED],
  [ConnectionState.DISCONNECTED]: [ConnectionState.SESSION_CREATED, ConnectionState.FAILED, ConnectionState.DESTROYED],
  [ConnectionState.FAILED]: [ConnectionState.SESSION_CREATED, ConnectionState.DESTROYED],
  [ConnectionState.DESTROYED]: [ConnectionState.IDLE, ConnectionState.SESSION_CREATED, ConnectionState.DESTROYED],
};

export class ConnectionStateMachine {
  public state: ConnectionState = ConnectionState.IDLE;

  transition(nextState: ConnectionState): ConnectionState {
    const allowed = VALID_TRANSITIONS[this.state] ?? [];
    if (!allowed.includes(nextState)) {
      throw new Error(`Invalid transition from ${this.state} to ${nextState}`);
    }
    this.state = nextState;
    return this.state;
  }

  reset(): ConnectionState {
    this.state = ConnectionState.IDLE;
    return this.state;
  }
}
