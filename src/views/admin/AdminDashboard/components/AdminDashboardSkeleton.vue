<template>
  <section class="dashboard-skeleton" aria-busy="true" aria-live="polite">
    <section class="hero-panel skeleton-panel">
      <div class="skeleton-block skeleton-hero-copy">
        <span class="skeleton-line skeleton-kicker"></span>
        <span class="skeleton-line skeleton-title"></span>
        <span class="skeleton-line skeleton-text"></span>
      </div>
      <div class="hero-meta skeleton-hero-meta">
        <div v-for="n in 3" :key="n" class="hero-chip skeleton-chip">
          <span class="skeleton-line skeleton-chip-value"></span>
          <span class="skeleton-line skeleton-chip-label"></span>
        </div>
      </div>
    </section>

    <section class="panel-row">
      <section class="panel panel-main skeleton-panel">
        <div class="card-head skeleton-head">
          <span class="skeleton-line skeleton-head-title"></span>
          <span class="skeleton-line skeleton-head-subtitle"></span>
        </div>
        <div class="kpi-strip skeleton-kpis">
          <article v-for="n in 6" :key="n" class="stat-card skeleton-stat">
            <span class="skeleton-badge"></span>
            <span class="skeleton-line skeleton-stat-value"></span>
            <span class="skeleton-line skeleton-stat-label"></span>
            <span class="skeleton-line skeleton-stat-note"></span>
          </article>
        </div>
      </section>

      <section class="panel panel-side skeleton-panel">
        <div class="card-head skeleton-head">
          <span class="skeleton-line skeleton-head-title"></span>
          <span class="skeleton-line skeleton-head-subtitle"></span>
        </div>
        <div class="quick-actions skeleton-actions">
          <article v-for="n in 5" :key="n" class="qa-btn skeleton-action">
            <span class="skeleton-icon"></span>
            <span class="skeleton-line skeleton-action-title"></span>
            <span class="skeleton-line skeleton-action-badge"></span>
            <span class="skeleton-line skeleton-action-note"></span>
          </article>
        </div>
      </section>
    </section>

    <section class="panel-row">
      <section class="panel panel-main skeleton-panel">
        <div class="card-head skeleton-head">
          <span class="skeleton-line skeleton-head-title"></span>
          <span class="skeleton-line skeleton-head-subtitle"></span>
        </div>
        <div class="chart-list skeleton-chart-list">
          <div v-for="n in 5" :key="n" class="chart-row skeleton-chart-row">
            <div class="chart-row-head skeleton-row-head">
              <span class="skeleton-line skeleton-row-label"></span>
              <span class="skeleton-line skeleton-row-value"></span>
            </div>
            <span class="skeleton-track"></span>
          </div>
        </div>
      </section>

      <section class="panel panel-side skeleton-panel">
        <div class="card-head skeleton-head">
          <span class="skeleton-line skeleton-head-title"></span>
          <span class="skeleton-line skeleton-head-subtitle"></span>
        </div>
        <div class="finance-box skeleton-finance-box">
          <span class="skeleton-line skeleton-finance-label"></span>
          <span class="skeleton-line skeleton-finance-value"></span>
          <span class="skeleton-line skeleton-finance-text"></span>
        </div>
        <div class="mini-stack skeleton-mini-stack">
          <div v-for="n in 2" :key="n" class="mini-row skeleton-mini-row">
            <span class="skeleton-line skeleton-mini-label"></span>
            <span class="skeleton-line skeleton-mini-value"></span>
          </div>
        </div>
      </section>
    </section>
  </section>
</template>

<style scoped lang="scss">
@use 'sass:color';
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.dashboard-skeleton {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.hero-panel,
.panel-row,
.panel,
.kpi-strip,
.quick-actions,
.chart-list,
.chart-row,
.chart-row-head,
.chart-track,
.hero-meta,
.hero-chip,
.mini-stack,
.mini-row {
  display: flex;
}

.hero-panel {
  flex-direction: column;
  gap: $space-3;
  padding: $space-5;
  border-radius: 20px;
  border: 1px solid rgba($ink-500, 0.12);
  background: linear-gradient(135deg, rgba($ink-900, 0.98), rgba($ink-800, 0.82));
  align-items: center;
  text-align: center;
}

.panel-row {
  flex-wrap: wrap;
  gap: $space-4;
  align-items: flex-start;
}

.panel {
  flex: 1 1 420px;
  min-width: 0;
  flex-direction: column;
  gap: $space-4;
  padding: $space-5;
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 18px;
}

.panel-main { flex: 2 1 640px; }
.panel-side { flex: 1 1 320px; }

.card-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-1;
  padding-bottom: $space-3;
  border-bottom: 1px solid rgba($ink-500, 0.08);
}

.card-head h3, .card-subtitle { margin: 0; }

.card-head h3 { display: flex; align-items: center; gap: $space-2; font-size: 1rem; font-weight: 700; justify-content: center; }
.card-subtitle { font-size: 0.75rem; color: $ink-400; text-transform: uppercase; letter-spacing: 0.08em; }

.skeleton-block,
.skeleton-chip,
.skeleton-stat,
.skeleton-action,
.skeleton-finance-box,
.skeleton-mini-row,
.skeleton-chart-row {
  position: relative;
  overflow: hidden;
  background: rgba($ink-800, 0.42);
  border: 1px solid rgba($ink-500, 0.08);
}

.skeleton-line {
  display: block;
  position: relative;
  overflow: hidden;
  border-radius: 999px;
  background: rgba($ink-700, 0.84);
}

.skeleton-panel::after,
.skeleton-line::after,
.skeleton-badge::after,
.skeleton-icon::after,
.skeleton-track::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(#fff, 0.06), transparent);
  transform: translateX(-100%);
  animation: shimmer 1.35s infinite;
}

.skeleton-hero-copy,
.skeleton-hero-meta,
.skeleton-head,
.skeleton-kpis,
.skeleton-actions,
.skeleton-chart-list,
.skeleton-mini-stack {
  width: 100%;
}

.skeleton-hero-copy { display: flex; flex-direction: column; gap: $space-2; width: min(58ch, 100%); }
.skeleton-kicker, .skeleton-head-subtitle, .skeleton-chip-label, .skeleton-stat-label, .skeleton-stat-note, .skeleton-action-badge, .skeleton-action-note, .skeleton-row-value, .skeleton-finance-label, .skeleton-finance-text, .skeleton-mini-label { height: 12px; }
.skeleton-title { height: 28px; width: min(420px, 78%); }
.skeleton-text { height: 14px; width: min(520px, 92%); }
.skeleton-kicker { width: 120px; }
.skeleton-head-title { width: 160px; height: 18px; }
.skeleton-head-subtitle { width: 110px; }
.skeleton-chip-value { width: 56px; height: 18px; }
.skeleton-chip-label { width: 70px; }

.skeleton-chip, .skeleton-stat, .skeleton-action { min-height: 88px; border-radius: 14px; }
.skeleton-chip { flex: 1 1 120px; padding: $space-3 $space-4; display: flex; flex-direction: column; gap: $space-2; justify-content: center; align-items: center; }
.skeleton-hero-meta { display: flex; flex-wrap: wrap; gap: $space-3; }
.skeleton-kpis { gap: $space-3; }
.skeleton-stat { flex: 1 1 200px; padding: $space-3; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: $space-2; }
.skeleton-badge, .skeleton-icon { position: relative; display: block; width: 32px; height: 32px; border-radius: 10px; background: rgba($brand-orange, 0.12); flex: 0 0 auto; }
.skeleton-stat-value { width: 52px; height: 18px; }
.skeleton-stat-label { width: 88px; }
.skeleton-stat-note { width: 72px; }
.skeleton-actions { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: $space-2; }
.skeleton-action { padding: $space-3; min-height: 96px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: $space-2; }
.skeleton-action-title { width: 92px; height: 16px; }
.skeleton-action-badge { width: 28px; }
.skeleton-action-note { width: 82px; }
.skeleton-chart-list, .skeleton-mini-stack { display: flex; flex-direction: column; gap: $space-4; }
.skeleton-chart-row { padding: $space-4; display: flex; flex-direction: column; gap: $space-3; border-radius: 14px; }
.skeleton-row-head { display: flex; justify-content: space-between; gap: $space-3; }
.skeleton-row-label { width: 150px; }
.skeleton-row-value { width: 32px; }
.skeleton-track { position: relative; display: block; height: 12px; border-radius: 999px; background: rgba($ink-700, 0.75); }
.skeleton-finance-box { min-height: 220px; padding: $space-5; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: $space-3; border-radius: 16px; }
.skeleton-finance-label { width: 110px; }
.skeleton-finance-value { width: 160px; height: 28px; }
.skeleton-finance-text { width: 220px; height: 14px; }
.skeleton-mini-row { padding: $space-3 0; display: flex; justify-content: space-between; gap: $space-3; border-radius: 14px; }
.skeleton-mini-label { width: 120px; }
.skeleton-mini-value { width: 32px; }

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@media (max-width: 860px) {
  .panel { flex-basis: 100%; }
  .quick-actions { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 640px) {
  .panel-row { flex-direction: column; }
  .quick-actions { grid-template-columns: 1fr; }
}
</style>
