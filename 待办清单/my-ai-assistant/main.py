#!/usr/bin/env python3
"""
智能助手 - 基于 Claude Code 架构的简化实现
主入口文件
"""
import sys
import os
from query_engine import QueryEngine, QueryEngineConfig


def print_banner():
    """打印欢迎信息"""
    print("""
╔══════════════════════════════════════════════════════════════╗
║                    🚀 AI 智能助手 v1.0                       ║
║              基于 Claude Code 架构的简化实现                  ║
╚══════════════════════════════════════════════════════════════╝

输入 /help 查看可用命令，或直接输入你的问题。
输入 exit 或 quit 退出。
""")


def main():
    """主函数"""
    print_banner()
    
    # 初始化查询引擎
    config = QueryEngineConfig()
    engine = QueryEngine(config)
    
    print("✅ 助手已启动，工具已加载：")
    for name, tool in engine.tool_registry.list_tools().items():
        print(f"   • {name}: {tool.description}")
    print()
    
    # 主循环
    while True:
        try:
            # 获取用户输入
            user_input = input("\n📝 > ").strip()
            
            if not user_input:
                continue
            
            # 检查退出命令
            if user_input.lower() in ['exit', 'quit', '退出']:
                print("\n👋 再见！")
                break
            
            # 提交消息并获取回复
            response = engine.submit_message(user_input)
            
            # 显示回复
            print(f"\n🤖 {response}")
            
        except KeyboardInterrupt:
            print("\n\n使用 exit 或 quit 退出程序")
            continue
        except EOFError:
            print("\n👋 再见！")
            break
        except Exception as e:
            print(f"\n❌ 错误: {e}")


if __name__ == "__main__":
    main()
