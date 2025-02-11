<script setup lang="ts">
import type { Edge } from '@vue-flow/core'
import BaseNode from '@/components/workflow/nodes/BaseNode.vue'
import { useWorkflowStore } from '@/stores/workflow'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MarkerType, Panel, useVueFlow, VueFlow } from '@vue-flow/core'
import { MiniMap } from '@vue-flow/minimap'
import { markRaw, nextTick, ref, watch } from 'vue'
import NodeSearch from './NodeSearch.vue'

const workflowStore = useWorkflowStore()
const nodeSearch = ref()

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: true,
  style: {
    strokeWidth: 2,
    stroke: '#b1b1b7',
  },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: '#b1b1b7',
  },
}

const {
  nodes,
  edges,
  onNodeDragStop,
  onConnect,
  onEdgesChange,
  onNodesChange,
  onNodeClick,
  onPaneClick,
  setNodes,
  setEdges,
  fitView,
} = useVueFlow({
  id: 'workflow-canvas',
  defaultViewport: { x: 0, y: 0, zoom: 1 },
  nodeTypes: {
    default: markRaw(BaseNode),
    preprocess: markRaw(BaseNode),
    train: markRaw(BaseNode),
    evaluate: markRaw(BaseNode),
    export: markRaw(BaseNode),
  },
  defaultEdgeOptions,
  fitView: true,
  snapToGrid: true,
  snapGrid: [15, 15],
  elevateNodesOnSelect: true,
})

// 修改初始化节点的逻辑
function initializeFlow() {
  const initialNodes = workflowStore.nodes.map(node => ({
    ...node,
    position: node.position || {
      x: Math.random() * 500,
      y: Math.random() * 300,
    },
    type: node.type || 'default',
    data: {
      ...node.data,
      label: node.data?.label || '新节点',
    },
  }))

  nextTick(() => {
    setNodes(initialNodes)
    setEdges(workflowStore.edges)
    setTimeout(() => {
      fitView({ padding: 0.2 })
    }, 100)
  })
}

initializeFlow()

// 修改节点变化的监听
watch(
  () => workflowStore.nodes,
  (newNodes) => {
    const updatedNodes = newNodes.map(node => ({
      ...node,
      position: node.position || {
        x: Math.random() * 500,
        y: Math.random() * 300,
      },
      type: node.type || 'default',
      data: {
        ...node.data,
        label: node.data?.label || '新节点',
      },
    }))
    nextTick(() => {
      setNodes(updatedNodes)
    })
  },
  { deep: true },
)

watch(
  () => workflowStore.edges,
  (newEdges) => {
    setEdges(newEdges)
  },
  { deep: true },
)

// 处理节点拖拽结束
function handleNodeDragStop(e: any) {
  onNodeDragStop(e)
  workflowStore.updateNodePosition(e.node.id, e.node.position)
}

// 处理连接创建
function handleConnect(params: any) {
  onConnect(params)
  workflowStore.addEdge(params)
}

// 处理边的变化
function handleEdgesChange(edgeChanges: any) {
  onEdgesChange(edgeChanges)
  workflowStore.updateEdges(edges.value)
}

// 处理节点的变化
function handleNodesChange(nodeChanges: any) {
  onNodesChange(nodeChanges)
  workflowStore.updateNodes(nodes.value)
}

// 处理节点点击
function handleNodeClick(e: any) {
  onNodeClick(e)
  const node = workflowStore.nodes.find(n => n.id === e.node.id)
  if (node)
    workflowStore.selectNode(node)
}

// 处理画布点击
function handlePaneClick() {
  onPaneClick()
  workflowStore.selectNode(null)
}

// 显示节点搜索
function showNodeSearch() {
  nodeSearch.value?.show()
}

// 计算边的样式
function getEdgeStyle(edge: Edge) {
  const sourceNode = workflowStore.nodes.find(n => n.id === edge.source)
  const targetNode = workflowStore.nodes.find(n => n.id === edge.target)

  if (!sourceNode?.data || !targetNode?.data)
    return defaultEdgeOptions.style

  // 根据节点状态设置边的样式
  if (
    sourceNode.data.status === 'error'
    || targetNode.data.status === 'error'
  ) {
    return {
      stroke: '#F56C6C',
      strokeWidth: 2,
    }
  }

  if (
    sourceNode.data.status === 'success'
    && targetNode.data.status === 'success'
  ) {
    return {
      stroke: '#67C23A',
      strokeWidth: 2,
    }
  }

  if (
    sourceNode.data.status === 'running'
    || targetNode.data.status === 'running'
  ) {
    return {
      stroke: '#409EFF',
      strokeWidth: 2,
      animation: 'flow 20s infinite linear',
    }
  }

  return defaultEdgeOptions.style
}
</script>

<template>
  <div class="flow-container">
    <VueFlow
      v-model="nodes"
      v-model:edges="edges"
      :default-viewport="{ x: 0, y: 0, zoom: 1 }"
      :fit-view-on-init="true"
      class="workflow-canvas"
      @node-drag-stop="handleNodeDragStop"
      @connect="handleConnect"
      @edges-change="handleEdgesChange"
      @nodes-change="handleNodesChange"
      @node-click="handleNodeClick"
      @pane-click="handlePaneClick"
    >
      <Background pattern-color="#aaa" gap="15" />
      <MiniMap />
      <Controls />
      <Panel position="top-left" class="node-panel">
        <el-button type="primary" icon="el-icon-plus" @click="showNodeSearch">
          添加节点
        </el-button>
      </Panel>

      <template #edge-label="{ edge }">
        <div
          class="edge-label nodrag"
          :style="{
            color: getEdgeStyle(edge).stroke,
          }"
        >
          <i v-if="edge.animated" class="el-icon-loading" />
        </div>
      </template>
    </VueFlow>

    <NodeSearch ref="nodeSearch" />
  </div>
</template>

<style>
.flow-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 500px;
}

.workflow-canvas {
  width: 100%;
  height: 100%;
  min-height: 500px;
  background: var(--el-bg-color);
}

.node-panel {
  padding: 8px;
  background: var(--el-bg-color);
  border-radius: 4px;
  box-shadow: var(--el-box-shadow-light);
}

.edge-label {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  background: var(--el-bg-color);
  border-radius: 4px;
  box-shadow: var(--el-box-shadow-light);
}

@keyframes flow {
  from {
    stroke-dashoffset: 100%;
  }
  to {
    stroke-dashoffset: 0%;
  }
}

.vue-flow__edge-path {
  stroke-dasharray: 5;
}

.vue-flow__edge.animated .vue-flow__edge-path {
  stroke-dasharray: 5;
  animation: flow 20s infinite linear;
}

.vue-flow__edge.selected .vue-flow__edge-path {
  stroke: var(--el-color-primary) !important;
  stroke-width: 2 !important;
}

.vue-flow__edge:hover .vue-flow__edge-path {
  stroke-width: 3 !important;
}

.vue-flow__edge.success .vue-flow__edge-path {
  stroke: var(--el-color-success) !important;
}

.vue-flow__edge.error .vue-flow__edge-path {
  stroke: var(--el-color-danger) !important;
}

.vue-flow__edge.running .vue-flow__edge-path {
  stroke: var(--el-color-primary) !important;
  stroke-dasharray: 5;
  animation: flow 20s infinite linear;
}
</style>
