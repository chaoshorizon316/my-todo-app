Page({
  data: {
    showProfile: false,
    profileName: '小守',
    profileMbti: 'INFP', profileRelation: '热恋中',
    profileRole: '创业中', profileHope: '有方向',
    profileRhythm: '上午平静 · 午后微澜',
    profileSensitivity: '中等敏感', profileSource: '独处安静',
    profileBonds: '3 人 · 1 守护光点', profileEchoGain: '高 · 本周 8 次',
    currentState: 'mirror',
    stateText: '湖面如镜',
    stateSub: '心湖澄澈，波澜不惊',
    insight: '',
    echoCount: 0,
    showWarn: false,
    showRecord: false,
    recordTab: 'now',
    pickedMood: '',
    note: '',
    showToast: false,
    toastMsg: '',
    loading: true
  },

  stateMap: {
    mirror:  { text: '湖面如镜', sub: '心湖澄澈，波澜不惊' },
    breeze:  { text: '微风微澜', sub: '微风吹过，泛起浅浅涟漪' },
    ripples: { text: '涟漪频密', sub: '石子落下，波纹层层交织' },
    storm:   { text: '风起浪涌', sub: '风雨将至，湖面起伏激荡' }
  },

  onLoad() {
    if (!wx.getStorageSync('onboarded')) {
      wx.navigateTo({ url: '/pages/onboard/onboard' })
    }
    var self = this
    getApp().ensureLogin().then(function() {
      self.loadLakeState()
    }).catch(function(e) {
      console.error('登录失败', e)
      self.setData({ loading: false })
    })
  },

  onShow() {
    var app = getApp()
    if (app.globalData.token) {
      this.loadLakeState()
    }
    this.getTabBar && this.getTabBar().setData({ selected: 0 })
  },

  async loadLakeState() {
    var that = this
    var app = getApp()
    try {
      var data = await app.request({ url: '/api/lake-state' })
      if (!data || typeof data !== 'object') {
        console.warn('湖面状态返回异常', data)
        that.setData({ loading: false })
        return
      }
      var state = data.state || 'mirror'
      var s = that.stateMap[state] || that.stateMap.mirror
      that.setData({
        currentState: state, stateText: s.text, stateSub: s.sub,
        insight: data.insight || '', showWarn: state === 'storm',
        echoCount: (data.moods && data.moods.length) || 0,
        loading: false
      })
    } catch (e) {
      console.error('加载湖面状态失败', e)
      that.setData({ loading: false })
    }
  },

  switchState(e) {
    var state = e.currentTarget.dataset.state
    var s = this.stateMap[state]; if (!s) return
    this.setData({ currentState: state, stateText: s.text, stateSub: s.sub, showWarn: state === 'storm' })
  },

  throwStone() { wx.vibrateShort({ type: 'light' }); this._toast('石子已投入 · 涟漪荡漾') },
  openRecord() { this.setData({ showRecord: true, recordTab: 'now', pickedMood: '', note: '' }) },
  closeRecord() { this.setData({ showRecord: false }) },
  switchTab(e) { this.setData({ recordTab: e.currentTarget.dataset.tab, pickedMood: '' }) },
  pickMood(e) { this.setData({ pickedMood: e.currentTarget.dataset.mood }) },
  onNoteInput(e) { this.setData({ note: e.detail.value }) },

  async submit() {
    if (!this.data.pickedMood) return
    var that = this
    var app = getApp()
    try {
      await app.ensureLogin()
      await app.request({ url: '/api/moods', method: 'POST', data: { mood: that.data.pickedMood, lakeState: that.data.currentState || 'mirror', note: that.data.note } })
      that.setData({ showRecord: false })
      that._toast('石子已投入湖中 · 涟漪荡漾')
      that.loadLakeState()
    } catch (e) {
      console.error('提交心情失败', JSON.stringify(e))
      if (e && e.errMsg && e.errMsg.indexOf('timeout') >= 0) {
        that._toast('网络超时，正在重试...')
        try {
          await app.request({ url: '/api/moods', method: 'POST', data: { mood: that.data.pickedMood, lakeState: that.data.currentState || 'mirror', note: that.data.note } })
          that.setData({ showRecord: false })
          that._toast('石子已投入湖中 · 涟漪荡漾')
          that.loadLakeState()
          return
        } catch (e2) {
          that._toast('记录失败，请检查网络后重试')
        }
      } else if (e && e.error) {
        that._toast(e.error)
      } else {
        that._toast('记录失败，请重试')
      }
    }
  },

  goRipple() { wx.switchTab({ url: '/pages/ripple/ripple' }) },
  _toast(msg) {
    var that = this
    that.setData({ showToast: true, toastMsg: msg })
    setTimeout(function() { that.setData({ showToast: false }) }, 2500)
  },
  openProfile() { this.setData({ showProfile: true }) },
  closeProfile() { this.setData({ showProfile: false }) },

  noop() {}
})
