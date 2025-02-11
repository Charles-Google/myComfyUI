import type { Edge, Node } from '@vue-flow/core'

export const initialNodes: Node[] = [
  {
    id: 'node-1',
    type: 'preprocess',
    position: { x: 100, y: 100 },
    data: {
      label: '数据预处理',
      type: 'preprocess',
      params: {
        batch_size: 32,
        shuffle: true,
        normalize: true,
        augmentation: false,
      },
      status: 'idle',
    },
  },
  {
    id: 'node-2',
    type: 'train',
    position: { x: 400, y: 100 },
    data: {
      label: '模型训练',
      type: 'train',
      params: {
        learning_rate: 0.001,
        epochs: 10,
        optimizer: 'adam',
        loss: 'categorical_crossentropy',
      },
      status: 'idle',
    },
  },
  {
    id: 'node-3',
    type: 'evaluate',
    position: { x: 700, y: 100 },
    data: {
      label: '模型评估',
      type: 'evaluate',
      params: {
        metrics: ['accuracy', 'precision', 'recall', 'f1'],
        test_size: 0.2,
        random_state: 42,
      },
      status: 'idle',
    },
  },
]

export const initialEdges: Edge[] = [
  {
    id: 'edge-1',
    source: 'node-1',
    target: 'node-2',
    type: 'default',
  },
  {
    id: 'edge-2',
    source: 'node-2',
    target: 'node-3',
    type: 'default',
  },
]

export const initialWorkflow = {
  nodes: initialNodes,
  edges: initialEdges,
  version: '1.0.0',
}
