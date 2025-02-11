<script setup lang="ts">
import { useWorkflowStore } from '@/stores/workflow'
import { computed } from 'vue'

const workflowStore = useWorkflowStore()

const executionProgress = computed(() => {
  if (!workflowStore.executionOrder.length)
    return 0
  const completedNodes = workflowStore.nodes.filter(
    node => node.data?.status === 'success',
  ).length
  return (completedNodes / workflowStore.executionOrder.length) * 100
})

const currentNodeLabel = computed(() => {
  if (!workflowStore.currentExecutingNode)
    return ''
  const node = workflowStore.nodes.find(
    n => n.id === workflowStore.currentExecutingNode,
  )
  return node?.data?.label || ''
})

const statusClass = computed(() => {
  if (!workflowStore.isRunning)
    return ''
  const hasError = workflowStore.nodes.some(
    node => node.data?.status === 'error',
  )
  if (hasError)
    return 'error'
  return 'running'
})
</script>

<template>
  <div
    v-if="workflowStore.isRunning || executionProgress > 0"
    class="execution-progress"
    :class="statusClass"
  >
    <div class="progress-info">
      <div class="flex items-center">
        <span class="progress-label">执行进度</span>
        <span class="progress-percentage">{{ executionProgress.toFixed(0) }}%</span>
      </div>
      <div v-if="currentNodeLabel" class="current-node">
        正在执行: {{ currentNodeLabel }}
      </div>
    </div>
    <el-progress
      :percentage="executionProgress"
      :status="statusClass || 'success'"
      :stroke-width="8"
      :show-text="false"
    />
  </div>
</template>

<style>
.execution-progress {
  @apply fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 w-96 z-50 transition-all duration-300;
}

.execution-progress.running {
  @apply border-l-4 border-blue-500;
}

.execution-progress.error {
  @apply border-l-4 border-red-500;
}

.progress-info {
  @apply mb-2;
}

.progress-label {
  @apply text-sm font-medium text-gray-700;
}

.progress-percentage {
  @apply ml-2 text-sm font-semibold text-blue-600;
}

.current-node {
  @apply text-xs text-gray-500 mt-1;
}

.execution-progress.error .progress-percentage {
  @apply text-red-600;
}

.execution-progress.running .progress-percentage {
  @apply text-blue-600;
}
</style>
