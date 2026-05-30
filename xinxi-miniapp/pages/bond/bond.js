Page({
  data: {
    userName: '小守',
    activeTab: 'mutual',
    bonds: [],
    mutualBonds: [],
    quietBonds: []
  },

  onLoad() {
    // onShareAppMessage 必须在 Page 层定义
  },

  onShow() {
    this.getTabBar && this.getTabBar().setData({ selected: 3 })
    getApp().ensureLogin().then(() => this.loadData()).catch(() => {})
  },

  // 微信分享配置
  onShareAppMessage() {
    const app = getApp()
    const userId = (app.globalData.user && app.globalData.user.id) || ''
    const nickname = (app.globalData.user && app.globalData.user.nickname) || '守望者'
    return {
      title: `${nickname} 邀请你加入心汐 · 守望彼此`,
      path: `/pages/lake/lake?fromUserId=${userId}`,
      imageUrl: '' // 可设置分享卡片封面图
    }
  },

  onShareTimeline() {
    return {
      title: '心汐 · 投一颗石子，看湖面涟漪',
      query: ''
    }
  },

  async loadData() {
    var that = this
    const app = getApp()
    if (app.globalData.user) {
      const u = app.globalData.user
      that.setData({ userName: u.nickname || '小守' })
    }
    try {
      const bonds = await app.request({ url: '/api/bonds' })
      that.setData({
        bonds,
        mutualBonds: bonds.filter(b => !b.silent && b.bondUserId),
        quietBonds: bonds.filter(b => b.silent || !b.bondUserId)
      })
    } catch (e) {
      console.error('加载羁绊失败', e)
    }
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab })
  },

  sendEcho(e) {
    const { id, name } = e.currentTarget.dataset
    wx.showModal({
      title: `向 ${name} 发送回响`,
      editable: true,
      placeholderText: '想说的话...',
      success: async res => {
        if (!res.confirm || !res.content) return
        const app = getApp()
        try {
          // 通过 bond 里的 bondUserId 发送消息
          const bond = this.data.bonds.find(b => b.id === id)
          if (!bond || !bond.bondUserId) {
            wx.showToast({ title: '无法发送', icon: 'none' })
            return
          }
          await app.request({
            url: '/api/messages',
            method: 'POST',
            data: { toUserId: bond.bondUserId, text: res.content }
          })
          wx.showToast({ title: '回响已发出', icon: 'success' })
        } catch (e) {
          wx.showToast({ title: '发送失败', icon: 'none' })
        }
      }
    })
  }
})
