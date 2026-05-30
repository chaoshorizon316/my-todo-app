#!/usr/bin/env python3
"""
数据库初始化脚本
创建会话和消息表
"""
import sqlite3
import os

db_path = 'chat.db'

def init_db():
    """初始化数据库"""
    # 连接数据库
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 创建会话表
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_pinned INTEGER DEFAULT 0,
        model TEXT DEFAULT 'deepseek-chat'
    )
    ''')
    
    # 创建消息表
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )
    ''')
    
    # 提交并关闭
    conn.commit()
    conn.close()
    
    print(f"数据库初始化完成，文件：{db_path}")

if __name__ == '__main__':
    init_db()