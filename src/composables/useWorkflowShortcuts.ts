import { useWorkflowStore } from '@/stores/workflow'
import { useEventListener } from '@vueuse/core'
import { onMounted } from 'vue'

export function useWorkflowShortcuts() {
  const workflowStore = useWorkflowStore()

  const handleKeyDown = (e: KeyboardEvent) => {
    // 如果在输入框中，不处理快捷键
    if (
      e.target instanceof HTMLInputElement
      || e.target instanceof HTMLTextAreaElement
    ) {
      return
    }

    // Ctrl/Cmd + Z: 撤销
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      workflowStore.undo()
    }

    // Ctrl/Cmd + Shift + Z: 重做
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
      e.preventDefault()
      workflowStore.redo()
    }

    // Delete: 删除选中节点
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (workflowStore.selectedNode) {
        e.preventDefault()
        workflowStore.removeNode(workflowStore.selectedNode.id)
      }
    }

    // Ctrl/Cmd + D: 复制选中节点
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      if (workflowStore.selectedNode) {
        e.preventDefault()
        workflowStore.duplicateNode(workflowStore.selectedNode.id)
      }
    }

    // Escape: 取消选中
    if (e.key === 'Escape') {
      workflowStore.selectNode(null)
    }

    // Space: 开始/停止工作流
    if (e.key === ' ' && !workflowStore.isRunning) {
      e.preventDefault()
      workflowStore.startWorkflow()
    }
  }

  onMounted(() => {
    useEventListener(window, 'keydown', handleKeyDown)
  })
}
