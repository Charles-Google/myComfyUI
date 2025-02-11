<script setup lang="ts">
import { getNodeTypes } from '@/components/workflow/nodes'
import { useWorkflowStore } from '@/stores/workflow'
import { computed, ref } from 'vue'

const visible = ref(false)
const searchQuery = ref('')
const workflowStore = useWorkflowStore()
const nodeTypes = getNodeTypes()

const filteredNodeTypes = computed(() => {
  const query = searchQuery.value.toLowerCase()
  if (!query)
    return nodeTypes

  return nodeTypes.filter((type) => {
    return type.label.toLowerCase().includes(query)
      || type.type.toLowerCase().includes(query)
  })
})

function handleNodeSelect(type: string) {
  workflowStore.addNode(type)
  visible.value = false
  searchQuery.value = ''
}

defineExpose({
  show: () => {
    visible.value = true
    // 在下一个 tick 后聚焦搜索框
    setTimeout(() => {
      const input = document.querySelector('.node-search-input') as HTMLInputElement
      if (input)
        input.focus()
    }, 100)
  },
})
</script>

<template>
  <el-dialog
    v-model="visible"
    title="添加节点"
    width="500px"
    :close-on-click-modal="true"
    :show-close="true"
  >
    <div class="node-search">
      <el-input
        v-model="searchQuery"
        class="node-search-input"
        placeholder="搜索节点类型..."
        clearable
      >
        <template #prefix>
          <i class="el-icon-search" />
        </template>
      </el-input>

      <div class="node-types-list">
        <div
          v-for="type in filteredNodeTypes"
          :key="type.type"
          class="node-type-item"
          role="button"
          tabindex="0"
          @click="handleNodeSelect(type.type)"
          @keydown.enter="handleNodeSelect(type.type)"
        >
          <div class="node-type-info">
            <span class="node-type-label">{{ type.label }}</span>
            <span class="node-type-id">{{ type.type }}</span>
          </div>
          <div class="node-type-params">
            <template v-if="Object.keys(type.defaultParams).length">
              <el-tag
                v-for="(value, key) in type.defaultParams"
                :key="key"
                size="small"
                class="param-tag"
              >
                {{ key }}
              </el-tag>
            </template>
            <span v-else class="no-params">
              无参数
            </span>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<style>
.node-search {
  @apply space-y-4;
}

.node-types-list {
  @apply space-y-2 mt-4 max-h-[400px] overflow-y-auto;
}

.node-type-item {
  @apply p-3 rounded-lg bg-gray-50 hover:bg-blue-50 cursor-pointer transition-colors duration-200;
}

.node-type-item:focus {
  @apply outline-none ring-2 ring-blue-500;
}

.node-type-info {
  @apply flex items-center justify-between mb-2;
}

.node-type-label {
  @apply text-gray-800 font-medium;
}

.node-type-id {
  @apply text-sm text-gray-500;
}

.node-type-params {
  @apply flex flex-wrap gap-2;
}

.param-tag {
  @apply text-xs;
}

.no-params {
  @apply text-xs text-gray-400 italic;
}
</style>
