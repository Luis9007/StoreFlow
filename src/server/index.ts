/**
 * @file index.ts (src/server/index.ts)
 * @description Punto de entrada para el arranque del Servidor Backend Node.js.
 */

import app from './app';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend Node.js ejecutándose en http://localhost:${PORT}`);
});
