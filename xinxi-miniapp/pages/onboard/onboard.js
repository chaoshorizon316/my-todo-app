Page({
  data: {
    step: 1, canAdvance: false, loading: false,
    picks: { mbti:'', emotion:'', roleWork:'', roleHome:'', hope:'', micro:'' },
    emotionOptions: ['已婚','热恋','空窗期','单身主义','模糊地带','暗恋中','长跑中','分居中','开放关系'],
    roleWorkOptions: ['在职稳定','创业中','学生党','全职带娃','求职中','Gap期','高压行业','自由职业'],
    roleHomeOptions: ['有娃父母','二人世界','独居自由','与父母同住','宠物家长','照顾老人']
  },
  pick(e) {
    const { key, val } = e.currentTarget.dataset; if (!key) return
    const picks = { ...this.data.picks }; picks[key] = val
    this.setData({ picks }); this.checkAdvance()
  },
  pickRole(e) {
    if (this.data.picks.roleWork) { const picks = { ...this.data.picks }; picks.roleWork = ''; this.setData({ picks }); this.checkAdvance(); return }
    wx.showActionSheet({ itemList: this.data.roleWorkOptions, success: res => {
      const picks = { ...this.data.picks }; picks.roleWork = this.data.roleWorkOptions[res.tapIndex]
      this.setData({ picks }); this.checkAdvance()
    }})
  },
  pickRoleHome() {
    wx.showActionSheet({ itemList: this.data.roleHomeOptions, success: res => {
      const picks = { ...this.data.picks }; picks.roleHome = this.data.roleHomeOptions[res.tapIndex]
      this.setData({ picks }); this.checkAdvance()
    }})
  },
  checkAdvance() {
    const p = this.data.picks; this.setData({ canAdvance: !!(p.mbti && p.emotion && p.hope) })
  },
  nextStep() { if (this.data.canAdvance) this.setData({ step: 2 }) },
  async finish() {
    var that = this
    if (that.data.loading) return; that.setData({ loading: true })
    wx.setStorageSync('onboarded', true)
    const app = getApp(); const picks = that.data.picks
    try {
      await app.ensureLogin()
      if (picks.mbti) await app.request({ url: '/api/user/me', method: 'PUT', data: { mbti: picks.mbti, relation: picks.emotion } }).catch(()=>{})
    } catch (e) {}
    wx.navigateBack({ delta: 1 })
  }
})
