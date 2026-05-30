#!/usr/bin/env python3
"""
数据库管理类
处理会话和消息的 CRUD 操作
"""
import sqlite3
import time
from typing import List, Dict, Any, Optional

db_path = 'chat.db'

class DatabaseManager:
    """数据库管理类"""
    
    def __init__(self):
        """初始化数据库连接"""
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
    
    def __enter__(self):
        """进入上下文管理器"""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """退出上下文管理器"""
        if self.conn:
            self.conn.close()
    
    def create_session(self, title: str, model: str = 'deepseek-chat') -> int:
        """创建新会话"""
        cursor = self.conn.cursor()
        cursor.execute(
            "INSERT INTO sessions (title, model) VALUES (?, ?)",
            (title, model)
        )
        session_id = cursor.lastrowid
        self.conn.commit()
        return session_id
    
    def get_sessions(self) -> List[Dict[str, Any]]:
        """获取所有会话"""
        cursor = self.conn.cursor()
        cursor.execute(
            "SELECT * FROM sessions ORDER BY is_pinned DESC, updated_at DESC"
        )
        sessions = []
        for row in cursor.fetchall():
            sessions.append({
                'id': row['id'],
                'title': row['title'],
                'created_at': row['created_at'],
                'updated_at': row['updated_at'],
                'is_pinned': row['is_pinned'],
                'model': row['model']
            })
        return sessions
    
    def get_session(self, session_id: int) -> Optional[Dict[str, Any]]:
        """获取单个会话"""
        cursor = self.conn.cursor()
        cursor.execute(
            "SELECT * FROM sessions WHERE id = ?",
            (session_id,)
        )
        row = cursor.fetchone()
        if row:
            return {
                'id': row['id'],
                'title': row['title'],
                'created_at': row['created_at'],
                'updated_at': row['updated_at'],
                'is_pinned': row['is_pinned'],
                'model': row['model']
            }
        return None
    
    def update_session(self, session_id: int, **kwargs):
        """更新会话"""
        cursor = self.conn.cursor()
        
        # 构建更新语句
        set_clause = []
        params = []
        
        for key, value in kwargs.items():
            set_clause.append(f"{key} = ?")
            params.append(value)
        
        # 添加 updated_at
        set_clause.append("updated_at = CURRENT_TIMESTAMP")
        
        if set_clause:
            sql = f"UPDATE sessions SET {', '.join(set_clause)} WHERE id = ?"
            params.append(session_id)
            cursor.execute(sql, params)
            self.conn.commit()
    
    def delete_session(self, session_id: int):
        """删除会话"""
        cursor = self.conn.cursor()
        cursor.execute(
            "DELETE FROM sessions WHERE id = ?",
            (session_id,)
        )
        self.conn.commit()
    
    def toggle_pinned(self, session_id: int):
        """切换会话置顶状态"""
        cursor = self.conn.cursor()
        cursor.execute(
            "UPDATE sessions SET is_pinned = 1 - is_pinned, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (session_id,)
        )
        self.conn.commit()
    
    def add_message(self, session_id: int, role: str, content: str) -> int:
        """添加消息"""
        cursor = self.conn.cursor()
        cursor.execute(
            "INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)",
            (session_id, role, content)
        )
        message_id = cursor.lastrowid
        
        # 更新会话的 updated_at
        cursor.execute(
            "UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (session_id,)
        )
        
        self.conn.commit()
        return message_id
    
    def get_messages(self, session_id: int) -> List[Dict[str, Any]]:
        """获取会话的所有消息"""
        cursor = self.conn.cursor()
        cursor.execute(
            "SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC",
            (session_id,)
        )
        messages = []
        for row in cursor.fetchall():
            messages.append({
                'id': row['id'],
                'session_id': row['session_id'],
                'role': row['role'],
                'content': row['content'],
                'created_at': row['created_at']
            })
        return messages
    
    def delete_messages(self, session_id: int):
        """删除会话的所有消息"""
        cursor = self.conn.cursor()
        cursor.execute(
            "DELETE FROM messages WHERE session_id = ?",
            (session_id,)
        )
        self.conn.commit()

# 全局数据库管理器实例
db_manager = DatabaseManager()