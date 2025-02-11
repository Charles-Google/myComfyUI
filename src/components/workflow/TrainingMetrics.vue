<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import * as echarts from 'echarts'
import { onMounted, onUnmounted, ref } from 'vue'

const lossChartRef = ref<HTMLElement>()
const accuracyChartRef = ref<HTMLElement>()
let lossChart: echarts.ECharts | null = null
let accuracyChart: echarts.ECharts | null = null

// 模拟数据
function generateMockData(length: number) {
  return Array.from({ length }, (_, i) => ({
    epoch: i + 1,
    loss: Math.random() * 0.5 + 0.5 - i * 0.01,
    accuracy: Math.min(0.95, 0.6 + i * 0.02 + Math.random() * 0.1),
  }))
}

const mockData = generateMockData(20)

// 损失率图表配置
function getLossChartOption(): EChartsOption {
  return {
    grid: {
      top: 40,
      right: 20,
      bottom: 40,
      left: 60,
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}轮次<br />{a}: {c}',
    },
    xAxis: {
      type: 'category',
      name: '轮次',
      data: mockData.map(item => item.epoch),
      axisLabel: {
        color: '#333',
      },
    },
    yAxis: {
      type: 'value',
      name: '损失值',
      axisLabel: {
        color: '#333',
      },
    },
    series: [
      {
        name: '损失率',
        type: 'line',
        smooth: true,
        data: mockData.map(item => item.loss),
        lineStyle: {
          color: '#409EFF',
        },
        itemStyle: {
          color: '#409EFF',
        },
      },
    ],
  }
}

// 准确率图表配置
function getAccuracyChartOption(): EChartsOption {
  return {
    grid: {
      top: 40,
      right: 20,
      bottom: 40,
      left: 60,
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}轮次<br />{a}: {c}',
    },
    xAxis: {
      type: 'category',
      name: '轮次',
      data: mockData.map(item => item.epoch),
      axisLabel: {
        color: '#333',
      },
    },
    yAxis: {
      type: 'value',
      name: '准确率',
      axisLabel: {
        color: '#333',
      },
    },
    series: [
      {
        name: '准确率',
        type: 'line',
        smooth: true,
        data: mockData.map(item => item.accuracy),
        lineStyle: {
          color: '#67C23A',
        },
        itemStyle: {
          color: '#67C23A',
        },
      },
    ],
  }
}

// 初始化图表
onMounted(() => {
  if (lossChartRef.value && accuracyChartRef.value) {
    lossChart = echarts.init(lossChartRef.value)
    accuracyChart = echarts.init(accuracyChartRef.value)

    lossChart.setOption(getLossChartOption())
    accuracyChart.setOption(getAccuracyChartOption())

    window.addEventListener('resize', handleResize)
  }
})

// 处理窗口大小变化
function handleResize() {
  lossChart?.resize()
  accuracyChart?.resize()
}

// 清理
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  lossChart?.dispose()
  accuracyChart?.dispose()
})
</script>

<template>
  <div class="border border-gray-200 rounded-lg p-4">
    <h3 class="mb-4 text-lg text-gray-900 font-bold">
      训练指标
    </h3>

    <!-- 损失率图表 -->
    <div class="mb-6">
      <div class="mb-2 text-sm text-gray-700">
        损失率曲线
      </div>
      <div ref="lossChartRef" class="h-64 w-full" />
    </div>

    <!-- 准确率图表 -->
    <div class="mb-6">
      <div class="mb-2 text-sm text-gray-700">
        准确率曲线
      </div>
      <div ref="accuracyChartRef" class="h-64 w-full" />
    </div>
  </div>
</template>
