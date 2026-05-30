// 心汐 API 配置
const BASE_URL = 'https://express-cd9z-258058-4-1433329054.sh.run.tcloudbase.com'

// 认证 token 缓存
let token = ''
let userId = ''

// ============================================================
// 通用请求
// ============================================================
function request(method, path, data) {
  const header = { 'Content-Type': 'application/json' }
  if (token) header['Authorization'] = `Bearer ${token}`

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${path}`,
      method,
      header,
      data,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(res.data)
        }
      },
      fail(err) {
        reject(err)
      }
    })
  })
}

// ============================================================
// 登录
// ============================================================
function login(wxCode) {
  return request('POST', '/api/login', {
    code: wxCode,
    nickname: '',
    avatar: ''
  }).then(data => {
    token = data.token
    userId = data.user.id
    return data
  })
}

// ============================================================
// 用户
// ============================================================
function getUser() {
  return request('GET', '/api/user/me')
}

function updateUser(data) {
  return request('PUT', '/api/user/me', data)
}

// ============================================================
// 心情
// ============================================================
function postMood(mood, lakeState, note) {
  return request('POST', '/api/moods', { mood, lakeState, note })
}

function getMoods(limit = 20, offset = 0) {
  return request('GET', `/api/moods?limit=${limit}&offset=${offset}`)
}

function getLakeState() {
  return request('GET', '/api/lake-state')
}

// ============================================================
// 羁绊
// ============================================================
function getBonds() {
  return request('GET', '/api/bonds')
}

function addBond(data) {
  return request('POST', '/api/bonds', data)
}

function removeBond(id) {
  return request('DELETE', `/api/bonds/${id}`)
}

// ============================================================
// 回响消息
// ============================================================
function getMessages() {
  return request('GET', '/api/messages')
}

function sendMessage(toUserId, text) {
  return request('POST', '/api/messages', { toUserId, text })
}

function acceptMessage(id) {
  return request('PUT', `/api/messages/${id}/accept`)
}

function rejectMessage(id) {
  return request('PUT', `/api/messages/${id}/reject`)
}

// ============================================================
// 健康检查
// ============================================================
function health() {
  return request('GET', '/api/health')
}

module.exports = {
  login, getUser, updateUser,
  postMood, getMoods, getLakeState,
  getBonds, addBond, removeBond,
  getMessages, sendMessage, acceptMessage, rejectMessage,
  health
}
