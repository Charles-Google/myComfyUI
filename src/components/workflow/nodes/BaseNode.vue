<script setup lang="ts">
import { useWorkflowStore } from '@/stores/workflow'
import { Handle } from '@vue-flow/core'
import { computed, onMounted } from 'vue'

const props = withDefaults(
  defineProps<{
    id: string
    data?: {
      label?: string
      type?: string
      params?: Record<string, any>
      status?: 'idle' | 'running' | 'success' | 'error'
    }
  }>(),
  {
    data: () => ({
      label: '新节点',
      type: 'default',
      params: {},
      status: 'idle',
    }),
  },
)

const workflowStore = useWorkflowStore()

function handleNodeClick() {
  const node = workflowStore.nodes.find(n => n.id === props.id)
  if (node)
    workflowStore.selectNode(node)
}

const nodeStatus = computed(() => props.data?.status || 'idle')

function getNodeStyle() {
  const isSelected = workflowStore.selectedNode?.id === props.id

  const baseStyle = {
    borderRadius: '6px',
    padding: '12px',
    background: 'var(--el-bg-color)',
    minWidth: '180px',
    boxShadow: 'var(--el-box-shadow-light)',
  }

  // 根据节点类型设置不同的边框颜色
  const typeColors = {
    default: 'var(--el-border-color)',
    preprocess: 'var(--el-color-success)',
    train: 'var(--el-color-primary)',
    evaluate: 'var(--el-color-warning)',
    export: 'var(--el-color-info)',
  }

  // 根据状态设置不同的样式
  const statusStyles = {
    idle: {
      border: `2px solid ${typeColors[props.data?.type as keyof typeof typeColors] || typeColors.default}`,
      opacity: 1,
    },
    running: {
      border: '2px solid var(--el-color-primary)',
      animation: 'node-pulse 2s infinite',
    },
    success: {
      border: '2px solid var(--el-color-success)',
      opacity: 1,
    },
    error: {
      border: '2px solid var(--el-color-danger)',
      opacity: 1,
    },
  }

  return {
    ...baseStyle,
    ...(isSelected ? { boxShadow: '0 0 0 2px var(--el-color-primary)' } : {}),
    ...statusStyles[nodeStatus.value],
  }
}

function getStatusIcon() {
  const icons = {
    idle: 'el-icon-loading',
    running: 'el-icon-loading',
    success: 'el-icon-check',
    error: 'el-icon-close',
  }
  return icons[nodeStatus.value]
}

function getStatusColor() {
  const colors = {
    idle: 'var(--el-text-color-secondary)',
    running: 'var(--el-color-primary)',
    success: 'var(--el-color-success)',
    error: 'var(--el-color-danger)',
  }
  return colors[nodeStatus.value]
}

function getParamValue(value: any) {
  if (value === undefined || value === null)
    return ''
  if (Array.isArray(value))
    return value.join(', ')
  if (typeof value === 'boolean')
    return value ? '是' : '否'
  return value.toString()
}

onMounted(() => {
  // 确保节点有初始位置
  if (!props.data?.position) {
    workflowStore.updateNodePosition(props.id, {
      x: Math.random() * 500,
      y: Math.random() * 300,
    })
  }
})
</script>

<template>
  <div
    :style="getNodeStyle()"
    class="node-container"
    tabindex="0"
    role="button"
    :aria-label="data?.label"
    @click="handleNodeClick"
    @keydown.enter="handleNodeClick"
  >
    <Handle
      type="target"
      position="top"
      class="handle"
      :style="{ background: getStatusColor() }"
    />
    <div class="node-content">
      <div class="node-header">
        <div class="flex items-center">
          <el-tag
            size="small"
            :type="data?.type === 'default' ? '' : 'success'"
            class="mr-2"
          >
            {{ data?.type }}
          </el-tag>
          <span class="node-label flex-1">{{ data?.label }}</span>
        </div>
        <div class="status-indicator" :style="{ color: getStatusColor() }">
          <i :class="getStatusIcon()" />
        </div>
      </div>
      <div
        v-if="data?.params && Object.keys(data.params).length"
        class="node-params mt-3"
      >
        <div v-for="(value, key) in data.params" :key="key" class="param-item">
          <span class="param-label">{{ key }}:</span>
          <span class="param-value">{{ getParamValue(value) }}</span>
        </div>
      </div>
    </div>
    <Handle
      type="source"
      position="bottom"
      class="handle"
      :style="{ background: getStatusColor() }"
    />
  </div>
</template>

<style>
.node-container {
  transition: all 0.2s ease;
  cursor: pointer;
}

.node-container:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--el-color-primary) !important;
}

.node-content {
  position: relative;
  z-index: 1;
}

.node-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.node-label {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.status-indicator {
  margin-left: 8px;
}

.param-item {
  display: flex;
  align-items: center;
  margin-top: 4px;
  font-size: 12px;
}

.param-label {
  color: var(--el-text-color-secondary);
  margin-right: 4px;
}

.param-value {
  color: var(--el-text-color-primary);
}

.handle {
  width: 8px;
  height: 8px;
  background: var(--el-border-color);
  border-radius: 50%;
  border: 2px solid var(--el-bg-color);
}

@keyframes node-pulse {
  0% {
    box-shadow: 0 0 0 0 var(--el-color-primary-light-5);
  }
  70% {
    box-shadow: 0 0 0 6px transparent;
  }
  100% {
    box-shadow: 0 0 0 0 transparent;
  }
}
</style>
