Page({
  data: {
    moods: [],
    timeSlots: [],
    todayCount: 0,
    weekCount: 0,
    hasMore: true,
    offset: 0
  },

  // 时间槽位: 6 个时段
  _timeSlotDefs: [
    { time: 'morning', label: '8:20', start: 6, end: 10 },
    { time: 'late_morning', label: '10:00', start: 10, end: 12 },
    { time: 'noon', label: '12:00', start: 12, end: 14 },
    { time: 'afternoon', label: '14:00', start: 14, end: 16 },
    { time: 'late_afternoon', label: '16:00', start: 16, end: 18 },
    { time: 'evening', label: '18:00', start: 18, end: 24 }
  ],

  onShow() {
    this.getTabBar && this.getTabBar().setData({ selected: 1 })
    this.setData({ offset: 0, moods: [], timeSlots: [] })
    getApp().ensureLogin().then(() => this.loadMoods()).catch(() => {})
  },

  async loadMoods() {
    var that = this
    var app = getApp()
    try {
      var data = await app.request({ url: '/api/moods?limit=100&offset=' + that.data.offset })
      if (!Array.isArray(data)) return
      var moods = data.map(function(m) {
        return {
          ...m,
          moodIconMS: that._moodIconMS(m.mood),
          dotColor: that._moodColor(m.mood),
          timeStr: that._fmt(m.createdAt)
        }
      })
      that.setData({
        moods: that.data.offset === 0 ? moods : [...that.data.moods, ...moods],
        hasMore: data.length === 100,
        offset: that.data.offset + data.length,
        todayCount: moods.filter(function(m) { return that._isToday(m.createdAt) }).length,
        weekCount: (that.data.offset === 0 ? moods : [...that.data.moods, ...moods]).length
      })
      // 计算时间序列
      var allMoods = that.data.offset === 0 ? data : [...that.data.moods.map(function(m) { return { mood: m.mood, createdAt: m.createdAt } }), ...data]
      that.calcTimeSlots(allMoods)
    } catch (e) {
      console.error('加载涟漪失败', e)
    }
  },

  calcTimeSlots(moods) {
    var that = this
    if (!moods || moods.length === 0) { this.setData({ timeSlots: [] }); return }
    var todayMoods = moods.filter(function(m) { return that._isToday(m.createdAt || m.time) })
    if (todayMoods.length === 0) { this.setData({ timeSlots: [] }); return }

    // 统计每个时段的心情
    var slotCounts = {}
    var slotMoods = {}  // 记录每个时段最常见的心情
    todayMoods.forEach(function(m) {
      var d = new Date(m.createdAt || m.time)
      var h = d.getHours()
      var slot = that._findSlot(h)
      if (!slot) return
      var key = slot.time
      slotCounts[key] = (slotCounts[key] || 0) + 1
      if (!slotMoods[key]) slotMoods[key] = {}
      slotMoods[key][m.mood] = (slotMoods[key][m.mood] || 0) + 1
    })

    var maxCount = 1
    Object.values(slotCounts).forEach(function(c) { if (c > maxCount) maxCount = c })

    var containerH = 180  // rpx
    var timeSlots = that._timeSlotDefs.map(function(def) {
      var key = def.time
      var count = slotCounts[key] || 0
      var pct = maxCount > 0 ? Math.round(count / maxCount * 100) : 0
      var moodEntries = slotMoods[key] ? Object.entries(slotMoods[key]) : []
      moodEntries.sort(function(a, b) { return b[1] - a[1] })
      var dominant = moodEntries.length > 0 ? moodEntries[0][0] : '平静'
      return {
        time: def.time,
        label: def.label,
        containerH: containerH,
        pct: Math.max(pct, 4),     // 至少 4% 高度可见
        color: that._moodColor(dominant),
        count: count
      }
    })
    this.setData({ timeSlots: timeSlots })
  },

  _findSlot(hour) {
    var slots = this._timeSlotDefs
    for (var i = 0; i < slots.length; i++) {
      if (hour >= slots[i].start && hour < slots[i].end) return slots[i]
    }
    return null
  },

  loadMore() { this.loadMoods() },

  _moodIconMS(mood) {
    var map = { '开心': 'sentiment_very_satisfied', '平静': 'self_care', '疲惫': 'bedtime',
      '焦虑': 'waves', '低落': 'water_drop', '充满活力': 'bolt',
      '平静放松': 'self_care', '略有波动': 'waves', '期待兴奋': 'bolt', '焦虑不安': 'sentiment_dissatisfied' }
    return map[mood] || 'water_drop'
  },
  _moodColor(mood) {
    var map = { '开心': '#b1ccc5', '平静': '#c4c7c7', '疲惫': '#e8d5c0', '焦虑': '#e8c5c0',
      '低落': '#d5c5d0', '充满活力': '#a3c9b5',
      '平静放松': '#b1ccc5', '略有波动': '#e8d5c0', '期待兴奋': '#a3c9b5', '焦虑不安': '#e8c5c0' }
    return map[mood] || '#c4c7c7'
  },
  _fmt(t) {
    if (!t) return ''
    var d = new Date(t), n = new Date()
    var isToday = d.getFullYear()===n.getFullYear() && d.getMonth()===n.getMonth() && d.getDate()===n.getDate()
    var h = d.getHours(), m = d.getMinutes()
    var time = (h<10?'0':'')+h+':'+(m<10?'0':'')+m
    if (isToday) return '今天 ' + time
    var ms = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
    return ms[d.getMonth()] + d.getDate() + '日 ' + time
  },
  _isToday(t) {
    if (!t) return false
    var d = new Date(t), n = new Date()
    return d.getFullYear()===n.getFullYear() && d.getMonth()===n.getMonth() && d.getDate()===n.getDate()
  }
})
