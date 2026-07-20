import pg from 'pg';

const { Pool } = pg;

/**
 * Pool singleton de conexiones PostgreSQL.
 *
 * Decisiones de arquitectura:
 * - max:20 es suficiente para una aplicación unipersonal con picos bajos.
 * - idleTimeoutMillis:30000 libera conexiones inactivas para no agotar el límite de Railway.
 * - connectionTimeoutMillis:5000 falla rápido en lugar de colgar el proceso.
 * - ssl: requerToServerCertificate=false porque Railway gestiona SSL en el proxy (no requiere verificación de cert en el driver).
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('error', (err) => {
  // Un cliente idle que muere no debería tumbar el proceso, pero sí debe quedar registrado.
  console.error('[database] Error inesperado en cliente idle del pool:', err.message);
});

/**
 * Verifica que la conexión a PostgreSQL es funcional al inicio.
 * Lanza un error si no puede conectar, lo que detiene el arranque del servidor.
 */
export async function testDatabaseConnection(): Promise<void> {
  let client: pg.PoolClient | undefined;
  try {
    client = await pool.connect();
    const result = await client.query<{ now: string }>('SELECT NOW() AS now');
    console.log(`[database] Conexión PostgreSQL OK — servidor: ${result.rows[0].now}`);
  } catch (err) {
    console.error('[database] CRÍTICO: No se pudo conectar a PostgreSQL.');
    console.error('[database] Verificar DATABASE_URL y accesibilidad del host.');
    throw err;
  } finally {
    client?.release();
  }
}

/**
 * Ejecuta una función dentro de una transacción de base de datos.
 * Hace ROLLBACK automático si el callback lanza una excepción.
 *
 * @example
 * const result = await withTransaction(async (client) => {
 *   await client.query('INSERT INTO bookings ...');
 *   await client.query('INSERT INTO payments ...');
 *   return { bookingId: ... };
 * });
 */
export async function withTransaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
