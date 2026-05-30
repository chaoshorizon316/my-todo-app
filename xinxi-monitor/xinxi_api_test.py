#!/usr/bin/env python3
"""心汐 API 全链路测试 — 8 接口 · 云托管生产版"""

import urllib.request, urllib.error, json, sys, os, time

BASE = "https://express-cd9z-258058-4-1433329054.sh.run.tcloudbase.com"
TOKEN_FILE = "/tmp/xinxi_token.json"
OK, FAIL, ERR = 0, 0, []

def request(method, path, body=None, headers=None, expect_status=200, retries=3, timeout=30):
    global OK, FAIL
    url = f"{BASE}{path}"
    data = json.dumps(body).encode() if body else None
    hdrs = {"Content-Type": "application/json"}
    if headers:
        hdrs.update(headers)
    last_err = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                status = resp.getcode()
                res_body = resp.read().decode()
            if status == expect_status:
                OK += 1
                return json.loads(res_body) if res_body else {}
            else:
                last_err = f"HTTP {status} (expected {expect_status})"
                if attempt < retries - 1:
                    time.sleep(5)
                    continue
                FAIL += 1
                ERR.append(f"  {method} {path}: {last_err}")
                return None
        except urllib.error.HTTPError as e:
            body_text = e.read().decode()[:200]
            if e.code == expect_status:
                OK += 1
                return json.loads(body_text) if body_text else {}
            last_err = f"HTTP {e.code}: {body_text}"
            if attempt < retries - 1:
                time.sleep(5)
                continue
            FAIL += 1
            ERR.append(f"  {method} {path}: {last_err}")
            return None
        except Exception as e:
            last_err = str(e)
            if attempt < retries - 1:
                time.sleep(5)
                continue
            FAIL += 1
            ERR.append(f"  {method} {path}: {last_err}")
            return None
    return None

# 标记已测试通过（用于判断空数组 vs 失败）
def ok_or_fail(result, label):
    if result is None:
        print(f"  ❌ {label}")
    else:
        print(f"  ✅ {label}")

def cached_token():
    if os.path.exists(TOKEN_FILE):
        try:
            with open(TOKEN_FILE) as f:
                data = json.load(f)
                if data.get("token"):
                    return data["token"]
        except:
            pass
    return None

def save_token(token, uid):
    with open(TOKEN_FILE, "w") as f:
        json.dump({"token": token, "uid": uid, "time": time.time()}, f)

print("=" * 50)
print("  心汐 API 全链路测试 (8 接口)")
print(f"  {BASE}")
print("=" * 50)

# 1. 健康检查
print("\n[1/8] GET /api/health ...")
r = request("GET", "/api/health")
ok_or_fail(r, "服务在线")

# 2. 登录（带缓存）
print("\n[2/8] POST /api/login ...")
token = cached_token()
if token:
    print("  ✅ Token 缓存命中")
    OK += 1
else:
    r = request("POST", "/api/login", {"code": "monitor-test-001", "nickname": "监控探头", "avatar": ""})
    token = r.get("token") if r else None
    uid = r.get("user", {}).get("id") if r else None
    if token and uid:
        save_token(token, uid)
    ok_or_fail(token, "获取 token")

# 3. 获取用户信息
print("\n[3/8] GET /api/user/me ...")
r = request("GET", "/api/user/me", headers={"Authorization": f"Bearer {token}"} if token else None)
ok_or_fail(r, f"nickname={r.get('nickname') if r else 'N/A'}")

# 4. 湖面状态
print("\n[4/8] GET /api/lake-state ...")
r = request("GET", "/api/lake-state", headers={"Authorization": f"Bearer {token}"} if token else None)
ok_or_fail(r, f"state={r.get('state') if r else 'N/A'}")

# 5. 心情列表
print("\n[5/8] GET /api/moods ...")
r = request("GET", "/api/moods?limit=5", headers={"Authorization": f"Bearer {token}"} if token else None)
cnt = len(r) if isinstance(r, list) else "N/A"
ok_or_fail(r, f"{cnt} 条记录")

# 6. 羁绊列表
print("\n[6/8] GET /api/bonds ...")
r = request("GET", "/api/bonds", headers={"Authorization": f"Bearer {token}"} if token else None)
cnt = len(r) if isinstance(r, list) else "N/A"
ok_or_fail(r, f"{cnt} 条羁绊")

# 7. 消息列表
print("\n[7/8] GET /api/messages ...")
r = request("GET", "/api/messages", headers={"Authorization": f"Bearer {token}"} if token else None)
cnt = len(r) if isinstance(r, list) else "N/A"
ok_or_fail(r, f"{cnt} 条消息")

# 8. 写入心情
print("\n[8/8] POST /api/moods ...")
r = request("POST", "/api/moods",
    {"mood": "平静", "lakeState": "mirror", "note": "监控自动测试"},
    headers={"Authorization": f"Bearer {token}"} if token else None)
ok_or_fail(r, f"mood={r.get('mood') if r else 'N/A'}")

total = OK + FAIL
print("\n" + "=" * 50)
if FAIL == 0:
    print(f"  ✅ 心汐 API 全通 ({OK}/{total})")
else:
    print(f"  🔴 需要关注 — {FAIL}/{total} 失败")
    for e in ERR:
        print(e)
print("=" * 50)
sys.exit(0 if FAIL == 0 else 1)
