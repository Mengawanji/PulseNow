import { pool } from "./database.js";

export const createTablesAndIndexes = async () => {
  const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(`
            CREATE TABLE IF NOT EXISTS hosts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            host_id UUID REFERENCES hosts(id) ON DELETE CASCADE,
            code VARCHAR(6) UNIQUE NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            is_active BOOLEAN DEFAULT true
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS polls (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
            question TEXT NOT NULL,
            poll_type VARCHAR(20) DEFAULT 'single_choice',
            options JSONB DEFAULT '[]',
            status VARCHAR(20) DEFAULT 'draft',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS participants (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            phone VARCHAR(20),
            joined_at TIMESTAMP DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS  responses (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
            participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
            answer JSONB NOT NULL,
            submitted_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(poll_id, participant_id)
            );
        `);

        await client.query('COMMIT');
            console.log('Tables and indexes created successfully.');
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error creating tables and indexes:', error.message);
        } finally {
            client.release();
        }
        };
