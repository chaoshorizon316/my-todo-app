const api = require('../../utils/api')
Page({
  data: { messages: [], ready: false },
  onLoad() {
    const app = getApp()
    if (app.globalData.loggedIn) {
      this.setData({ ready: true })
      this.loadMessages()
    } else {
      app.loginReadyCallback = () => {
        if (!this.data.ready) {
          this.setData({ ready: true })
          this.loadMessages()
        }
      }
    }
  },
  onShow() { if (this.data.ready) this.loadMessages() },
  loadMessages() {
    api.getMessages().then(data => this.setData({ messages: data })).catch(err => console.error('加载消息失败', err))
  },
  onAccept(e) {
    api.acceptMessage(e.currentTarget.dataset.id).then(() => this.loadMessages()).catch(console.error)
  },
  onReject(e) {
    api.rejectMessage(e.currentTarget.dataset.id).then(() => this.loadMessages()).catch(console.error)
  }
})