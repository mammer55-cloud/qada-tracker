import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import { PRAYERS, initAssignments, todayISO, SLOTS } from './lib/prayers'
import SetupView from './components/SetupView'
import PlannerView from './components/PlannerView'
import Header from './components/Header'

export default function App() {
  const [view, setView] = useState('planner') // 'planner' | 'setup'
  const [balance, setBalance] = useState(null) // null = loading
  const [planId, setPlanId] = useState(null)
  const [assignments, setAssignments] = useState(initAssignments())
  const [completedToday, setCompletedToday] = useState(false)
  const [toast, setToast] = useState(null)
  const saveTimer = useRef(null)

  // Load balance + today's plan on mount
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [{ data: balRows }, { data: plan }] = await Promise.all([
      supabase.from('qada_balance').select('*'),
      supabase.from('daily_plans').select('*, plan_assignments(*)').eq('plan_date', todayISO()).maybeSingle()
    ])

    if (balRows) {
      const bal = {}
      balRows.forEach(r => { bal[r.prayer_type] = r.remaining })
      setBalance(bal)
    }

    if (plan) {
      setPlanId(plan.id)
      setCompletedToday(plan.is_completed)
      // Rebuild assignments map from DB rows
      const map = initAssignments()
      ;(plan.plan_assignments || []).forEach(a => {
        const key = `${a.fard_prayer}::${a.slot}`
        if (!map[key]) map[key] = []
        map[key].push({ id: a.id, type: a.qada_prayer_type, orderIndex: a.order_index })
      })
      // Sort by order_index
      SLOTS.forEach(k => { map[k].sort((a, b) => a.orderIndex - b.orderIndex) })
      setAssignments(map)
    }
  }

  // Auto-save plan with debounce
  async function scheduleSave(newAssignments) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => savePlan(newAssignments), 800)
  }

  async function savePlan(currentAssignments) {
    let pid = planId

    if (!pid) {
      // Create plan for today
      const { data, error } = await supabase
        .from('daily_plans')
        .upsert({ plan_date: todayISO() }, { onConflict: 'plan_date' })
        .select('id')
        .single()
      if (error || !data) return
      pid = data.id
      setPlanId(pid)
    }

    // Replace all assignments for this plan
    await supabase.from('plan_assignments').delete().eq('plan_id', pid)

    const rows = []
    SLOTS.forEach(slotKey => {
      const [fardPrayer, slot] = slotKey.split('::')
      ;(currentAssignments[slotKey] || []).forEach((chip, idx) => {
        rows.push({
          plan_id: pid,
          fard_prayer: fardPrayer,
          slot,
          qada_prayer_type: chip.type,
          order_index: idx,
        })
      })
    })

    if (rows.length > 0) {
      await supabase.from('plan_assignments').insert(rows)
    }
  }

  function updateAssignments(newAssignments) {
    setAssignments(newAssignments)
    scheduleSave(newAssignments)
  }

  async function handleSaveBalance(newBalance) {
    const updates = PRAYERS.map(p => ({
      prayer_type: p,
      remaining: newBalance[p] ?? 0,
      updated_at: new Date().toISOString(),
    }))

    // Snapshot before overwriting
    await supabase.from('balance_snapshots').insert({
      snapshot_date: todayISO(),
      fajr: newBalance.fajr ?? 0,
      dhuhr: newBalance.dhuhr ?? 0,
      asr: newBalance.asr ?? 0,
      maghrib: newBalance.maghrib ?? 0,
      isha: newBalance.isha ?? 0,
      trigger_reason: 'manual_update',
    })

    await supabase.from('qada_balance').upsert(updates, { onConflict: 'prayer_type' })
    setBalance(newBalance)
    showToast('Balance saved')
    setView('planner')
  }

  async function handleCompleteDay(plannedCounts) {
    // Take snapshot BEFORE decrementing
    await supabase.from('balance_snapshots').insert({
      snapshot_date: todayISO(),
      fajr: balance.fajr,
      dhuhr: balance.dhuhr,
      asr: balance.asr,
      maghrib: balance.maghrib,
      isha: balance.isha,
      trigger_reason: 'pre_complete',
    })

    // Decrement balance (never below 0)
    const newBalance = {}
    const updates = PRAYERS.map(p => {
      const completed = Math.min(plannedCounts[p] || 0, balance[p] || 0)
      newBalance[p] = (balance[p] || 0) - completed
      return { prayer_type: p, remaining: newBalance[p], updated_at: new Date().toISOString() }
    })

    await supabase.from('qada_balance').upsert(updates, { onConflict: 'prayer_type' })

    // Post-completion snapshot
    await supabase.from('balance_snapshots').insert({
      snapshot_date: todayISO(),
      fajr: newBalance.fajr,
      dhuhr: newBalance.dhuhr,
      asr: newBalance.asr,
      maghrib: newBalance.maghrib,
      isha: newBalance.isha,
      trigger_reason: 'post_complete',
    })

    // Mark plan complete
    if (planId) {
      await supabase.from('daily_plans').update({ is_completed: true }).eq('id', planId)
    }

    setBalance(newBalance)
    setCompletedToday(true)

    const total = PRAYERS.reduce((s, p) => s + (plannedCounts[p] || 0), 0)
    showToast(`Masha'Allah! ${total} qada praye${total !== 1 ? 's' : ''} completed`)
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  if (balance === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 60%, #1a0a2e 100%)' }}>
        <div className="text-center space-y-3">
          <div className="text-4xl pulse-soft">🌙</div>
          <p className="text-white/40 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  const hasBalance = PRAYERS.some(p => (balance[p] || 0) > 0)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 60%, #1a0a2e 100%)' }}>
      <Header
        view={view}
        onToggleSetup={() => setView(view === 'setup' ? 'planner' : 'setup')}
        completedToday={completedToday}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {view === 'setup' || !hasBalance ? (
          <SetupView
            balance={balance}
            onSave={handleSaveBalance}
            isFirstTime={!hasBalance}
          />
        ) : (
          <PlannerView
            balance={balance}
            assignments={assignments}
            onAssignmentsChange={updateAssignments}
            onCompleteDay={handleCompleteDay}
            completedToday={completedToday}
          />
        )}
      </main>

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 slide-up">
          <div className="glass-strong rounded-2xl px-5 py-3 text-sm text-white font-medium shadow-2xl">
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}
