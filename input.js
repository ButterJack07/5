const codes = {
  KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd', KeyE: 'e', KeyQ: 'q', KeyF:'f', KeyC: 'c',
  Digit1: '1', Digit2: '2', KeyZ: 'z', KeyX: 'x',
  ShiftLeft: 'shift', ShiftRight: 'shift',
  ArrowUp: 'arrowup', ArrowDown: 'arrowdown',
  ArrowLeft: 'arrowleft', ArrowRight: 'arrowright', Space: ' '
};

export function inputKey(event) {
  return codes[event.code] || (typeof event.key === 'string' ? event.key.toLowerCase() : '');
}

export function isGameKey(key) {
  return Object.values(codes).includes(key);
}
