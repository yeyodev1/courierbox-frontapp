<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object as () => { start: string; end: string },
    required: true,
  },
});

const emit = defineEmits(['update:modelValue', 'change']);

// State
const isOpen = ref(false);
const currentDate = ref(new Date());
const selectingStart = ref(true);
const localRange = ref<{ start: string; end: string }>({ 
  start: props.modelValue.start || '', 
  end: props.modelValue.end || '' 
});

// Element ref for click outside
const filterRef = ref<HTMLElement | null>(null);

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Calendar Logic
const currentMonth = computed(() => currentDate.value.getMonth());
const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonthName = computed(() => monthNames[currentMonth.value]);

const daysInMonth = computed(() => new Date(currentYear.value, currentMonth.value + 1, 0).getDate());
const firstDayOfMonth = computed(() => {
  const day = new Date(currentYear.value, currentMonth.value, 1).getDay();
  return day === 0 ? 6 : day - 1; // Start on Monday
});

const calendarDays = computed(() => {
  const days = [];
  for (let i = 0; i < firstDayOfMonth.value; i++) {
    days.push({ empty: true });
  }
  for (let i = 1; i <= daysInMonth.value; i++) {
    const d = new Date(currentYear.value, currentMonth.value, i);
    days.push({ 
      empty: false, 
      date: d, 
      dateString: d.toISOString().split('T')[0] || '',
      dayNumber: i 
    });
  }
  return days;
});

// Actions
const prevMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1);
};

const nextMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1);
};

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const closeDropdown = (e: MouseEvent) => {
  if (filterRef.value && !filterRef.value.contains(e.target as Node)) {
    isOpen.value = false;
  }
};

const selectDay = (day: any) => {
  if (day.empty) return;
  if (selectingStart.value) {
    localRange.value.start = day.dateString;
    // If start > end, reset end
    if (localRange.value.end && new Date(localRange.value.start) > new Date(localRange.value.end)) {
      localRange.value.end = '';
    }
    selectingStart.value = false;
  } else {
    // Ensure end is >= start
    if (new Date(day.dateString) < new Date(localRange.value.start)) {
      localRange.value.start = day.dateString;
      localRange.value.end = '';
    } else {
      localRange.value.end = day.dateString;
      selectingStart.value = true;
    }
  }
};

const isSelected = (dateStr: string | undefined) => {
  if (!dateStr) return false;
  return localRange.value.start === dateStr || localRange.value.end === dateStr;
};

const isInRange = (dateStr: string | undefined) => {
  if (!dateStr) return false;
  if (!localRange.value.start || !localRange.value.end) return false;
  const d = new Date(dateStr);
  const s = new Date(localRange.value.start);
  const e = new Date(localRange.value.end);
  return d > s && d < e;
};

const applyFilter = () => {
  // Ensure we have both dates
  if (!localRange.value.start) localRange.value.start = new Date().toISOString().split('T')[0] || '';
  if (!localRange.value.end) localRange.value.end = localRange.value.start;

  emit('update:modelValue', localRange.value);
  emit('change', localRange.value);
  isOpen.value = false;
};

const setPreset = (days: number) => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  
  localRange.value.start = start.toISOString().split('T')[0] || '';
  localRange.value.end = end.toISOString().split('T')[0] || '';
  applyFilter();
};

const formatDateDisplay = (dateStr: string | undefined) => {
  if (!dateStr) return '--/--/----';
  const parts = dateStr.split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

// Lifecycle
onMounted(() => {
  document.addEventListener('click', closeDropdown);
});

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown);
});

watch(() => props.modelValue, (newVal) => {
  localRange.value = { ...newVal };
}, { deep: true });
</script>

<template>
  <div class="custom-date-filter" ref="filterRef">
    
    <!-- Mobile First Trigger -->
    <button class="filter-trigger glass-card" @click="toggleDropdown">
      <div class="trigger-info">
        <i class="fa-regular fa-calendar"></i>
        <span>{{ formatDateDisplay(localRange.start) }} - {{ formatDateDisplay(localRange.end) }}</span>
      </div>
      <i class="fa-solid fa-chevron-down" :class="{ 'rotated': isOpen }"></i>
    </button>

    <!-- Custom Dropdown Calendar -->
    <div v-if="isOpen" class="filter-dropdown glass-card">
      
      <!-- Presets -->
      <div class="presets-container">
        <button class="preset-btn" @click="setPreset(7)">Últimos 7 días</button>
        <button class="preset-btn" @click="setPreset(15)">Últimos 15 días</button>
        <button class="preset-btn" @click="setPreset(30)">Últimos 30 días</button>
      </div>

      <div class="calendar-container">
        <!-- Calendar Header -->
        <div class="calendar-header">
          <button class="nav-btn" @click.stop="prevMonth"><i class="fa-solid fa-chevron-left"></i></button>
          <span class="month-title">{{ currentMonthName }} {{ currentYear }}</span>
          <button class="nav-btn" @click.stop="nextMonth"><i class="fa-solid fa-chevron-right"></i></button>
        </div>

        <!-- Days of Week -->
        <div class="weekdays">
          <span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sa</span><span>Do</span>
        </div>

        <!-- Days Grid -->
        <div class="days-grid">
          <div 
            v-for="(day, index) in calendarDays" 
            :key="index"
            class="day-cell"
            :class="{
              'empty': day.empty,
              'selected': !day.empty && isSelected(day.dateString),
              'in-range': !day.empty && isInRange(day.dateString),
              'start-target': selectingStart && !day.empty,
              'end-target': !selectingStart && !day.empty
            }"
            @click.stop="selectDay(day)"
          >
            <span v-if="!day.empty">{{ day.dayNumber }}</span>
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="filter-actions">
        <div class="selection-status">
          <span :class="{'active': selectingStart}">Inicio: {{ formatDateDisplay(localRange.start) }}</span>
          <span :class="{'active': !selectingStart}">Fin: {{ formatDateDisplay(localRange.end) }}</span>
        </div>
        <button class="btn-primary" @click="applyFilter">Aplicar</button>
      </div>

    </div>
  </div>
</template>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/styles/tokens/colors' as *;

.custom-date-filter {
  position: relative;
  width: 100%;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    width: auto;
    display: inline-flex;
    justify-content: flex-end;
  }
}

.filter-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: rgba($ink-900, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(#fff, 0.08);
  border-radius: 16px;
  color: $fg-dark;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  @media (min-width: 768px) {
    min-width: 280px;
  }

  &:hover {
    border-color: rgba($brand-orange, 0.4);
    background: rgba($ink-900, 0.8);
    box-shadow: 0 4px 20px rgba($brand-orange, 0.15);
    transform: translateY(-1px);
  }

  .trigger-info {
    display: flex;
    align-items: center;
    gap: 0.875rem;

    i {
      color: $brand-orange;
      font-size: 1.1rem;
      filter: drop-shadow(0 2px 4px rgba($brand-orange, 0.3));
    }
  }

  .fa-chevron-down {
    transition: transform 0.3s ease;
    color: $muted-dark;
    font-size: 0.85rem;
    &.rotated {
      transform: rotate(180deg);
      color: $brand-orange;
    }
  }
}

.filter-dropdown {
  position: absolute;
  top: calc(100% + 0.75rem);
  left: 0;
  right: 0;
  z-index: 50;
  background: rgba($ink-900, 0.95);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(#fff, 0.1);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(#fff, 0.05);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  transform-origin: top center;
  animation: dropdownIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  @media (min-width: 768px) {
    width: 340px;
    left: auto;
    right: 0;
  }
}

@keyframes dropdownIn {
  from { opacity: 0; transform: scale(0.95) translateY(-10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.presets-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;

  .preset-btn {
    background: rgba($ink-400, 0.15);
    border: 1px solid transparent;
    color: $muted-dark;
    padding: 0.6rem 0.25rem;
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;

    &:hover {
      background: rgba($brand-orange, 0.1);
      color: $brand-orange;
      border-color: rgba($brand-orange, 0.3);
    }
  }
}

.calendar-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.5rem;

  .month-title {
    font-weight: 600;
    color: $fg-dark;
    font-size: 1.05rem;
  }

  .nav-btn {
    background: rgba($ink-400, 0.2);
    border: none;
    color: $fg-dark;
    cursor: pointer;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
      background: rgba($brand-orange, 0.2);
      color: $brand-orange;
    }
  }
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: $muted-dark;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;

  .day-cell {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    color: $fg-dark;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;

    &.empty {
      cursor: default;
    }

    &:not(.empty):hover {
      background: rgba($ink-400, 0.3);
    }

    &.in-range {
      background: rgba($brand-orange, 0.15);
      border-radius: 0;
      color: $brand-orange;
    }

    &.selected {
      background: $brand-orange;
      color: #fff;
      font-weight: bold;
      border-radius: 50%;
      box-shadow: 0 4px 10px rgba($brand-orange, 0.4);
      z-index: 2;
    }
  }
}

.filter-actions {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  border-top: 1px solid rgba(#fff, 0.08);
  padding-top: 1.25rem;

  .selection-status {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: $muted-dark;
    background: rgba($ink-400, 0.1);
    padding: 0.75rem 1rem;
    border-radius: 8px;

    span.active {
      color: $brand-orange;
      font-weight: 600;
    }
  }

  .btn-primary {
    width: 100%;
    padding: 0.875rem;
    background: linear-gradient(135deg, $brand-orange, color.adjust($brand-orange, $lightness: -10%));
    color: #fff;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba($brand-orange, 0.3);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba($brand-orange, 0.4);
    }
    
    &:active {
      transform: translateY(1px);
    }
  }
}

@media (max-width: 480px) {
  .custom-date-filter {
    margin-bottom: 1.5rem;
  }
  
  .filter-dropdown {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    border-radius: 24px 24px 0 0;
    padding: 1.5rem;
    border-bottom: none;
    box-shadow: 0 -10px 40px rgba(0,0,0,0.5);
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
}
</style>
