// 心汐 · 微信云托管 callContainer 架构
App({
  globalData: {
    token: '',
    user: null,
    loggedIn: false,
    loginCallbacks: [],
    cloudEnv: 'prod-d4gkxxsyj1dd985c8',
    serviceName: 'express-cd9z',
    shareFromUserId: null
  },

  onLaunch(options) {
    try {
      wx.cloud.init({
        env: this.globalData.cloudEnv,
        traceUser: true
      })
    } catch (e) {
      console.error('云开发初始化失败', e)
    }

    const token = wx.getStorageSync('token')
    const user = wx.getStorageSync('user')
    if (token) {
      this.globalData.token = token
      this.globalData.user = user
      this.globalData.loggedIn = true
    }

    // 检测分享入口：从好友分享的小程序卡片进入
    if (options.query && options.query.fromUserId) {
      this.globalData.shareFromUserId = options.query.fromUserId
    }
    // 也检查 scene（扫码/分享场景值）
    if (options.scene) {
      const scene = decodeURIComponent(options.scene)
      if (scene.startsWith('from=')) {
        this.globalData.shareFromUserId = scene.slice(5)
      }
    }
  },

  // 处理分享羁绊（在确保登录后调用）
  async handleShareBond() {
    const fromUserId = this.globalData.shareFromUserId
    if (!fromUserId) return
    this.globalData.shareFromUserId = null // 只处理一次
    try {
      const result = await this.request({
        url: '/api/bonds/share',
        method: 'POST',
        data: { fromUserId }
      })
      if (result.linked) {
        wx.showToast({ title: '羁绊已建立', icon: 'success' })
      }
    } catch (e) {
      console.error('分享羁绊建立失败', e)
    }
  },

  login(cb) {
    if (this.globalData.loggedIn && this.globalData.token) {
      cb && cb(null, this.globalData.user)
      return
    }
    if (this.globalData.loginCallbacks.length > 0) {
      this.globalData.loginCallbacks.push(cb)
      return
    }
    this.globalData.loginCallbacks.push(cb)

    wx.login({
      success: res => {
        this.callContainer({
          url: '/api/login',
          method: 'POST',
          data: { code: res.code }
        }).then(r => {
          if (r.token) {
            this.globalData.token = r.token
            this.globalData.user = r.user
            this.globalData.loggedIn = true
            wx.setStorageSync('token', r.token)
            wx.setStorageSync('user', r.user)
          }
          const cbs = this.globalData.loginCallbacks
          this.globalData.loginCallbacks = []
          cbs.forEach(fn => fn && fn(null, r))
          // 登录成功后处理分享羁绊
          this.handleShareBond()
        }).catch(err => {
          const cbs = this.globalData.loginCallbacks
          this.globalData.loginCallbacks = []
          cbs.forEach(fn => fn && fn(err))
        })
      },
      fail: () => {
        const cbs = this.globalData.loginCallbacks
        this.globalData.loginCallbacks = []
        cbs.forEach(fn => fn && fn('微信登录失败'))
      }
    })
  },

  ensureLogin() {
    if (this.globalData.loggedIn && this.globalData.token) {
      return Promise.resolve()
    }
    return new Promise((resolve, reject) => {
      this.login((err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  },

  callContainer(options, retries) {
    var maxRetries = (typeof retries === 'number') ? retries : 4
    var self = this

    function tryCall(resolve, reject, attempt) {
      var header = {}
      if (self.globalData.token) {
        header['Authorization'] = 'Bearer ' + self.globalData.token
      }
      if (options.header) {
        Object.assign(header, options.header)
      }

      wx.cloud.callContainer({
        config: { env: self.globalData.cloudEnv },
        path: options.url,
        header: Object.assign({ 'X-WX-SERVICE': self.globalData.serviceName }, header),
        method: options.method || 'GET',
        data: options.data || {},
        success: function(res) {
          var sc = res.statusCode || 200
          if (sc >= 200 && sc < 300) {
            resolve(res.data)
          } else if (sc === 401) {
            self.globalData.loggedIn = false
            self.globalData.token = ''
            self.login(function(err) {
              if (err) return reject(err)
              header['Authorization'] = 'Bearer ' + self.globalData.token
              wx.cloud.callContainer({
                config: { env: self.globalData.cloudEnv },
                path: options.url,
                header: Object.assign({ 'X-WX-SERVICE': self.globalData.serviceName }, header),
                method: options.method || 'GET',
                data: options.data || {},
                success: function(r2) {
                  if (r2.statusCode >= 200 && r2.statusCode < 300) resolve(r2.data)
                  else reject(r2.data)
                },
                fail: reject
              })
            })
          } else {
            reject(res.data)
          }
        },
        fail: function(err) {
          console.warn('callContainer failed, attempt ' + (attempt + 1) + '/' + (maxRetries + 1), err)
          if (attempt < maxRetries) {
            setTimeout(function() { tryCall(resolve, reject, attempt + 1) }, 4000)
          } else {
            reject(err)
          }
        }
      })
    }

    return new Promise(function(resolve, reject) {
      tryCall(resolve, reject, 0)
    })
  },

  request(options) {
    return this.callContainer(options)
  }
})
