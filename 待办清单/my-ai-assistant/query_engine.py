"""
查询引擎 - 基于 Claude Code 架构的简化实现
处理 LLM API 调用、工具调用循环和会话管理
"""
import json
import os
from typing import List, Dict, Any, Optional, AsyncGenerator
from dataclasses import dataclass, field
from tools import ToolRegistry, create_default_tools
from llm_client import llm_client
from config import config
from database import DatabaseManager


@dataclass
class Message:
    """消息"""
    role: str  # 'user', 'assistant', 'system'
    content: str
    tool_calls: Optional[List[Dict]] = None
    tool_results: Optional[List[Dict]] = None


@dataclass
class QueryEngineConfig:
    """查询引擎配置"""
    api_key: Optional[str] = None
    model: str = "claude-3-sonnet-20240229"
    max_turns: int = 10
    tools: ToolRegistry = field(default_factory=create_default_tools)
    system_prompt: Optional[str] = None
    web_search_enabled: bool = False
    thinking_mode: bool = False
    detail_level: str = "normal"


class QueryEngine:
    """
    查询引擎 - 处理对话和工具调用
    简化版实现，参考 Claude Code 的 QueryEngine.ts
    """
    
    def __init__(self, config: QueryEngineConfig = None, session_id: int = None):
        self.config = config or QueryEngineConfig()
        self.session_id = session_id
        self.messages: List[Message] = []
        self.tool_registry = self.config.tools
        self.db = DatabaseManager()
        
        # 加载会话消息
        if self.session_id:
            self._load_session_messages()
        else:
            # 设置系统提示
            if self.config.system_prompt:
                self.messages.append(Message(role="system", content=self.config.system_prompt))
            else:
                self.messages.append(Message(role="system", content=self._get_default_system_prompt()))
    
    def _load_session_messages(self):
        """加载会话消息"""
        # 从数据库加载消息
        db_messages = self.db.get_messages(self.session_id)
        
        # 首先添加系统提示
        system_prompt = self._get_default_system_prompt()
        self.messages.append(Message(role="system", content=system_prompt))
        
        # 然后添加会话消息
        for msg in db_messages:
            self.messages.append(Message(
                role=msg['role'],
                content=msg['content']
            ))
    
    def _get_default_system_prompt(self) -> str:
        """获取默认系统提示"""
        tools_description = self._get_tools_description()
        
        # 基础系统提示
        base_prompt = """你是一个全能的智能助手，可以帮助用户完成各种任务，包括编程、写作、分析、搜索等。

重要：当用户询问需要联网搜索的内容时，你必须先使用 web_search 工具获取信息，然后再回答。
"""
        
        # 根据详细程度调整提示
        if self.config.detail_level == "brief":
            base_prompt += """请用简洁明了的语言回答，重点突出关键信息。
"""
        elif self.config.detail_level == "detailed":
            base_prompt += """请提供详细的分析和解释，包括背景信息、步骤说明和示例。
"""
        else:  # normal
            base_prompt += """请用清晰、准确的语言回答，提供必要的信息和解释。
"""
        
        # 思考模式
        if self.config.thinking_mode:
            base_prompt += """
【思考模式已启用】
在回答问题之前，请先进行深入的思考：
1. 分析用户的问题和需求
2. 考虑多种可能的解决方案
3. 评估每种方案的优缺点
4. 选择最佳方案并说明理由
5. 在回答中展示你的思考过程

请使用以下格式展示思考过程：
<thinking>
[你的思考过程]
</thinking>

然后给出最终答案。
"""
        
        # 工具使用说明
        tools_prompt = """
你可以使用以下工具来完成任务：

{tools_description}

重要：当你需要使用工具时，必须严格按照以下格式输出：

<tool>
<name>工具名称</name>
<params>
{{
    "参数名": "参数值"
}}
</params>
</tool>

注意事项：
1. 每次只使用一个工具
2. 工具调用必须使用上述 XML 格式
3. 不要在工具调用之外添加其他文字说明
4. 工具名称必须完全匹配上述列表中的名称
5. 参数必须是有效的 JSON 格式
"""

        # 联网搜索说明
        if self.config.web_search_enabled:
            tools_prompt += """
【联网搜索已启用】
当用户询问实时信息、最新新闻、当前事件、天气预报、体育赛事等需要联网的内容时，你必须使用 web_search 工具进行搜索。

重要规则：
1. 如果用户询问的是实时信息（如新闻、天气、体育赛事等），必须先调用 web_search 工具
2. 不要直接回答，必须先调用工具获取信息
3. 工具调用必须使用上述 XML 格式
4. 工具调用后，等待结果返回，再根据结果回答用户

例如：
- 用户问："2026年世界杯在哪里举办？"
- 你必须调用：<tool><name>web_search</name><params>{{"query": "2026年世界杯举办城市"}}</params></tool>

- 用户问："今天天气怎么样？"
- 你必须调用：<tool><name>web_search</name><params>{{"query": "今天天气"}}</params></tool>

- 用户问："最新的科技新闻"
- 你必须调用：<tool><name>web_search</name><params>{{"query": "最新科技新闻"}}</params></tool>
"""
        
        # 重要提示
        important_tips = """
重要提示：
1. 每次只使用一个工具
2. 等待工具执行结果后再决定下一步
3. 如果任务完成，请明确告诉用户结果
4. 如果出错，请分析错误并提供解决方案
5. 根据用户的详细程度要求调整回答的深度
6. 如果启用了思考模式，请展示你的思考过程
"""
        
        return base_prompt + tools_prompt.format(tools_description=tools_description) + important_tips
    
    def _get_tools_description(self) -> str:
        """获取工具描述"""
        descriptions = []
        for name, tool in self.tool_registry.list_tools().items():
            schema = tool.get_schema()
            params = schema.get("properties", {})
            params_desc = "\n".join([
                f"    - {k}: {v.get('description', '')}"
                for k, v in params.items()
            ])
            descriptions.append(f"- {name}: {tool.description}\n  参数:\n{params_desc}")
        return "\n\n".join(descriptions)
    
    def _parse_tool_calls(self, content: str) -> List[Dict]:
        """从助手回复中解析工具调用"""
        import re
        
        tool_calls = []
        pattern = r'<tool>\s*<name>(\w+)</name>\s*<params>(.*?)</params>\s*</tool>'
        
        # 调试：打印原始内容
        print(f"[DEBUG] 解析工具调用，内容: {content[:500]}...")
        
        for match in re.finditer(pattern, content, re.DOTALL):
            tool_name = match.group(1)
            params_str = match.group(2).strip()
            
            # 调试：打印匹配结果
            print(f"[DEBUG] 匹配到工具: {tool_name}, 参数: {params_str}")
            
            try:
                params = json.loads(params_str)
                tool_calls.append({
                    'name': tool_name,
                    'params': params,
                    'raw': match.group(0)
                })
            except json.JSONDecodeError as e:
                print(f"[DEBUG] JSON 解析错误: {e}, 参数字符串: {params_str}")
                continue
        
        print(f"[DEBUG] 解析到 {len(tool_calls)} 个工具调用")
        return tool_calls
    
    def _execute_tool(self, tool_call: Dict) -> Dict:
        """执行工具调用"""
        tool_name = tool_call['name']
        params = tool_call['params']
        
        print(f"[DEBUG] 执行工具: {tool_name}, 参数: {params}")
        
        result = self.tool_registry.execute(tool_name, **params)
        
        print(f"[DEBUG] 工具执行结果: success={result.success}, output={result.output[:100]}...")
        
        return {
            'tool': tool_name,
            'params': params,
            'success': result.success,
            'output': result.output,
            'error': result.error
        }
    
    def submit_message(self, prompt: str) -> str:
        """
        提交用户消息并获取回复
        简化版：直接返回模拟回复（实际应调用 LLM API）
        """
        # 添加用户消息
        self.messages.append(Message(role="user", content=prompt))
        
        # 保存到数据库
        if self.session_id:
            self.db.add_message(self.session_id, "user", prompt)
        
        # 检查是否是工具调用
        if prompt.startswith("/"):
            response = self._handle_command(prompt)
            
            # 保存助手回复到数据库
            if self.session_id:
                self.db.add_message(self.session_id, "assistant", response)
            
            return response
        
        # 模拟助手回复（实际应调用 API）
        # 这里我们根据用户输入生成一个简单的回复
        response = self._generate_response(prompt)
        
        # 解析工具调用
        tool_calls = self._parse_tool_calls(response)
        
        if tool_calls:
            # 执行工具
            tool_results = []
            for tool_call in tool_calls:
                result = self._execute_tool(tool_call)
                tool_results.append(result)
            
            # 添加助手消息
            self.messages.append(Message(
                role="assistant",
                content=response,
                tool_calls=tool_calls
            ))
            
            # 保存助手消息到数据库
            if self.session_id:
                self.db.add_message(self.session_id, "assistant", response)
            
            # 添加工具结果
            results_text = "\n\n".join([
                f"工具: {r['tool']}\n结果: {r['output'] if r['success'] else r['error']}"
                for r in tool_results
            ])
            
            # 生成最终回复
            final_response = self._generate_final_response(prompt, tool_results)
            self.messages.append(Message(role="assistant", content=final_response))
            
            # 保存最终回复到数据库
            if self.session_id:
                self.db.add_message(self.session_id, "assistant", final_response)
            
            return final_response
        else:
            # 普通回复
            self.messages.append(Message(role="assistant", content=response))
            
            # 保存到数据库
            if self.session_id:
                self.db.add_message(self.session_id, "assistant", response)
            
            return response
    
    def _handle_command(self, command: str) -> str:
        """处理斜杠命令"""
        parts = command.split()
        cmd = parts[0].lower()
        args = parts[1:]
        
        if cmd == "/help":
            return self._get_help()
        elif cmd == "/tools":
            return self._get_tools_description()
        elif cmd == "/clear":
            self.messages = [self.messages[0]]  # 保留系统提示
            return "对话历史已清除"
        elif cmd == "/history":
            return self._get_history()
        elif cmd == "/bash" and args:
            result = self.tool_registry.execute("bash", command=" ".join(args))
            return result.output if result.success else result.error
        elif cmd == "/read" and args:
            result = self.tool_registry.execute("file_read", path=args[0])
            return result.output if result.success else result.error
        elif cmd == "/glob" and args:
            result = self.tool_registry.execute("glob", pattern=args[0])
            return result.output if result.success else result.error
        elif cmd == "/grep" and args:
            result = self.tool_registry.execute("grep", pattern=args[0])
            return result.output if result.success else result.error
        else:
            return f"未知命令: {cmd}。使用 /help 查看可用命令。"
    
    def _get_help(self) -> str:
        """获取帮助信息"""
        return """
可用命令：
/help      - 显示帮助信息
/tools     - 显示可用工具
/clear     - 清除对话历史
/history   - 显示对话历史
/bash <cmd> - 执行 shell 命令
/read <path> - 读取文件
/glob <pattern> - 搜索文件
/grep <pattern> - 搜索文件内容

直接输入问题或任务，我会尽力帮助你完成。
"""
    
    def _get_history(self) -> str:
        """获取对话历史"""
        history = []
        for msg in self.messages[1:]:  # 跳过系统提示
            history.append(f"{msg.role}: {msg.content[:100]}...")
        return "\n".join(history) if history else "没有对话历史"
    
    def _generate_response(self, prompt: str) -> str:
        """
        生成回复
        调用 LLM API 获取智能回复
        """
        # 构建消息格式
        api_messages = []
        
        # 添加系统提示
        system_msg = next((msg for msg in self.messages if msg.role == "system"), None)
        if system_msg:
            api_messages.append({
                "role": "system",
                "content": system_msg.content
            })
        
        # 添加历史消息
        for msg in self.messages[1:]:  # 跳过系统提示
            if msg.role == "user":
                api_messages.append({
                    "role": "user",
                    "content": msg.content
                })
            elif msg.role == "assistant":
                api_messages.append({
                    "role": "assistant",
                    "content": msg.content
                })
        
        # 添加当前用户消息
        api_messages.append({
            "role": "user",
            "content": prompt
        })
        
        # 获取工具 schema
        tools = llm_client.get_tools_schema(self.tool_registry.list_tools())
        
        # 调用 LLM API
        response = llm_client.complete(api_messages, tools)
        
        # 如果没有配置 API 密钥，返回提示
        if "请先配置 API 密钥" in response:
            return response
        
        return response
    
    def _generate_final_response(self, original_prompt: str, tool_results: List[Dict]) -> str:
        """生成最终回复"""
        success_count = sum(1 for r in tool_results if r['success'])
        total_count = len(tool_results)
        
        if success_count == total_count:
            # 构建工具结果信息
            results_info = []
            for r in tool_results:
                if r['success']:
                    results_info.append(f"工具: {r['tool']}\n结果: {r['output']}")
            
            # 将工具结果添加到消息历史
            results_text = "\n\n".join(results_info)
            self.messages.append(Message(role="assistant", content=f"<tool_results>\n{results_text}\n</tool_results>"))
            
            # 再次调用 LLM 生成最终回复
            final_prompt = f"根据以下工具执行结果，回答用户的问题：{original_prompt}\n\n工具执行结果：\n{results_text}"
            
            # 构建消息格式
            api_messages = []
            system_msg = next((msg for msg in self.messages if msg.role == "system"), None)
            if system_msg:
                api_messages.append({
                    "role": "system",
                    "content": system_msg.content
                })
            
            # 添加历史消息（不包括工具结果）
            for msg in self.messages[1:]:
                if msg.role in ["user", "assistant"] and "<tool_results>" not in msg.content:
                    api_messages.append({
                        "role": msg.role,
                        "content": msg.content
                    })
            
            # 添加最终提示
            api_messages.append({
                "role": "user",
                "content": final_prompt
            })
            
            # 调用 LLM API
            response = llm_client.complete(api_messages, None)
            
            return response
        else:
            return f"操作部分完成。\n\n成功: {success_count}/{total_count}\n有些操作可能失败了，请检查错误信息。"


# 模拟 LLM API 调用（实际项目中应使用真实的 API）
class MockLLMClient:
    """模拟 LLM 客户端"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key
    
    def complete(self, messages: List[Message], tools: List[Dict] = None) -> str:
        """模拟完成请求"""
        # 这里应该调用真实的 API
        # 简化版：返回一个工具调用示例
        return "<tool>\n<name>bash</name>\n<params>\n{\n    \"command\": \"ls -la\"\n}\n</params>\n</tool>"
