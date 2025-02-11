<script setup lang="ts">
import { ref } from 'vue'

// 模拟数据，实际应该通过WebSocket或API获取
const gpuUsage = ref(65)
const memoryUsed = ref(8)
const memoryTotal = ref(16)
const temperature = ref(75)

// 根据使用率返回不同的颜色
function getProgressColor(percentage: number) {
  if (percentage < 60)
    return '#67C23A'
  if (percentage < 80)
    return '#E6A23C'
  return '#F56C6C'
}

// 根据温度返回不同的颜色
function getTemperatureColor(temperature: number) {
  if (temperature < 70)
    return '#67C23A'
  if (temperature < 85)
    return '#E6A23C'
  return '#F56C6C'
}
</script>

<template>
  <div class="border border-gray-200 rounded-lg p-4">
    <h3 class="mb-4 text-lg text-gray-900 font-bold">
      设备监控
    </h3>

    <div class="grid grid-cols-3 gap-4">
      <!-- GPU使用率 -->
      <div class="text-center">
        <el-progress
          type="dashboard"
          :percentage="gpuUsage"
          :color="getProgressColor(gpuUsage)"
          :stroke-width="10"
        />
        <div class="mt-2">
          <div class="text-sm text-gray-700">
            GPU使用率
          </div>
          <div class="text-sm text-gray-900 font-medium">
            {{ gpuUsage }}%
          </div>
        </div>
      </div>

      <!-- 显存使用 -->
      <div class="text-center">
        <el-progress
          type="dashboard"
          :percentage="(memoryUsed / memoryTotal) * 100"
          :color="getProgressColor((memoryUsed / memoryTotal) * 100)"
          :stroke-width="10"
        />
        <div class="mt-2">
          <div class="text-sm text-gray-700">
            显存使用
          </div>
          <div class="text-sm text-gray-900 font-medium">
            {{ memoryUsed }}GB / {{ memoryTotal }}GB
          </div>
        </div>
      </div>

      <!-- GPU温度 -->
      <div class="text-center">
        <el-progress
          type="dashboard"
          :percentage="temperature"
          :color="getTemperatureColor(temperature)"
          :stroke-width="10"
        />
        <div class="mt-2">
          <div class="text-sm text-gray-700">
            GPU温度
          </div>
          <div class="text-sm text-gray-900 font-medium">
            {{ temperature }}°C
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
