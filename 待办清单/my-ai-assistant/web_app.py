#!/usr/bin/env python3
"""
智能助手 Web 界面
基于 Claude Code 架构的简化实现 - Web 版本
"""
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import threading
from query_engine import QueryEngine, QueryEngineConfig

app = Flask(__name__)
CORS(app)

# 全局查询引擎实例
engine = None
engine_lock = threading.Lock()

# 会话管理
session_engines = {}

from database import DatabaseManager
db = DatabaseManager()


def get_engine(session_id=None):
    """获取查询引擎实例（保持会话状态）"""
    global engine, session_engines
    from config import config as app_config
    from llm_client import llm_client
    
    # 重新初始化 LLM 客户端，确保使用最新配置
    llm_client.api_key = app_config.api_key
    llm_client.api_base = app_config.api_base
    llm_client.model = app_config.current_model
    
    if session_id:
        # 使用会话特定的引擎
        if session_id not in session_engines:
            # 从数据库获取会话信息
            session = db.get_session(session_id)
            if not session:
                return None
            
            # 创建新的引擎实例
            config = QueryEngineConfig(
                api_key=app_config.api_key,
                model=session.get('model', app_config.current_model),
                system_prompt=app_config.system_prompt,
                web_search_enabled=False,
                thinking_mode=False,
                detail_level="normal"
            )
            session_engines[session_id] = QueryEngine(config, session_id)
        return session_engines[session_id]
    else:
        # 使用全局引擎
        with engine_lock:
            if engine is None:
                # 首次创建引擎实例
                config = QueryEngineConfig(
                    api_key=app_config.api_key,
                    model=app_config.current_model,
                    system_prompt=app_config.system_prompt,
                    web_search_enabled=False,
                    thinking_mode=False,
                    detail_level="normal"
                )
                engine = QueryEngine(config)
            else:
                # 检查模型是否变更，如果变更则重新创建引擎
                current_model = app_config.current_model
                if hasattr(engine, 'config') and hasattr(engine.config, 'model'):
                    if engine.config.model != current_model:
                        config = QueryEngineConfig(
                            api_key=app_config.api_key,
                            model=app_config.current_model,
                            system_prompt=app_config.system_prompt,
                            web_search_enabled=False,
                            thinking_mode=False,
                            detail_level="normal"
                        )
                        engine = QueryEngine(config)
            return engine


@app.route('/')
def index():
    """主页"""
    return render_template('index.html')


@app.route('/config')
def config_page():
    """配置页面"""
    return render_template('config.html')


@app.route('/api/config', methods=['GET', 'POST'])
def config_api():
    """配置 API"""
    from config import config
    
    if request.method == 'GET':
        return jsonify({
            'current_model': config.current_model,
            'models': config.models,
            'api_key': config.api_key,
            'api_base': config.api_base,
            'system_prompt': config.system_prompt
        })
    
    elif request.method == 'POST':
        try:
            data = request.json
            action = data.get('action')
            
            if action == 'save':
                # 保存当前模型配置
                model_name = data.get('model', config.current_model)
                config.set_model_config(model_name, {
                    'api_key': data.get('api_key', ''),
                    'api_base': data.get('api_base', 'https://api.anthropic.com/v1'),
                    'system_prompt': data.get('system_prompt', '你是一个智能编程助手，可以帮助用户完成各种编程任务。')
                })
                config.current_model = model_name
            
            elif action == 'add':
                # 添加新模型
                model_name = data.get('model_name')
                api_key = data.get('api_key')
                if model_name and api_key:
                    config.add_model(
                        model_name,
                        api_key,
                        data.get('api_base', 'https://api.anthropic.com/v1'),
                        data.get('system_prompt', '你是一个智能编程助手，可以帮助用户完成各种编程任务。')
                    )
                    config.current_model = model_name
            
            elif action == 'remove':
                # 删除模型
                model_name = data.get('model_name')
                if model_name:
                    config.remove_model(model_name)
            
            elif action == 'switch':
                # 切换模型
                model_name = data.get('model_name')
                if model_name:
                    config.current_model = model_name
            
            # 重新初始化 LLM 客户端
            from llm_client import llm_client
            llm_client.api_key = config.api_key
            llm_client.api_base = config.api_base
            llm_client.model = config.current_model
            
            return jsonify({'success': True, 'message': '配置保存成功'})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)})


@app.route('/api/chat', methods=['POST'])
def chat():
    """聊天接口"""
    try:
        data = request.json
        message = data.get('message', '').strip()
        settings = data.get('settings', {})
        session_id = data.get('session_id')
        
        if not message:
            return jsonify({'error': '消息不能为空'}), 400
        
        # 检查退出命令
        if message.lower() in ['exit', 'quit', '退出']:
            return jsonify({
                'response': '👋 再见！',
                'is_exit': True
            })
        
        # 获取引擎
        eng = get_engine(session_id)
        
        # 更新引擎配置
        if settings:
            # 如果模型变更，重新创建引擎
            if 'model' in settings and settings['model'] != eng.config.model:
                from config import config as app_config
                app_config.current_model = settings['model']
                eng = get_engine(session_id)  # 重新创建引擎
            else:
                # 更新其他配置
                if 'webSearch' in settings:
                    eng.config.web_search_enabled = settings['webSearch']
                if 'thinkingMode' in settings:
                    eng.config.thinking_mode = settings['thinkingMode']
                if 'detailLevel' in settings:
                    eng.config.detail_level = settings['detailLevel']
                
                # 更新系统提示
                system_msg = next((msg for msg in eng.messages if msg.role == "system"), None)
                if system_msg:
                    system_msg.content = eng._get_default_system_prompt()
        
        response = eng.submit_message(message)
        
        return jsonify({
            'response': response,
            'is_exit': False
        })
    
    except Exception as e:
        import traceback
        print(f"[ERROR] 聊天接口错误: {str(e)}")
        print(f"[ERROR] 错误堆栈:\n{traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/tools', methods=['GET'])
def list_tools():
    """列出所有工具"""
    try:
        eng = get_engine()
        tools = []
        for name, tool in eng.tool_registry.list_tools().items():
            schema = tool.get_schema()
            tools.append({
                'name': name,
                'description': tool.description,
                'schema': schema
            })
        return jsonify({'tools': tools})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/execute', methods=['POST'])
def execute_tool():
    """直接执行工具"""
    try:
        data = request.json
        tool_name = data.get('tool_name')
        params = data.get('params', {})
        
        if not tool_name:
            return jsonify({'error': '工具名称不能为空'}), 400
        
        eng = get_engine()
        result = eng.tool_registry.execute(tool_name, **params)
        
        return jsonify({
            'success': result.success,
            'output': result.output,
            'error': result.error
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/clear', methods=['POST'])
def clear_history():
    """清除对话历史"""
    try:
        global engine
        with engine_lock:
            engine = None
        return jsonify({'message': '对话历史已清除'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/sessions', methods=['GET', 'POST'])
def sessions_api():
    """会话管理 API"""
    try:
        if request.method == 'GET':
            # 获取所有会话
            sessions = db.get_sessions()
            return jsonify({'sessions': sessions})
        elif request.method == 'POST':
            # 创建新会话
            data = request.json
            title = data.get('title', '新会话')
            model = data.get('model', 'deepseek-chat')
            session_id = db.create_session(title, model)
            return jsonify({'success': True, 'session_id': session_id})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/sessions/<int:session_id>', methods=['GET', 'PUT', 'DELETE'])
def session_api(session_id):
    """单个会话 API"""
    try:
        if request.method == 'GET':
            # 获取会话详情
            session = db.get_session(session_id)
            if not session:
                return jsonify({'error': '会话不存在'}), 404
            return jsonify({'session': session})
        elif request.method == 'PUT':
            # 更新会话
            data = request.json
            db.update_session(session_id, **data)
            return jsonify({'success': True})
        elif request.method == 'DELETE':
            # 删除会话
            db.delete_session(session_id)
            # 从 session_engines 中移除
            if session_id in session_engines:
                del session_engines[session_id]
            return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/sessions/<int:session_id>/toggle-pin', methods=['POST'])
def toggle_session_pin(session_id):
    """切换会话置顶状态"""
    try:
        db.toggle_pinned(session_id)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/sessions/<int:session_id>/messages', methods=['GET'])
def session_messages(session_id):
    """获取会话消息"""
    try:
        messages = db.get_messages(session_id)
        return jsonify({'messages': messages})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/history', methods=['GET'])
def get_history():
    """获取对话历史"""
    try:
        eng = get_engine()
        history = []
        for msg in eng.messages[1:]:  # 跳过系统提示
            history.append({
                'role': msg.role,
                'content': msg.content[:200] + '...' if len(msg.content) > 200 else msg.content
            })
        return jsonify({'history': history})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    # 确保模板目录存在
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static', exist_ok=True)
    
    print("""
╔══════════════════════════════════════════════════════════════╗
║              🌐 AI 智能助手 Web 版 v1.0                       ║
║              基于 Claude Code 架构的简化实现                  ║
╚══════════════════════════════════════════════════════════════╝

🚀 Web 服务器已启动！
📱 访问地址: http://localhost:5001
💡 按 Ctrl+C 停止服务器
""")
    
    app.run(host='0.0.0.0', port=5001, debug=True)
