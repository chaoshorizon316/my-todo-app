// 心汐 API · 云托管 callContainer 版
// 使用微信云托管原生调用，无需域名白名单

const CLOUD_ENV = 'prod-d4gkxxsyj1dd985c8'
const SERVICE = 'express-cd9z'
let token = ''

function call(method, path, data) {
  const header = {}
  if (token) header['Authorization'] = 'Bearer ' + token
  header['X-WX-SERVICE'] = SERVICE

  return new Promise((resolve, reject) => {
    wx.cloud.callContainer({
      config: { env: CLOUD_ENV },
      path: path,
      header: header,
      method: method,
      data: data,
      success: res => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(res.data)
        }
      },
      fail: reject
    })
  })
}

// 登录
function login(wxCode) {
  return call('POST', '/api/login', { code: wxCode, nickname: '', avatar: '' })
    .then(data => { token = data.token; return data })
}

// 用户
function getUser() { return call('GET', '/api/user/me') }
function updateUser(data) { return call('PUT', '/api/user/me', data) }

// 心情
function postMood(mood, lakeState, note) { return call('POST', '/api/moods', { mood, lakeState, note }) }
function getMoods(limit, offset) { return call('GET', '/api/moods?limit=' + (limit || 20) + '&offset=' + (offset || 0)) }
function getLakeState() { return call('GET', '/api/lake-state') }

// 羁绊
function getBonds() { return call('GET', '/api/bonds') }
function addBond(data) { return call('POST', '/api/bonds', data) }
function removeBond(id) { return call('DELETE', '/api/bonds/' + id) }

// 回响
function getMessages() { return call('GET', '/api/messages') }
function sendMessage(toUserId, text) { return call('POST', '/api/messages', { toUserId, text }) }
function acceptMessage(id) { return call('PUT', '/api/messages/' + id + '/accept') }
function rejectMessage(id) { return call('PUT', '/api/messages/' + id + '/reject') }

// 健康
function health() { return call('GET', '/api/health') }

module.exports = {
  login, getUser, updateUser,
  postMood, getMoods, getLakeState,
  getBonds, addBond, removeBond,
  getMessages, sendMessage, acceptMessage, rejectMessage,
  health
}
