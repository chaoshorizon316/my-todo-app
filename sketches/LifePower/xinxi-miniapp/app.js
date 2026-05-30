const api = require('./utils/api')

App({
  onLaunch() {
    wx.login({
      success: res => {
        if (res.code) {
          api.login(res.code).then(data => {
            this.globalData.user = data.user
            this.globalData.loggedIn = true

            if (this.loginReadyCallback) {
              this.loginReadyCallback()
            }
          }).catch(err => {
            console.error('登录失败', JSON.stringify(err))
            // 降级：标记已登录（开发模式跳过）
            this.globalData.loggedIn = true
            if (this.loginReadyCallback) {
              this.loginReadyCallback()
            }
          })
        } else {
          console.error('wx.login 失败: 无code')
        }
      },
      fail: err => {
        console.error('wx.login 调用失败', err)
      }
    })
  },

  globalData: {
    loggedIn: false,
    user: null
  }
})
