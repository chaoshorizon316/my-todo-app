Page({
  data: { messages: [] },
  onShow() {
    this.getTabBar && this.getTabBar().setData({ selected: 2 })
    getApp().ensureLogin().then(() => this.loadMessages()).catch(() => {})
  },
  async loadMessages() {
    var that = this
    const app = getApp()
    try {
      const data = await app.request({ url: '/api/messages' })
      if (!Array.isArray(data)) return
      that.setData({ messages: data.map(m => ({ ...m, timeStr: that._fmt(m.createdAt) })) })
    } catch (e) { console.error('加载失败', e) }
  },
  async accept(e) {
    var that = this
    const app = getApp()
    try {
      await app.request({ url: '/api/messages/' + e.currentTarget.dataset.id + '/accept', method: 'PUT' })
      wx.showToast({ title: '已接纳', icon: 'success' })
      that.loadMessages()
    } catch (err) { wx.showToast({ title: '操作失败', icon: 'none' }) }
  },
  async reject(e) {
    var that = this
    const app = getApp()
    try {
      await app.request({ url: '/api/messages/' + e.currentTarget.dataset.id + '/reject', method: 'PUT' })
      wx.showToast({ title: '已散去', icon: 'none' })
      that.loadMessages()
    } catch (err) { wx.showToast({ title: '操作失败', icon: 'none' }) }
  },
  _fmt(t) {
    if (!t) return ''
    var d = new Date(t), ms = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
    var h = d.getHours(), m = d.getMinutes()
    return ms[d.getMonth()]+d.getDate()+'日 '+(h<10?'0':'')+h+':'+(m<10?'0':'')+m
  }
})
