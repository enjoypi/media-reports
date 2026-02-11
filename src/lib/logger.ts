function formatLines(prefix: string, msg: string): string {
  return msg.split('\n').map((line) => `${prefix} ${line}`).join('\n');
}

export function info(msg: string): void {
  console.log(formatLines('[INFO]', msg));
}

export function warn(msg: string): void {
  console.warn(formatLines('[WARN]', msg));
}

export function error(msg: string): void {
  console.error(formatLines('[ERROR]', msg));
}
