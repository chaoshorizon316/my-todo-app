"""
配置文件 - 支持多模型密钥管理
"""
import os
import json
from typing import Optional, Dict, Any, List

class Config:
    """配置类"""
    
    def __init__(self):
        self.config_file = "config.json"
        self._config = self._load_config()
    
    def _load_config(self) -> Dict[str, Any]:
        """加载配置"""
        if os.path.exists(self.config_file):
            with open(self.config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {
            "current_model": "claude-3-sonnet-20240229",
            "models": {
                "claude-3-sonnet-20240229": {
                    "api_key": "",
                    "api_base": "https://api.anthropic.com/v1",
                    "system_prompt": "你是一个智能编程助手，可以帮助用户完成各种编程任务。"
                }
            }
        }
    
    def save(self):
        """保存配置"""
        with open(self.config_file, 'w', encoding='utf-8') as f:
            json.dump(self._config, f, indent=2)
    
    @property
    def current_model(self) -> str:
        """当前模型"""
        return self._config.get("current_model", "claude-3-sonnet-20240229")
    
    @current_model.setter
    def current_model(self, value: str):
        """设置当前模型"""
        self._config["current_model"] = value
        self.save()
    
    @property
    def models(self) -> Dict[str, Dict[str, Any]]:
        """所有模型配置"""
        return self._config.get("models", {})
    
    def get_model_config(self, model_name: str) -> Dict[str, Any]:
        """获取指定模型的配置"""
        return self.models.get(model_name, {
            "api_key": "",
            "api_base": "https://api.anthropic.com/v1",
            "system_prompt": "你是一个智能编程助手，可以帮助用户完成各种编程任务。"
        })
    
    def set_model_config(self, model_name: str, config: Dict[str, Any]):
        """设置指定模型的配置"""
        if "models" not in self._config:
            self._config["models"] = {}
        self._config["models"][model_name] = config
        self.save()
    
    def add_model(self, model_name: str, api_key: str, api_base: str = "https://api.anthropic.com/v1", system_prompt: str = "你是一个智能编程助手，可以帮助用户完成各种编程任务。"):
        """添加模型"""
        self.set_model_config(model_name, {
            "api_key": api_key,
            "api_base": api_base,
            "system_prompt": system_prompt
        })
    
    def remove_model(self, model_name: str):
        """删除模型"""
        if model_name in self.models:
            del self._config["models"][model_name]
            # 如果删除的是当前模型，切换到第一个可用模型
            if self.current_model == model_name and self.models:
                self.current_model = next(iter(self.models.keys()))
            self.save()
    
    @property
    def api_key(self) -> Optional[str]:
        """当前模型的 API 密钥"""
        return self.get_model_config(self.current_model).get("api_key")
    
    @property
    def api_base(self) -> str:
        """当前模型的 API 基础 URL"""
        return self.get_model_config(self.current_model).get("api_base", "https://api.anthropic.com/v1")
    
    @property
    def system_prompt(self) -> str:
        """当前模型的系统提示"""
        return self.get_model_config(self.current_model).get("system_prompt", "你是一个智能编程助手，可以帮助用户完成各种编程任务。")

# 全局配置实例
config = Config()
