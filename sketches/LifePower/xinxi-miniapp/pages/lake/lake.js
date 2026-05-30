const api = require('../../utils/api')

Page({
  data: {
    insight: '投石入湖，静待涟漪……',
    unreadCount: 0,
    ready: false
  },

  onLoad() {
    const app = getApp()
    // 等登录完成再加载数据
    if (app.globalData.loggedIn) {
      this.setData({ ready: true })
      this.loadLakeState()
    } else {
      // 注册回调，登录完成后触发
      app.loginReadyCallback = () => {
        this.setData({ ready: true })
        this.loadLakeState()
      }
    }
  },

  onShow() {
    if (this.data.ready) {
      this.loadLakeState()
    }
  },

  loadLakeState() {
    api.getLakeState().then(res => {
      this.setData({ 
        insight: res.insight,
        unreadCount: 0
      })
    }).catch(err => {
      console.error('加载湖面状态失败', err)
    })
  },

  onRecord() {
    wx.showActionSheet({
      itemList: ['平静如水', '微风涟漪', '波澜起伏', '细浪轻拍'],
      success: res => {
        const moods = ['平静', '微风', '波澜', '细浪']
        const lakeStates = ['mirror', 'breeze', 'ripples', 'wave']
        const mood = moods[res.tapIndex]
        const lakeState = lakeStates[res.tapIndex]
        
        api.postMood(mood, lakeState, '').then(() => {
          wx.showToast({ title: '已记录', icon: 'success' })
          this.loadLakeState()
        }).catch(err => {
          wx.showToast({ title: '记录失败', icon: 'error' })
        })
      }
    })
  }
})