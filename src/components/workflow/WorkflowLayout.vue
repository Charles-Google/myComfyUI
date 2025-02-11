<script setup lang="ts">
import { useWorkflowStore } from '@/stores/workflow'
import {
  FullScreen,
  Moon,
  Refresh,
  Sunny,
  ZoomIn,
  ZoomOut,
} from '@element-plus/icons-vue'
import { Background } from '@vue-flow/background'
import { ControlButton, Controls } from '@vue-flow/controls'
import { Panel, useVueFlow, VueFlow } from '@vue-flow/core'
import { MiniMap } from '@vue-flow/minimap'
import { ref } from 'vue'
import DeviceMonitor from './DeviceMonitor.vue'
import TrainingMetrics from './TrainingMetrics.vue'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

// 节点类型定义
const nodeTypes = [
  { label: '数据预处理', value: '数据预处理' },
  { label: '模型训练', value: '模型训练' },
  { label: '模型评估', value: '模型评估' },
]

// 暗黑模式
const isDark = ref(false)

// 节点列表
const elements = ref<any[]>([])
const workflowStore = useWorkflowStore()

// 初始化VueFlow
const {
  onNodeDragStop,
  onConnect,
  addEdges,
  fitView,
  zoomIn,
  zoomOut,
  setViewport,
} = useVueFlow({
  defaultEdgeOptions: {
    type: 'smoothstep',
    animated: true,
    style: {
      stroke: '#b1b1b7',
      strokeWidth: 2,
    },
  },
})

// 添加节点
function handleAddNode(type: string) {
  const newNode = {
    id: `node-${Date.now()}`,
    type: 'custom',
    position: { x: 100, y: 100 },
    data: {
      label: type,
      type,
      status: 'idle' as const,
    },
  }

  elements.value.push(newNode)
}

// 节点拖拽结束
onNodeDragStop(({ node }) => {
  workflowStore.updateNodePosition(node.id, node.position)
})

// 处理连线
onConnect((connection) => {
  addEdges([
    {
      ...connection,
      animated: true,
      style: { stroke: '#b1b1b7' },
    },
  ])
})

// 获取状态文本
function getStatusText(status: string) {
  const statusMap: Record<string, string> = {
    idle: '待运行',
    running: '运行中',
    success: '已完成',
    error: '错误',
  }
  return statusMap[status] || status
}

// 重置视图
function resetView() {
  setViewport({ x: 0, y: 0, zoom: 1.5 })
}

// 切换主题
function toggleTheme() {
  isDark.value = !isDark.value
}
</script>

<template>
  <div class="h-full flex bg-gray-50" :class="{ dark: isDark }">
    <!-- 左侧工作流画布区域 -->
    <div class="flex-1 border-r border-gray-100">
      <VueFlow
        v-model="elements"
        :class="{ dark: isDark }"
        class="vue-flow-wrapper h-full"
        :default-zoom="1.5"
        :min-zoom="0.2"
        :max-zoom="4"
        :snap-to-grid="true"
        :snap-grid="[15, 15]"
      >
        <!-- 背景 -->
        <Background :pattern-color="isDark ? '#aaa' : '#ddd'" :gap="15" />

        <!-- 工具栏 -->
        <div class="workflow-toolbar">
          <el-button-group class="shadow-sm">
            <el-button
              v-for="type in nodeTypes"
              :key="type.value"
              type="info"
              plain
              @click="handleAddNode(type.value)"
            >
              {{ type.label }}
            </el-button>
          </el-button-group>
        </div>

        <!-- 自定义节点模板 -->
        <template #node-custom="nodeProps">
          <div
            class="workflow-node"
            :class="[
              nodeProps.data.type,
              `status-${nodeProps.data.status}`,
              { dark: isDark },
            ]"
          >
            <div class="workflow-node-header">
              <span class="workflow-node-title">{{
                nodeProps.data.label
              }}</span>
            </div>
            <div class="workflow-node-body">
              <div class="workflow-node-status">
                状态: {{ getStatusText(nodeProps.data.status) }}
              </div>
            </div>
          </div>
        </template>

        <!-- 控制面板 -->
        <Controls>
          <ControlButton title="放大" @click="zoomIn">
            <el-icon><ZoomIn /></el-icon>
          </ControlButton>
          <ControlButton title="缩小" @click="zoomOut">
            <el-icon><ZoomOut /></el-icon>
          </ControlButton>
          <ControlButton title="适应视图" @click="fitView">
            <el-icon><FullScreen /></el-icon>
          </ControlButton>
          <ControlButton title="重置视图" @click="resetView">
            <el-icon><Refresh /></el-icon>
          </ControlButton>
          <ControlButton title="切换主题" @click="toggleTheme">
            <el-icon>
              <Moon v-if="isDark" />
              <Sunny v-else />
            </el-icon>
          </ControlButton>
        </Controls>

        <!-- 小地图 -->
        <Panel position="bottom-right">
          <MiniMap class="bg-white/80 backdrop-blur-sm" />
        </Panel>
      </VueFlow>
    </div>

    <!-- 右侧监控面板 -->
    <div
      class="h-full w-96 overflow-y-auto"
      :class="isDark ? 'bg-gray-800' : 'bg-white'"
    >
      <div
        class="sticky top-0 z-10 border-b border-gray-100 p-4"
        :class="isDark ? 'bg-gray-800' : 'bg-white'"
      >
        <h2
          class="text-xl font-medium"
          :class="isDark ? 'text-gray-100' : 'text-gray-800'"
        >
          监控面板
        </h2>
      </div>

      <div class="p-4 space-y-4">
        <DeviceMonitor />
        <TrainingMetrics />
      </div>
    </div>
  </div>
</template>

<style scoped>
.vue-flow-wrapper :deep(.vue-flow__node) {
  @apply transition-all duration-200;
}

.workflow-toolbar {
  @apply absolute left-4 top-4 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-lg;
}

.workflow-node {
  @apply bg-white rounded-lg shadow-sm border border-gray-100 w-48 transition-all duration-200 hover:shadow-md;
}

.workflow-node.dark {
  @apply bg-gray-800 border-gray-700;
}

.workflow-node-header {
  @apply px-4 py-2 rounded-t-lg bg-gradient-to-r;
}

.workflow-node-title {
  @apply text-sm font-medium text-white;
}

.workflow-node-body {
  @apply p-3;
}

.workflow-node-status {
  @apply text-xs text-gray-500;
}

.workflow-node.dark .workflow-node-status {
  @apply text-gray-400;
}

/* 节点状态样式 */
.workflow-node.status-idle .workflow-node-header {
  @apply from-gray-400 to-gray-500;
}

.workflow-node.status-running .workflow-node-header {
  @apply from-blue-400 to-blue-500;
}

.workflow-node.status-success .workflow-node-header {
  @apply from-green-400 to-green-500;
}

.workflow-node.status-error .workflow-node-header {
  @apply from-red-400 to-red-500;
}

:deep(.vue-flow__minimap) {
  height: 120px;
  width: 160px;
}

:deep(.vue-flow__controls) {
  @apply bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100;
}

.dark :deep(.vue-flow__controls) {
  @apply bg-gray-800/80 border-gray-700;
}

:deep(.vue-flow__controls button) {
  @apply bg-transparent hover:bg-gray-50 border-0 text-gray-700;
}

.dark :deep(.vue-flow__controls button) {
  @apply hover:bg-gray-700 text-gray-300;
}

:deep(.vue-flow__edge-path) {
  @apply transition-all duration-200;
}

:deep(.vue-flow__edge.selected .vue-flow__edge-path) {
  @apply stroke-blue-500;
}

:deep(.vue-flow__connection-path) {
  @apply stroke-blue-500;
}

.dark :deep(.vue-flow__edge-path) {
  @apply stroke-gray-500;
}

.dark :deep(.vue-flow__background) {
  @apply bg-gray-900;
}
</style>
