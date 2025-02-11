import type { Component } from 'vue'
import { markRaw } from 'vue'
import BaseNode from './BaseNode.vue'

export interface NodeTypeDefinition {
  type: string
  label: string
  component: Component
  defaultParams: Record<string, any>
  validateParams?: (params: Record<string, any>) => {
    valid: boolean
    errors: string[]
  }
  allowedInputTypes?: string[] // 允许作为输入的节点类型
  allowedOutputTypes?: string[] // 允许作为输出的节点类型
  maxInputs?: number // 最大输入连接数
  maxOutputs?: number // 最大输出连接数
}

const nodeTypes: NodeTypeDefinition[] = [
  {
    type: 'default',
    label: '默认节点',
    component: markRaw(BaseNode),
    defaultParams: {},
  },
  {
    type: 'preprocess',
    label: '数据预处理',
    component: markRaw(BaseNode),
    defaultParams: {
      batch_size: 32,
      shuffle: true,
      normalize: true,
      augmentation: false,
    },
    allowedOutputTypes: ['train', 'evaluate'],
    maxOutputs: 1,
  },
  {
    type: 'train',
    label: '模型训练',
    component: markRaw(BaseNode),
    defaultParams: {
      learning_rate: 0.001,
      epochs: 10,
      optimizer: 'adam',
      loss: 'categorical_crossentropy',
    },
    allowedInputTypes: ['preprocess'],
    allowedOutputTypes: ['evaluate', 'export'],
    maxInputs: 1,
    maxOutputs: 1,
  },
  {
    type: 'evaluate',
    label: '模型评估',
    component: markRaw(BaseNode),
    defaultParams: {
      metrics: ['accuracy', 'precision', 'recall', 'f1'],
      test_size: 0.2,
      random_state: 42,
    },
    allowedInputTypes: ['train', 'preprocess'],
    maxInputs: 1,
  },
  {
    type: 'export',
    label: '模型导出',
    component: markRaw(BaseNode),
    defaultParams: {
      format: 'onnx',
      quantize: false,
      optimize: true,
    },
    allowedInputTypes: ['train'],
    maxInputs: 1,
  },
]

export const getNodeTypes = () => nodeTypes

export function getNodeType(type: string) {
  return nodeTypes.find(t => t.type === type)
}

export function validateConnection(
  sourceType: string,
  targetType: string,
): { valid: boolean, error?: string } {
  const sourceNodeType = getNodeType(sourceType)
  const targetNodeType = getNodeType(targetType)

  if (!sourceNodeType || !targetNodeType) {
    return {
      valid: false,
      error: '无效的节点类型',
    }
  }

  if (
    sourceNodeType.allowedOutputTypes
    && !sourceNodeType.allowedOutputTypes.includes(targetType)
  ) {
    return {
      valid: false,
      error: `${sourceNodeType.label} 不能连接到 ${targetNodeType.label}`,
    }
  }

  if (
    targetNodeType.allowedInputTypes
    && !targetNodeType.allowedInputTypes.includes(sourceType)
  ) {
    return {
      valid: false,
      error: `${targetNodeType.label} 不能接收来自 ${sourceNodeType.label} 的输入`,
    }
  }

  return { valid: true }
}

export function validateConnectionLimits(
  sourceType: string,
  targetType: string,
  sourceConnections: number,
  targetConnections: number,
): { valid: boolean, error?: string } {
  const sourceNodeType = getNodeType(sourceType)
  const targetNodeType = getNodeType(targetType)

  if (!sourceNodeType || !targetNodeType) {
    return {
      valid: false,
      error: '无效的节点类型',
    }
  }

  if (
    sourceNodeType.maxOutputs !== undefined
    && sourceConnections >= sourceNodeType.maxOutputs
  ) {
    return {
      valid: false,
      error: `${sourceNodeType.label} 最多只能有 ${sourceNodeType.maxOutputs} 个输出`,
    }
  }

  if (
    targetNodeType.maxInputs !== undefined
    && targetConnections >= targetNodeType.maxInputs
  ) {
    return {
      valid: false,
      error: `${targetNodeType.label} 最多只能有 ${targetNodeType.maxInputs} 个输入`,
    }
  }

  return { valid: true }
}

export function validateNodeParams(
  type: string,
  params: Record<string, any>,
): { valid: boolean, errors: string[] } {
  const nodeType = getNodeType(type)
  if (!nodeType) {
    return {
      valid: false,
      errors: ['无效的节点类型'],
    }
  }

  if (nodeType.validateParams) {
    return nodeType.validateParams(params)
  }

  return { valid: true, errors: [] }
}

export default {
  BaseNode,
}
