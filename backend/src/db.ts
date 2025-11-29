import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(path.join(__dirname, '../swap.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    direction TEXT NOT NULL,
    amount REAL NOT NULL,
    recipient_address TEXT NOT NULL,
    deposit_address TEXT NOT NULL,
    status TEXT NOT NULL,
    output_amount REAL NOT NULL,
    expires_at INTEGER NOT NULL,
    deposit_tx_hash TEXT,
    output_tx_hash TEXT,
    created_at INTEGER NOT NULL
  )
`);

export interface Order {
  id: string;
  direction: 'ADA_TO_ETH' | 'ETH_TO_ADA';
  amount: number;
  recipient_address: string;
  deposit_address: string;
  status: 'pending' | 'deposited' | 'processing' | 'completed' | 'expired';
  output_amount: number;
  expires_at: number;
  deposit_tx_hash?: string;
  output_tx_hash?: string;
  created_at: number;
}

export const createOrder = (order: Omit<Order, 'created_at'>) => {
  const stmt = db.prepare(`
    INSERT INTO orders (id, direction, amount, recipient_address, deposit_address, status, output_amount, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    order.id,
    order.direction,
    order.amount,
    order.recipient_address,
    order.deposit_address,
    order.status,
    order.output_amount,
    order.expires_at,
    Date.now()
  );
};

export const getOrder = (id: string): Order | undefined => {
  const stmt = db.prepare('SELECT * FROM orders WHERE id = ?');
  const row = stmt.get(id) as any;

  if (!row) return undefined;

  return {
    id: row.id,
    direction: row.direction,
    amount: row.amount,
    recipient_address: row.recipient_address,
    deposit_address: row.deposit_address,
    status: row.status,
    output_amount: row.output_amount,
    expires_at: row.expires_at,
    deposit_tx_hash: row.deposit_tx_hash,
    output_tx_hash: row.output_tx_hash,
    created_at: row.created_at,
  };
};

export const updateOrderStatus = (
  id: string,
  status: Order['status'],
  depositTxHash?: string,
  outputTxHash?: string
) => {
  const stmt = db.prepare(`
    UPDATE orders
    SET status = ?, deposit_tx_hash = ?, output_tx_hash = ?
    WHERE id = ?
  `);

  stmt.run(status, depositTxHash || null, outputTxHash || null, id);
};

// Atomic update: Only mark as deposited if status is still 'pending'
// Returns true if update succeeded, false if order was already processed
export const markAsDepositedIfPending = (
  id: string,
  depositTxHash: string
): boolean => {
  const stmt = db.prepare(`
    UPDATE orders
    SET status = 'deposited', deposit_tx_hash = ?
    WHERE id = ? AND status = 'pending'
  `);

  const result = stmt.run(depositTxHash, id);
  return result.changes > 0; // Returns true if row was actually updated
};

// Atomic update: Only mark as processing if status is 'deposited'
// Prevents double-execution of swaps
export const markAsProcessingIfDeposited = (id: string): boolean => {
  const stmt = db.prepare(`
    UPDATE orders
    SET status = 'processing'
    WHERE id = ? AND status = 'deposited'
  `);

  const result = stmt.run(id);
  return result.changes > 0;
};

export const getPendingOrders = (): Order[] => {
  const stmt = db.prepare(`
    SELECT * FROM orders
    WHERE status IN ('pending', 'deposited', 'processing')
    AND expires_at > ?
  `);

  const rows = stmt.all(Date.now()) as any[];

  return rows.map(row => ({
    id: row.id,
    direction: row.direction,
    amount: row.amount,
    recipient_address: row.recipient_address,
    deposit_address: row.deposit_address,
    status: row.status,
    output_amount: row.output_amount,
    expires_at: row.expires_at,
    deposit_tx_hash: row.deposit_tx_hash,
    output_tx_hash: row.output_tx_hash,
    created_at: row.created_at,
  }));
};

export const expireOldOrders = () => {
  const stmt = db.prepare(`
    UPDATE orders
    SET status = 'expired'
    WHERE status = 'pending' AND expires_at <= ?
  `);

  stmt.run(Date.now());
};

export default db;
