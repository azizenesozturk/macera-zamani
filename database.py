import sqlite3

DB_NAME = "macera.db"


def get_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row  # Sonuçları sözlük (dict) gibi kullanmamızı sağlar
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Tek nokta + not için tablo
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS places (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            category TEXT NOT NULL DEFAULT 'diger',
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Rota (birden fazla nokta) için tablo
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS routes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            category TEXT NOT NULL DEFAULT 'yuruyus',
            points TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()
    print("Veritabani hazir.")


if __name__ == "__main__":
    init_db()