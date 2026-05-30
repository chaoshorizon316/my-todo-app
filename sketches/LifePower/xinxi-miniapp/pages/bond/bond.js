const api = require('../../utils/api')
Page({
  data: { bonds: [], ready: false },
  onLoad() {
    const app = getApp()
    if (app.globalData.loggedIn) {
      this.setData({ ready: true })
      this.loadBonds()
    } else {
      app.loginReadyCallback = () => {
        if (!this.data.ready) {
          this.setData({ ready: true })
          this.loadBonds()
        }
      }
    }
  },
  onShow() { if (this.data.ready) this.loadBonds() },
  loadBonds() {
    api.getBonds().then(data => this.setData({ bonds: data })).catch(err => console.error('加载羁绊失败', err))
  },
  onAdd() {
    wx.showModal({
      title: '添加羁绊',
      editable: true,
      placeholderText: '名字',
      success: res => {
        if (res.confirm && res.content) {
          api.addBond({ name: res.content, relation: '朋友', type: '相伴', silent: false })
            .then(() => this.loadBonds())
        }
      }
    })
  }
})