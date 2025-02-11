<script setup lang="ts">
import { getNodeType, getNodeTypes } from '@/components/workflow/nodes'
import { useWorkflowStore } from '@/stores/workflow'
import { computed } from 'vue'

const workflowStore = useWorkflowStore()
const selectedNode = computed(() => workflowStore.selectedNode)
const nodeTypes = getNodeTypes()

function updateNodeType(type: string) {
  if (!selectedNode.value)
    return
  const nodeType = getNodeType(type)
  if (!nodeType)
    return

  selectedNode.value.data.type = type
  selectedNode.value.data.label = nodeType.label
  selectedNode.value.data.params = { ...nodeType.defaultParams }
  workflowStore.updateNodes(workflowStore.nodes)
}

function updateNodeLabel(label: string) {
  if (!selectedNode.value)
    return
  selectedNode.value.data.label = label
  workflowStore.updateNodes(workflowStore.nodes)
}

function updateNodeParams(key: string, value: any) {
  if (!selectedNode.value)
    return
  workflowStore.updateNodeParams(selectedNode.value.id, { [key]: value })
}
</script>

<template>
  <el-drawer
    v-model="selectedNode"
    title="节点参数"
    size="300px"
    :with-header="true"
    direction="rtl"
  >
    <template v-if="selectedNode">
      <div class="params-container p-4">
        <el-form label-position="top">
          <el-form-item label="节点类型">
            <el-select
              v-model="selectedNode.data.type"
              class="w-full"
              @change="updateNodeType"
            >
              <el-option
                v-for="type in nodeTypes"
                :key="type.type"
                :label="type.label"
                :value="type.type"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="节点名称">
            <el-input
              v-model="selectedNode.data.label"
              @change="updateNodeLabel"
            />
          </el-form-item>

          <template v-if="selectedNode.data.type === 'preprocess'">
            <el-form-item label="批次大小">
              <el-input-number
                v-model="selectedNode.data.params.batch_size"
                :min="1"
                :max="512"
                @change="val => updateNodeParams('batch_size', val)"
              />
            </el-form-item>
            <el-form-item label="随机打乱">
              <el-switch
                v-model="selectedNode.data.params.shuffle"
                @change="val => updateNodeParams('shuffle', val)"
              />
            </el-form-item>
          </template>

          <template v-if="selectedNode.data.type === 'train'">
            <el-form-item label="学习率">
              <el-input-number
                v-model="selectedNode.data.params.learning_rate"
                :min="0.0001"
                :max="1"
                :step="0.0001"
                @change="val => updateNodeParams('learning_rate', val)"
              />
            </el-form-item>
            <el-form-item label="训练轮数">
              <el-input-number
                v-model="selectedNode.data.params.epochs"
                :min="1"
                :max="1000"
                @change="val => updateNodeParams('epochs', val)"
              />
            </el-form-item>
            <el-form-item label="优化器">
              <el-select
                v-model="selectedNode.data.params.optimizer"
                class="w-full"
                @change="val => updateNodeParams('optimizer', val)"
              >
                <el-option label="Adam" value="adam" />
                <el-option label="SGD" value="sgd" />
                <el-option label="RMSprop" value="rmsprop" />
              </el-select>
            </el-form-item>
          </template>

          <template v-if="selectedNode.data.type === 'evaluate'">
            <el-form-item label="评估指标">
              <el-select
                v-model="selectedNode.data.params.metrics"
                class="w-full"
                multiple
                @change="val => updateNodeParams('metrics', val)"
              >
                <el-option label="准确率" value="accuracy" />
                <el-option label="精确率" value="precision" />
                <el-option label="召回率" value="recall" />
                <el-option label="F1分数" value="f1" />
              </el-select>
            </el-form-item>
          </template>

          <template v-if="selectedNode.data.type === 'export'">
            <el-form-item label="导出格式">
              <el-select
                v-model="selectedNode.data.params.format"
                class="w-full"
                @change="val => updateNodeParams('format', val)"
              >
                <el-option label="ONNX" value="onnx" />
                <el-option label="TensorFlow SavedModel" value="tf" />
                <el-option label="TorchScript" value="torchscript" />
              </el-select>
            </el-form-item>
            <el-form-item label="量化">
              <el-switch
                v-model="selectedNode.data.params.quantize"
                @change="val => updateNodeParams('quantize', val)"
              />
            </el-form-item>
          </template>
        </el-form>
      </div>
    </template>
  </el-drawer>
</template>

<style>
.params-container {
  @apply h-full overflow-y-auto;
}
</style>
