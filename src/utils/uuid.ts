export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
      (parseInt(c, 10) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> parseInt(c, 10) / 4).toString(16)
    );
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
