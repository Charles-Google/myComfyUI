<script setup lang="ts">
import { Download, Upload } from '@element-plus/icons-vue'
import WorkflowLayout from '../components/workflow/WorkflowLayout.vue'
import { useWorkflowShortcuts } from '../composables/useWorkflowShortcuts'

// 启用快捷键
useWorkflowShortcuts()
</script>

<template>
  <div class="workflow-page">
    <el-container>
      <el-header class="header">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <h1 class="text-xl text-gray-800 font-medium">
              机器学习工作流
            </h1>
          </div>
          <div class="flex items-center space-x-3">
            <el-button type="primary" plain>
              <template #icon>
                <el-icon><Download /></el-icon>
              </template>
              导出工作流
            </el-button>
            <el-button>
              <template #icon>
                <el-icon><Upload /></el-icon>
              </template>
              导入工作流
            </el-button>
          </div>
        </div>
      </el-header>

      <el-container class="main-container">
        <el-main class="main-content">
          <WorkflowLayout />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style>
.workflow-page {
  @apply h-screen w-screen overflow-hidden bg-gray-50;
}

.header {
  @apply bg-white/80 backdrop-blur-sm border-b border-gray-100 px-6 flex items-center shadow-sm;
  height: 64px;
}

.main-container {
  @apply h-[calc(100vh-64px)];
}

.main-content {
  @apply p-0;
}

/* Element Plus 按钮样式优化 */
:deep(.el-button) {
  @apply transition-all duration-200;
}

:deep(.el-button:not(.el-button--primary)) {
  @apply border-gray-200 text-gray-700 hover:text-gray-900;
}

:deep(.el-button--primary) {
  @apply border-blue-500/20 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20;
}
</style>
