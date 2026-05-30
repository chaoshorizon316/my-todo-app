const api = require('../../utils/api')
Page({
  data: { moods: [], ready: false },
  onLoad() {
    const app = getApp()
    if (app.globalData.loggedIn) {
      this.setData({ ready: true })
      this.loadMoods()
    } else {
      app.loginReadyCallback = () => {
        if (!this.data.ready) {
          this.setData({ ready: true })
          this.loadMoods()
        }
      }
    }
  },
  onShow() { if (this.data.ready) this.loadMoods() },
  loadMoods() {
    api.getMoods().then(data => {
      const moods = data.map(m => ({
        ...m,
        time: m.createdAt ? m.createdAt.slice(5, 16) : '',
      }))
      this.setData({ moods })
    }).catch(err => console.error('加载心情失败', err))
  }
})