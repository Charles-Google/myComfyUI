import type { Edge, Node, XYPosition } from '@vue-flow/core'
import {
  getNodeType,
  validateConnection,
  validateConnectionLimits,
  validateNodeParams,
} from '@/components/workflow/nodes'
import { initialWorkflow } from '@/config/initialWorkflow'
import { ElMessage } from 'element-plus'
import { nanoid } from 'nanoid'
import { defineStore } from 'pinia'

export interface WorkflowConfig {
  nodes: Node[]
  edges: Edge[]
  version: string
}

export interface WorkflowState {
  nodes: Node[]
  edges: Edge[]
  selectedNode: Node | null
  isRunning: boolean
  logs: string[]
  executionOrder: string[]
  currentExecutingNode: string | null
  history: {
    past: WorkflowConfig[]
    future: WorkflowConfig[]
  }
}

// 重命名接口以避免未使用警告
interface _WorkflowActions {
  saveToHistory: () => void
  undo: () => void
  redo: () => void
  addNode: (type?: string) => void
  removeNode: (nodeId: string) => void
  duplicateNode: (nodeId: string) => void
  selectAllNodes: () => void
  updateNodePosition: (nodeId: string, position: XYPosition) => void
  addEdge: (params: any) => void
  updateNodes: (nodes: Node[]) => void
  updateEdges: (edges: Edge[]) => void
  selectNode: (node: Node | null) => void
  updateNodeParams: (nodeId: string, params: Record<string, any>) => void
  updateNodeStatus: (
    nodeId: string,
    status: 'idle' | 'running' | 'success' | 'error',
  ) => void
  resetNodeStatuses: () => void
  addLog: (message: string) => void
  clearLogs: () => void
  startWorkflow: () => Promise<void>
  stopWorkflow: () => void
  exportConfig: () => WorkflowConfig
  importConfig: (config: WorkflowConfig) => void
  validateWorkflow: () => { valid: boolean, errors: string[] }
  detectCycle: (edges: Edge[]) => boolean
  getTopologicalSort: () => Node[] | null
  executeNodes: (nodes: Node[]) => Promise<void>
  executeNode: (node: Node) => Promise<void>
}

export const useWorkflowStore = defineStore('workflow', {
  state: (): WorkflowState => ({
    nodes: initialWorkflow.nodes,
    edges: initialWorkflow.edges,
    selectedNode: null,
    isRunning: false,
    logs: [],
    executionOrder: [],
    currentExecutingNode: null,
    history: {
      past: [],
      future: [],
    },
  }),

  actions: {
    // 历史记录管理
    saveToHistory() {
      const currentState: WorkflowConfig = {
        nodes: JSON.parse(JSON.stringify(this.nodes)),
        edges: JSON.parse(JSON.stringify(this.edges)),
        version: '1.0.0',
      }
      this.history.past.push(currentState)
      this.history.future = []
    },

    undo() {
      if (this.history.past.length === 0)
        return

      const currentState: WorkflowConfig = {
        nodes: JSON.parse(JSON.stringify(this.nodes)),
        edges: JSON.parse(JSON.stringify(this.edges)),
        version: '1.0.0',
      }
      this.history.future.push(currentState)

      const previousState = this.history.past.pop()!
      this.nodes = previousState.nodes
      this.edges = previousState.edges
      this.selectedNode = null
    },

    redo() {
      if (this.history.future.length === 0)
        return

      const currentState: WorkflowConfig = {
        nodes: JSON.parse(JSON.stringify(this.nodes)),
        edges: JSON.parse(JSON.stringify(this.edges)),
        version: '1.0.0',
      }
      this.history.past.push(currentState)

      const nextState = this.history.future.pop()!
      this.nodes = nextState.nodes
      this.edges = nextState.edges
      this.selectedNode = null
    },

    // 节点操作
    addNode(type = 'default') {
      const nodeType = getNodeType(type)
      if (!nodeType) {
        ElMessage.error('无效的节点类型')
        return
      }

      // 计算新节点的位置
      const offset = 50
      const basePosition = { x: 100, y: 100 }
      const existingPositions = this.nodes.map(n => n.position)
      const newPosition = { ...basePosition }

      // 避免节点重叠
      while (
        existingPositions.some(
          p =>
            Math.abs(p.x - newPosition.x) < offset
            && Math.abs(p.y - newPosition.y) < offset,
        )
      ) {
        newPosition.x += offset
        if (newPosition.x > 800) {
          newPosition.x = basePosition.x
          newPosition.y += offset
        }
      }

      const newNode: Node = {
        id: `node-${nanoid()}`,
        type: nodeType.type,
        position: newPosition,
        data: {
          label: nodeType.label,
          type: nodeType.type,
          params: { ...nodeType.defaultParams },
          status: 'idle',
        },
      }

      this.nodes.push(newNode)
      this.saveToHistory()
    },

    removeNode(nodeId: string) {
      // 删除相关的边
      this.edges = this.edges.filter(
        edge => edge.source !== nodeId && edge.target !== nodeId,
      )
      // 删除节点
      this.nodes = this.nodes.filter(node => node.id !== nodeId)
      // 如果删除的是当前选中的节点，取消选中
      if (this.selectedNode?.id === nodeId)
        this.selectedNode = null

      this.saveToHistory()
    },

    duplicateNode(nodeId: string) {
      const sourceNode = this.nodes.find(n => n.id === nodeId)
      if (!sourceNode)
        return

      const newNode: Node = {
        ...JSON.parse(JSON.stringify(sourceNode)),
        id: `node-${nanoid()}`,
        position: {
          x: sourceNode.position.x + 50,
          y: sourceNode.position.y + 50,
        },
      }

      this.nodes.push(newNode)
      this.saveToHistory()
    },

    selectAllNodes() {
      // Vue Flow 不直接支持多选，但我们可以在未来添加这个功能
      ElMessage.info('多选功能即将推出')
    },

    updateNodePosition(nodeId: string, position: XYPosition) {
      const node = this.nodes.find(n => n.id === nodeId)
      if (node) {
        node.position = position
        this.saveToHistory()
      }
    },

    addEdge(params: any) {
      const sourceNode = this.nodes.find(n => n.id === params.source)
      const targetNode = this.nodes.find(n => n.id === params.target)

      if (!sourceNode?.data?.type || !targetNode?.data?.type) {
        ElMessage.error('无效的连接：节点类型未定义')
        return
      }

      // 验证连接类型
      const connectionValidation = validateConnection(
        sourceNode.data.type,
        targetNode.data.type,
      )
      if (!connectionValidation.valid) {
        ElMessage.error(connectionValidation.error)
        return
      }

      // 计算当前连接数
      const sourceConnections = this.edges.filter(
        e => e.source === params.source,
      ).length
      const targetConnections = this.edges.filter(
        e => e.target === params.target,
      ).length

      // 验证连接数限制
      const limitsValidation = validateConnectionLimits(
        sourceNode.data.type,
        targetNode.data.type,
        sourceConnections,
        targetConnections,
      )
      if (!limitsValidation.valid) {
        ElMessage.error(limitsValidation.error)
        return
      }

      // 检查是否会形成循环
      const tempEdges = [
        ...this.edges,
        {
          id: `edge-temp-${nanoid()}`,
          source: params.source,
          target: params.target,
          type: 'default',
        },
      ]
      if (this.detectCycle(tempEdges)) {
        ElMessage.error('不能创建循环连接')
        return
      }

      const newEdge: Edge = {
        id: `edge-${nanoid()}`,
        source: params.source,
        target: params.target,
        type: 'default',
      }
      this.edges.push(newEdge)
      this.saveToHistory()
    },

    updateNodes(nodes: Node[]) {
      this.nodes = [...nodes]
      this.saveToHistory()
    },

    updateEdges(edges: Edge[]) {
      this.edges = [...edges]
      this.saveToHistory()
    },

    selectNode(node: Node | null) {
      this.selectedNode = node
    },

    updateNodeParams(nodeId: string, params: Record<string, any>) {
      const node = this.nodes.find(n => n.id === nodeId)
      if (!node || !node.data)
        return

      // 验证参数
      const validation = validateNodeParams(node.data.type, {
        ...node.data.params,
        ...params,
      })
      if (!validation.valid) {
        ElMessage.error(validation.errors.join('\n'))
        return
      }

      node.data.params = { ...node.data.params, ...params }
      this.saveToHistory()
    },

    updateNodeStatus(
      nodeId: string,
      status: 'idle' | 'running' | 'success' | 'error',
    ) {
      const node = this.nodes.find(n => n.id === nodeId)
      if (node && node.data)
        node.data.status = status
    },

    resetNodeStatuses() {
      this.nodes.forEach((node) => {
        if (node.data)
          node.data.status = 'idle'
      })
    },

    addLog(message: string) {
      this.logs.push(`[${new Date().toLocaleTimeString()}] ${message}`)
    },

    clearLogs() {
      this.logs = []
    },

    async startWorkflow() {
      // 验证工作流
      const validation = this.validateWorkflow()
      if (!validation.valid) {
        ElMessage.error(`工作流验证失败：\n${validation.errors.join('\n')}`)
        return
      }

      this.isRunning = true
      this.clearLogs()
      this.resetNodeStatuses()
      this.addLog('工作流开始运行...')

      // 获取拓扑排序
      const sortedNodes = this.getTopologicalSort()
      if (!sortedNodes) {
        this.addLog('错误：工作流中存在循环依赖')
        this.stopWorkflow()
        return
      }

      this.executionOrder = sortedNodes.map(node => node.id)
      await this.executeNodes(sortedNodes)
    },

    stopWorkflow() {
      this.isRunning = false
      this.currentExecutingNode = null
      this.addLog('工作流停止运行')
    },

    // 导出工作流配置
    exportConfig(): WorkflowConfig {
      const config = {
        nodes: this.nodes,
        edges: this.edges,
        version: '1.0.0',
      }

      // 创建下载
      const blob = new Blob([JSON.stringify(config, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `workflow-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)

      return config
    },

    // 导入工作流配置
    importConfig(config: WorkflowConfig) {
      if (config.version !== '1.0.0') {
        throw new Error('不支持的配置版本')
      }

      this.nodes = config.nodes
      this.edges = config.edges
      this.selectedNode = null
      this.clearLogs()
      this.resetNodeStatuses()
      this.addLog('工作流配置已导入')
      this.saveToHistory()
    },

    // 验证工作流
    validateWorkflow(): { valid: boolean, errors: string[] } {
      const errors: string[] = []

      // 检查节点是否有效
      for (const node of this.nodes) {
        if (!node.data?.type) {
          errors.push(`节点 ${node.id} 类型无效`)
          continue
        }

        // 验证节点参数
        const validation = validateNodeParams(node.data.type, node.data.params)
        if (!validation.valid) {
          errors.push(
            `节点 ${node.id} (${node.data.label}) 参数无效：${validation.errors.join(', ')}`,
          )
        }
      }

      // 检查边的连接是否有效
      for (const edge of this.edges) {
        const sourceNode = this.nodes.find(n => n.id === edge.source)
        const targetNode = this.nodes.find(n => n.id === edge.target)

        if (!sourceNode) {
          errors.push(`边 ${edge.id} 的源节点不存在`)
          continue
        }
        if (!targetNode) {
          errors.push(`边 ${edge.id} 的目标节点不存在`)
          continue
        }

        // 验证连接类型
        const connectionValidation = validateConnection(
          sourceNode.data.type,
          targetNode.data.type,
        )
        if (!connectionValidation.valid)
          errors.push(`边 ${edge.id}: ${connectionValidation.error}`)

        // 验证连接数限制
        const sourceConnections = this.edges.filter(
          e => e.source === edge.source,
        ).length
        const targetConnections = this.edges.filter(
          e => e.target === edge.target,
        ).length

        const limitsValidation = validateConnectionLimits(
          sourceNode.data.type,
          targetNode.data.type,
          sourceConnections,
          targetConnections,
        )
        if (!limitsValidation.valid)
          errors.push(`边 ${edge.id}: 连接数限制无效`)
      }

      // 检查是否存在环
      if (this.detectCycle(this.edges)) {
        errors.push('工作流中存在循环依赖')
      }

      return {
        valid: errors.length === 0,
        errors,
      }
    },

    // 检测环
    detectCycle(edges: Edge[]): boolean {
      const visited = new Set<string>()
      const recursionStack = new Set<string>()

      const dfs = (nodeId: string): boolean => {
        visited.add(nodeId)
        recursionStack.add(nodeId)

        const outgoingEdges = edges.filter(e => e.source === nodeId)
        for (const edge of outgoingEdges) {
          if (!visited.has(edge.target)) {
            if (dfs(edge.target))
              return true
          }
          else if (recursionStack.has(edge.target)) {
            return true
          }
        }

        recursionStack.delete(nodeId)
        return false
      }

      for (const node of this.nodes) {
        if (!visited.has(node.id)) {
          if (dfs(node.id))
            return true
        }
      }

      return false
    },

    // 获取拓扑排序
    getTopologicalSort(): Node[] | null {
      const result: Node[] = []
      const visited = new Set<string>()
      const temp = new Set<string>()

      const visit = (nodeId: string): boolean => {
        if (temp.has(nodeId))
          return false // 检测到环

        if (!visited.has(nodeId)) {
          temp.add(nodeId)

          const outgoingEdges = this.edges.filter(e => e.source === nodeId)
          for (const edge of outgoingEdges) {
            if (!visit(edge.target))
              return false
          }

          temp.delete(nodeId)
          visited.add(nodeId)
          result.unshift(this.nodes.find(n => n.id === nodeId)!)
        }
        return true
      }

      for (const node of this.nodes) {
        if (!visit(node.id))
          return null // 存在环
      }

      return result
    },

    // 执行节点
    async executeNodes(nodes: Node[]) {
      for (const node of nodes) {
        if (!this.isRunning)
          break
        await this.executeNode(node)
      }
    },

    // 执行单个节点
    async executeNode(node: Node) {
      const delay = (ms: number) =>
        new Promise(resolve => setTimeout(resolve, ms))
      this.currentExecutingNode = node.id
      this.updateNodeStatus(node.id, 'running')
      this.addLog(`开始执行节点: ${node.id}`)

      try {
        // 模拟节点执行
        await delay(1000)
        this.updateNodeStatus(node.id, 'success')
        this.addLog(`节点 ${node.id} 执行成功`)
      }
      catch (error) {
        this.updateNodeStatus(node.id, 'error')
        this.addLog(`节点 ${node.id} 执行失败: ${error}`)
        throw error
      }
      finally {
        this.currentExecutingNode = null
      }
    },
  },
})
