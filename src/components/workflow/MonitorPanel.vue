<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { isDark } from '@/composables/dark'
import { useEventListener } from '@vueuse/core'
import * as echarts from 'echarts'
import { onMounted, onUnmounted, ref, watch } from 'vue'

interface GPUMetrics {
  usage: number
  memory: number
  temperature: number
  timestamp: string
}

const gpuChart = ref<echarts.ECharts>()
const memoryChart = ref<echarts.ECharts>()
const temperatureChart = ref<echarts.ECharts>()

const gpuData = ref<{ time: string, value: number }[]>([])
const memoryData = ref<{ time: string, value: number }[]>([])
const temperatureData = ref<{ time: string, value: number }[]>([])

const MAX_DATA_POINTS = 60

function initChart(el: HTMLElement, title: string, yAxisName: string, color: string) {
  const chart = echarts.init(el, isDark.value ? 'dark' : undefined)
  const option: EChartsOption = {
    title: {
      text: title,
      left: 'center',
      textStyle: {
        fontSize: 14,
      },
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c}%',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: [],
      axisLabel: {
        show: false,
      },
    },
    yAxis: {
      type: 'value',
      name: yAxisName,
      min: 0,
      max: 100,
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'none',
        areaStyle: {
          opacity: 0.3,
        },
        lineStyle: {
          width: 2,
        },
        itemStyle: {
          color,
        },
        data: [],
      },
    ],
  }
  chart.setOption(option)
  return chart
}

function updateChartData(chart: echarts.ECharts | undefined, data: { time: string, value: number }[]) {
  if (!chart)
    return
  chart.setOption({
    xAxis: {
      data: data.map(item => item.time),
    },
    series: [
      {
        data: data.map(item => item.value),
      },
    ],
  })
}

// 模拟GPU指标数据
function mockGPUMetrics(): GPUMetrics {
  return {
    usage: Math.random() * 100,
    memory: Math.random() * 100,
    temperature: 40 + Math.random() * 40,
    timestamp: new Date().toLocaleTimeString(),
  }
}

function updateMetrics() {
  const metrics = mockGPUMetrics()
  const time = metrics.timestamp

  gpuData.value.push({ time, value: metrics.usage })
  memoryData.value.push({ time, value: metrics.memory })
  temperatureData.value.push({ time, value: metrics.temperature })

  if (gpuData.value.length > MAX_DATA_POINTS) {
    gpuData.value.shift()
    memoryData.value.shift()
    temperatureData.value.shift()
  }

  updateChartData(gpuChart.value, gpuData.value)
  updateChartData(memoryChart.value, memoryData.value)
  updateChartData(temperatureChart.value, temperatureData.value)
}

let updateInterval: NodeJS.Timer

onMounted(() => {
  const gpuEl = document.getElementById('gpu-chart')
  const memoryEl = document.getElementById('memory-chart')
  const temperatureEl = document.getElementById('temperature-chart')

  if (gpuEl && memoryEl && temperatureEl) {
    gpuChart.value = initChart(gpuEl, 'GPU使用率', '%', '#409EFF')
    memoryChart.value = initChart(memoryEl, 'GPU内存使用率', '%', '#67C23A')
    temperatureChart.value = initChart(
      temperatureEl,
      'GPU温度',
      '°C',
      '#E6A23C',
    )
  }

  updateInterval = setInterval(updateMetrics, 1000)

  useEventListener(window, 'resize', () => {
    gpuChart.value?.resize()
    memoryChart.value?.resize()
    temperatureChart.value?.resize()
  })

  // 监听暗色模式变化
  watch(isDark, (dark) => {
    if (gpuChart.value) {
      const option = gpuChart.value.getOption()
      gpuChart.value.dispose()
      gpuChart.value = echarts.init(
        document.getElementById('gpu-chart')!,
        dark ? 'dark' : undefined,
      )
      gpuChart.value.setOption(option)
    }
    if (memoryChart.value) {
      const option = memoryChart.value.getOption()
      memoryChart.value.dispose()
      memoryChart.value = echarts.init(
        document.getElementById('memory-chart')!,
        dark ? 'dark' : undefined,
      )
      memoryChart.value.setOption(option)
    }
    if (temperatureChart.value) {
      const option = temperatureChart.value.getOption()
      temperatureChart.value.dispose()
      temperatureChart.value = echarts.init(
        document.getElementById('temperature-chart')!,
        dark ? 'dark' : undefined,
      )
      temperatureChart.value.setOption(option)
    }
  })
})

onUnmounted(() => {
  clearInterval(updateInterval)
  gpuChart.value?.dispose()
  memoryChart.value?.dispose()
  temperatureChart.value?.dispose()
})
</script>

<template>
  <div class="monitor-panel">
    <h2 class="panel-title">
      设备监控
    </h2>
    <div class="charts-container">
      <div id="gpu-chart" class="chart" />
      <div id="memory-chart" class="chart" />
      <div id="temperature-chart" class="chart" />
    </div>
  </div>
</template>

<style>
.monitor-panel {
  @apply h-full p-4 flex flex-col;
}

.panel-title {
  @apply text-lg font-bold mb-4;
}

.charts-container {
  @apply flex-1 flex flex-col gap-4 overflow-y-auto;
}

.chart {
  @apply h-64 w-full bg-white rounded-lg shadow-sm;
}
</style>
