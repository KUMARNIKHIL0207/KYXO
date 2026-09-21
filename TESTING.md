# KYXO Manual Testing

## Actual result in this environment

This environment does not provide a second real browser device (Windows Chrome/Edge + Android Chrome) on the same local network. Because of that, the required real cross-device WebRTC verification could not be executed here.

## Minimum validation (required on a real local network)

Test the following flow on the same local network:

Windows Chrome ↔ Android Chrome

1. Open KYXO on Windows.
2. Create a new QR session.
3. Confirm the PC creates a real `RTCPeerConnection` and actual `kyxo-control` `RTCDataChannel`.
4. Open KYXO on Android.
5. Scan the QR or paste the pairing payload.
6. Confirm the required SDP/ICE signaling exchange completes.
7. Wait for the WebRTC connected state.
8. Confirm the DataChannel reaches `readyState === "open"`.
9. Confirm `HELLO KYXO` is transmitted over the live DataChannel.
10. Confirm the receiving browser actually receives `HELLO KYXO`.
11. Disconnect the network or close the peer and confirm the old session is invalidated and a new QR/session is generated.

## Expected result

```text
QR scanned
    ↓
WebRTC connected
    ↓
DataChannel opened
    ↓
HELLO KYXO received
```

## Additional checks

- Weak Wi‑Fi or hotspot should still establish local P2P when the network path is usable.
- Disconnect during a session should invalidate the old QR and generate a fresh session.
- Reopen the app and create a fresh QR after a disconnect.

## Notes

This phase does not implement file transfer or application-level E2E encryption yet. Only the underlying WebRTC transport and local control channel are in scope.

The current automated validation passed, but the real cross-device WebRTC verification remains pending on a pair of actual devices with a local Wi‑Fi path. Until that is completed, the real browser test remains unverified.
