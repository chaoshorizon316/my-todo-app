"""
LLM 客户端
支持接入多种大模型 API
"""
import json
import httpx
from typing import List, Dict, Any, Optional, AsyncGenerator
from config import config


class LLMClient:
    """LLM 客户端"""
    
    def __init__(self):
        """初始化 LLM 客户端"""
        self.api_key = config.api_key
        self.api_base = config.api_base
        self.model = config.current_model
    
    def is_configured(self) -> bool:
        """检查是否配置了 API 密钥"""
        return bool(self.api_key)
    
    def complete(self, messages: List[Dict[str, Any]], tools: List[Dict[str, Any]] = None) -> str:
        """完成请求"""
        if not self.is_configured():
            return "⚠️  请先配置 API 密钥"
        
        # 根据模型类型选择 API 配置
        if self.model.startswith("claude"):
            return self._complete_claude(messages, tools)
        elif self.model.startswith("gpt"):
            return self._complete_openai(messages, tools)
        elif self.model.startswith("gemini"):
            return self._complete_gemini(messages, tools)
        elif self.model.startswith("deepseek"):
            return self._complete_openai(messages, tools)  # DeepSeek API 与 OpenAI 兼容
        else:
            return "⚠️  不支持的模型类型"
    
    def _complete_claude(self, messages: List[Dict[str, Any]], tools: List[Dict[str, Any]] = None) -> str:
        """使用 Claude API 完成请求"""
        headers = {
            "Content-Type": "application/json",
            "X-API-Key": self.api_key
        }
        
        data = {
            "model": self.model,
            "messages": messages,
            "max_tokens": 1024,
            "temperature": 0.7
        }
        
        if tools:
            data["tools"] = tools
        
        try:
            response = httpx.post(
                f"{self.api_base}/messages",
                headers=headers,
                json=data,
                timeout=60.0  # 增加超时到60秒
            )
            
            response.raise_for_status()
            result = response.json()
            
            if "content" in result:
                content = []
                for item in result["content"]:
                    if item["type"] == "text":
                        content.append(item["text"])
                    elif item["type"] == "tool_use":
                        content.append(self._format_tool_use(item))
                return "\n".join(content)
            
            return "⚠️  模型返回了空结果"
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                return "⚠️  API 密钥无效，请检查配置"
            elif e.response.status_code == 429:
                return "⚠️  API 速率限制，请稍后再试"
            return f"⚠️  API 错误: {e.response.text}"
        except Exception as e:
            return f"⚠️  网络错误: {str(e)}"
    
    def _complete_openai(self, messages: List[Dict[str, Any]], tools: List[Dict[str, Any]] = None) -> str:
        """使用 OpenAI API 完成请求"""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        data = {
            "model": self.model,
            "messages": messages,
            "max_tokens": 1024,
            "temperature": 0.7
        }
        
        # 如果有工具，添加到请求中（使用 function calling）
        if tools:
            data["functions"] = tools
            data["function_call"] = "auto"  # 让模型自动决定是否调用函数
        
        try:
            response = httpx.post(
                f"{self.api_base}/chat/completions",
                headers=headers,
                json=data,
                timeout=60.0  # 增加超时到60秒
            )
            
            response.raise_for_status()
            result = response.json()
            
            if "choices" in result and result["choices"]:
                choice = result["choices"][0]
                if "message" in choice:
                    message = choice["message"]
                    
                    # 检查是否有函数调用
                    if "function_call" in message:
                        function_call = message["function_call"]
                        tool_name = function_call.get("name", "unknown")
                        arguments_str = function_call.get("arguments", "{}")
                        
                        try:
                            arguments = json.loads(arguments_str)
                        except:
                            arguments = {}
                        
                        # 转换为 XML 格式
                        return f"<tool>\n<name>{tool_name}</name>\n<params>\n{json.dumps(arguments, indent=2)}<\/params>\n<\/tool>"
                    
                    # 检查是否有 tool_calls（新版本的 API）
                    elif "tool_calls" in message:
                        content = []
                        for tool_call in message["tool_calls"]:
                            content.append(self._format_openai_tool_call(tool_call))
                        return "\n".join(content)
                    
                    # 普通文本回复
                    elif "content" in message:
                        return message["content"]
            
            return "⚠️  模型返回了空结果"
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                return "⚠️  API 密钥无效，请检查配置"
            elif e.response.status_code == 429:
                return "⚠️  API 速率限制，请稍后再试"
            return f"⚠️  API 错误: {e.response.text}"
        except Exception as e:
            return f"⚠️  网络错误: {str(e)}"
    
    def _complete_gemini(self, messages: List[Dict[str, Any]], tools: List[Dict[str, Any]] = None) -> str:
        """使用 Gemini API 完成请求"""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        # 转换消息格式为 Gemini 格式
        gemini_messages = []
        for msg in messages:
            if msg["role"] == "system":
                gemini_messages.append({
                    "role": "user",
                    "parts": [{"text": msg["content"]}]
                })
            else:
                gemini_messages.append({
                    "role": msg["role"],
                    "parts": [{"text": msg["content"]}]
                })
        
        data = {
            "model": self.model,
            "contents": gemini_messages,
            "generationConfig": {
                "maxOutputTokens": 1024,
                "temperature": 0.7
            }
        }
        
        try:
            response = httpx.post(
                f"{self.api_base}/models/{self.model}:generateContent",
                headers=headers,
                json=data,
                timeout=30.0
            )
            
            response.raise_for_status()
            result = response.json()
            
            if "candidates" in result and result["candidates"]:
                candidate = result["candidates"][0]
                if "content" in candidate and "parts" in candidate["content"]:
                    parts = candidate["content"]["parts"]
                    content = []
                    for part in parts:
                        if "text" in part:
                            content.append(part["text"])
                    return "\n".join(content)
            
            return "⚠️  模型返回了空结果"
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                return "⚠️  API 密钥无效，请检查配置"
            elif e.response.status_code == 429:
                return "⚠️  API 速率限制，请稍后再试"
            return f"⚠️  API 错误: {e.response.text}"
        except Exception as e:
            return f"⚠️  网络错误: {str(e)}"
    
    def _format_tool_use(self, tool_use: Dict[str, Any]) -> str:
        """格式化 Claude 工具调用"""
        tool_name = tool_use.get("name", "unknown")
        input_data = tool_use.get("input", {})
        
        return f"<tool>\n<name>{tool_name}</name>\n<params>\n{json.dumps(input_data, indent=2)}<\/params>\n<\/tool>"
    
    def _format_openai_tool_call(self, tool_call: Dict[str, Any]) -> str:
        """格式化 OpenAI 工具调用"""
        tool_name = tool_call.get("function", {}).get("name", "unknown")
        input_data = tool_call.get("function", {}).get("arguments", "{}")
        
        try:
            input_json = json.loads(input_data)
        except:
            input_json = {}
        
        return f"<tool>\n<name>{tool_name}</name>\n<params>\n{json.dumps(input_json, indent=2)}<\/params>\n<\/tool>"
    
    def get_tools_schema(self, tools: Dict[str, Any]) -> List[Dict[str, Any]]:
        """获取工具 schema"""
        schema = []
        for name, tool in tools.items():
            tool_schema = {
                "type": "function",
                "function": {
                    "name": name,
                    "description": tool.description,
                    "parameters": tool.get_schema()
                }
            }
            schema.append(tool_schema)
        return schema


# 全局 LLM 客户端实例
llm_client = LLMClient()
