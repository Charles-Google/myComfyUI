<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)

const shortcuts = [
  {
    key: 'Ctrl/Cmd + S',
    description: '导出工作流',
  },
  {
    key: 'Delete/Backspace',
    description: '删除选中的节点',
  },
  {
    key: 'Space',
    description: '运行/停止工作流',
  },
  {
    key: 'Escape',
    description: '取消选中节点',
  },
  {
    key: 'Ctrl/Cmd + Z',
    description: '撤销',
  },
  {
    key: 'Ctrl/Cmd + Shift + Z',
    description: '重做',
  },
  {
    key: 'Ctrl/Cmd + A',
    description: '全选节点（即将推出）',
  },
  {
    key: 'Ctrl/Cmd + D',
    description: '复制选中节点',
  },
]

defineExpose({
  show: () => {
    visible.value = true
  },
})
</script>

<template>
  <el-dialog
    v-model="visible"
    title="快捷键帮助"
    width="500px"
  >
    <div class="shortcuts-list">
      <div
        v-for="shortcut in shortcuts"
        :key="shortcut.key"
        class="shortcut-item"
      >
        <kbd class="shortcut-key">{{ shortcut.key }}</kbd>
        <span class="shortcut-description">{{ shortcut.description }}</span>
      </div>
    </div>
    <template #footer>
      <el-button @click="visible = false">
        关闭
      </el-button>
    </template>
  </el-dialog>
</template>

<style>
.shortcuts-list {
  @apply space-y-4;
}

.shortcut-item {
  @apply flex items-center;
}

.shortcut-key {
  @apply px-3 py-1 bg-gray-100 rounded font-mono text-sm min-w-[120px] text-center mr-4;
}

.shortcut-description {
  @apply text-gray-700;
}
</style>
