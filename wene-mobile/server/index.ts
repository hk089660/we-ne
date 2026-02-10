/**
 * 開発起動用: Node で API サーバを起動
 * EXPO_PUBLIC_API_BASE_URL=http://localhost:8787 で UI が接続する
 */

import { createServer } from './createServer';
import { createMemoryStorage } from './storage/MemoryStorage';
import { listen } from './createServer';

const PORT = parseInt(process.env.PORT ?? '8787', 10);

const app = createServer({
  storage: createMemoryStorage(),
});

listen(app, PORT)
  .then(({ port, close }) => {
    console.log(`School API server listening on http://localhost:${port}`);
    process.on('SIGINT', () => close().then(() => process.exit(0)));
    process.on('SIGTERM', () => close().then(() => process.exit(0)));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
