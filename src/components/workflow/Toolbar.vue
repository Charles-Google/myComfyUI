<script setup lang="ts">
import type { WorkflowConfig } from '@/stores/workflow'
import { useWorkflowStore } from '@/stores/workflow'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'
import ShortcutsHelp from './ShortcutsHelp.vue'

const workflowStore = useWorkflowStore()
const fileInput = ref<HTMLInputElement>()
const shortcutsHelp = ref()

// 导出工作流
function handleExport() {
  const config = workflowStore.exportConfig()
  const blob = new Blob([JSON.stringify(config, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `workflow-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 导入工作流
function handleImport(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length)
    return

  const file = input.files[0]
  const reader = new FileReader()

  reader.onload = (e) => {
    try {
      const config = JSON.parse(e.target?.result as string) as WorkflowConfig
      workflowStore.importConfig(config)
      ElMessage.success('工作流导入成功')
    }
    catch {
      ElMessage.error('工作流导入失败：无效的配置文件')
    }
    finally {
      if (fileInput.value)
        fileInput.value.value = ''
    }
  }

  reader.readAsText(file)
}

// 验证工作流
function handleValidate() {
  const result = workflowStore.validateWorkflow()
  if (result.valid) {
    ElMessage.success('工作流验证通过')
  }
  else {
    ElMessage.error(`工作流验证失败：\n${result.errors.join('\n')}`)
  }
}

// 显示快捷键帮助
function showShortcutsHelp() {
  shortcutsHelp.value?.show()
}
</script>

<template>
  <div class="toolbar">
    <el-button-group>
      <el-button
        type="primary"
        :icon="
          workflowStore.isRunning ? 'el-icon-video-pause' : 'el-icon-video-play'
        "
        @click="
          workflowStore.isRunning
            ? workflowStore.stopWorkflow()
            : workflowStore.startWorkflow()
        "
      >
        {{ workflowStore.isRunning ? "停止" : "运行" }}
      </el-button>

      <el-button type="warning" icon="el-icon-check" @click="handleValidate">
        验证
      </el-button>

      <el-button type="success" icon="el-icon-download" @click="handleExport">
        导出
      </el-button>

      <el-button type="info" icon="el-icon-upload" @click="fileInput?.click()">
        导入
        <input
          ref="fileInput"
          type="file"
          accept=".json"
          class="hidden"
          @change="handleImport"
        >
      </el-button>

      <el-button icon="el-icon-question" @click="showShortcutsHelp">
        快捷键
      </el-button>
    </el-button-group>

    <ShortcutsHelp ref="shortcutsHelp" />
  </div>
</template>

<style>
.toolbar {
  @apply p-4 border-b border-gray-200;
}
</style>
