<template>
  <div class="email-builder-wrapper" :style="wrapperStyle">
    <!-- Header -->
    <header class="email-header">
      <div class="header-left">
        <!-- Logo -->
        <div class="header-logo">
          <img
            v-if="logoUrl && !logoError"
            :src="logoUrl"
            alt="Logo"
            class="header-logo-img"
            @error="logoError = true"
          />
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#7c3aed" stroke-width="2"/>
            <polyline points="22,6 12,13 2,6" stroke="#7c3aed" stroke-width="2" fill="none"/>
          </svg>
        </div>
        <!-- Template Name (editable on double-click) -->
        <input
          v-if="isEditingTemplateName"
          ref="templateNameInputRef"
          v-model="editableTemplateName"
          class="header-template-name-input"
          @blur="handleTemplateNameBlur"
          @keydown.enter="handleTemplateNameBlur"
          @keydown.escape="cancelTemplateNameEdit"
        />
        <template v-else>
          <span
            class="header-template-name"
            @dblclick="startTemplateNameEdit"
            title="Clique duas vezes para editar"
          >{{ templateName }}</span>
          <button
            class="header-edit-btn"
            @click="startTemplateNameEdit"
            title="Editar nome do template"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        </template>
      </div>
      <div class="header-right">
        <button class="header-btn header-btn-secondary" @click="handleBack">
          <span>Voltar</span>
        </button>
        <button
          class="header-btn header-btn-primary"
          @click="handleSave"
          :disabled="isSaving"
        >
          <template v-if="isSaving">
            <span class="btn-loader"></span>
            <span>Salvando...</span>
          </template>
          <template v-else>
            <span>Salvar</span>
          </template>
        </button>
      </div>
    </header>

    <!-- Main Editor Container -->
    <div class="email-builder-container">
      <!-- Loading State -->
      <div v-if="!editorLoaded" class="editor-loading-state">
        <div v-if="editorError" class="editor-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>Erro ao carregar editor: {{ editorError }}</span>
          <button class="retry-btn" @click="initUnlayer">Tentar novamente</button>
        </div>
        <div v-else class="editor-loading">
          <div class="loading-spinner"></div>
          <span>Carregando editor de email...</span>
        </div>
      </div>

      <!-- Unlayer Editor Container -->
      <div
        ref="editorContainerRef"
        class="unlayer-editor"
        :class="{ 'unlayer-hidden': !editorLoaded }"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  content: { type: Object, default: () => ({}) },
  uid: { type: String, required: true },
})

const emit = defineEmits(['trigger-event'])

// ============================================
// LOCAL STATE (not WeWeb variables)
// ============================================

const editorLoaded = ref(false)
const editorError = ref(null)
const editorContainerRef = ref(null)
const logoError = ref(false)
const isSaving = ref(false)
const currentDesign = ref(null)
const currentHtml = ref('')
let unlayerInstance = null

// Template name editing
const isEditingTemplateName = ref(false)
const editableTemplateName = ref('')
const templateNameInputRef = ref(null)

// ============================================
// COMPUTED PROPERTIES
// ============================================

const templateName = computed(() => props.content?.templateName || 'Novo Template')

const logoUrl = computed(() => {
  return props.content?.logoUrl || 'https://rposipkylgypxzqucjae.supabase.co/storage/v1/object/public/flashcrm/logoflashSemFundo.png'
})

const height = computed(() => props.content?.height || '100vh')
const backgroundColor = computed(() => props.content?.backgroundColor || '#f8fafc')
const projectId = computed(() => props.content?.projectId || 27666)
const displayMode = computed(() => props.content?.displayMode || 'email')

const wrapperStyle = computed(() => ({
  height: height.value,
  backgroundColor: backgroundColor.value,
}))

// Default merge tags for FlashCRM
const mergeTags = computed(() => ({
  cliente: {
    name: 'Cliente',
    mergeTags: {
      nome: { name: 'Nome', value: '{{cliente.nome}}' },
      email: { name: 'Email', value: '{{cliente.email}}' },
      telefone: { name: 'Telefone', value: '{{cliente.telefone}}' },
    }
  },
  pedido: {
    name: 'Pedido',
    mergeTags: {
      numero: { name: 'Número', value: '{{pedido.numero}}' },
      valor: { name: 'Valor Total', value: '{{pedido.valor}}' },
      status: { name: 'Status', value: '{{pedido.status}}' },
    }
  },
  empresa: {
    name: 'Empresa',
    mergeTags: {
      nome: { name: 'Nome', value: '{{empresa.nome}}' },
    }
  },
  cupom: {
    name: 'Cupom',
    mergeTags: {
      codigo: { name: 'Código', value: '{{cupom.codigo}}' },
      desconto: { name: 'Desconto', value: '{{cupom.desconto}}' },
    }
  },
}))

// ============================================
// UNLAYER INITIALIZATION
// ============================================

const loadUnlayerScript = () => {
  return new Promise((resolve, reject) => {
    const frontWindow = wwLib.getFrontWindow()
    const frontDocument = wwLib.getFrontDocument()

    if (frontWindow.unlayer) {
      resolve(frontWindow.unlayer)
      return
    }

    const script = frontDocument.createElement('script')
    script.src = 'https://editor.unlayer.com/embed.js'
    script.async = true

    script.onload = () => {
      if (frontWindow.unlayer) {
        resolve(frontWindow.unlayer)
      } else {
        reject(new Error('Unlayer não foi carregado corretamente'))
      }
    }

    script.onerror = () => {
      reject(new Error('Falha ao carregar script do Unlayer'))
    }

    frontDocument.head.appendChild(script)
  })
}

const initUnlayer = async () => {
  try {
    editorError.value = null
    editorLoaded.value = false

    console.log('[EMAIL-BUILDER] Iniciando carregamento do Unlayer...')

    // Load Unlayer script
    const unlayer = await loadUnlayerScript()

    console.log('[EMAIL-BUILDER] Script carregado')

    await nextTick()

    const frontDocument = wwLib.getFrontDocument()

    // Use a unique ID to avoid conflicts
    const containerId = `unlayer-editor-${props.uid}`

    // Get our container ref and set the unique ID
    const container = editorContainerRef.value
    if (!container) {
      throw new Error('Container do editor não encontrado via ref')
    }

    // Set the unique ID on the container
    container.id = containerId

    console.log('[EMAIL-BUILDER] Container ID:', containerId)
    console.log('[EMAIL-BUILDER] Container dimensões:', container.offsetWidth, 'x', container.offsetHeight)

    // Verify element is accessible from frontDocument
    const verifyContainer = frontDocument.getElementById(containerId)
    console.log('[EMAIL-BUILDER] Container verificado no frontDocument:', !!verifyContainer)

    if (!verifyContainer) {
      throw new Error('Container não acessível no frontDocument')
    }

    // Build init options
    // NOTE: Localization requires Unlayer paid plan ($250+/month)
    // Setting locale: 'pt-BR' for future compatibility if subscription is added
    const initOptions = {
      id: containerId,
      projectId: projectId.value,
      displayMode: displayMode.value,
      locale: 'pt-BR', // Requires paid plan to work
      source: {
        name: 'flashcrm',
        version: '1.0.0'
      },
      appearance: {
        theme: 'light',
        panels: {
          tools: {
            dock: 'left'
          }
        }
      },
      mergeTags: mergeTags.value,
      features: {
        preview: true,
        imageEditor: true,
        stockImages: {
          enabled: true,
          safeSearch: true
        },
        userUploads: true,
      },
    }

    console.log('[EMAIL-BUILDER] Inicializando Unlayer (locale requer plano pago)')

    // Initialize Unlayer
    unlayer.init(initOptions)

    unlayerInstance = unlayer

    unlayer.addEventListener('editor:ready', () => {
      console.log('[EMAIL-BUILDER] Editor pronto!')
      editorLoaded.value = true

      const initialDesign = props.content?.initialDesign
      if (initialDesign) {
        loadDesign(initialDesign)
      }

      emit('trigger-event', {
        name: 'editor-ready',
        event: {}
      })
    })

    unlayer.addEventListener('design:loaded', (data) => {
      console.log('[EMAIL-BUILDER] Design carregado')
      currentDesign.value = data.design

      emit('trigger-event', {
        name: 'design-loaded',
        event: { design: data.design }
      })
    })

    unlayer.addEventListener('design:updated', (data) => {
      emit('trigger-event', {
        name: 'design-updated',
        event: {
          type: data.type,
          item: data.item,
          changes: data.changes
        }
      })
    })

  } catch (error) {
    console.error('[EMAIL-BUILDER] Erro ao inicializar Unlayer:', error)
    editorError.value = error.message
    editorLoaded.value = false
  }
}

// ============================================
// EDITOR METHODS
// ============================================

const loadDesign = (design) => {
  if (!unlayerInstance) {
    console.warn('[EMAIL-BUILDER] Editor não inicializado')
    return
  }

  try {
    const designObj = typeof design === 'string' ? JSON.parse(design) : design
    unlayerInstance.loadDesign(designObj)
  } catch (error) {
    console.error('[EMAIL-BUILDER] Erro ao carregar design:', error)
  }
}

const exportHtml = () => {
  return new Promise((resolve, reject) => {
    if (!unlayerInstance) {
      reject(new Error('Editor não inicializado'))
      return
    }

    unlayerInstance.exportHtml((data) => {
      const { design, html } = data
      currentDesign.value = design
      currentHtml.value = html
      resolve({ design, html })
    })
  })
}

// ============================================
// TEMPLATE NAME EDITING
// ============================================

const startTemplateNameEdit = () => {
  editableTemplateName.value = templateName.value
  isEditingTemplateName.value = true
  nextTick(() => {
    templateNameInputRef.value?.focus()
    templateNameInputRef.value?.select()
  })
}

const handleTemplateNameBlur = () => {
  const newName = editableTemplateName.value.trim()
  if (newName && newName !== templateName.value) {
    emit('trigger-event', {
      name: 'name-changed',
      event: { templateName: newName }
    })
  }
  isEditingTemplateName.value = false
}

const cancelTemplateNameEdit = () => {
  isEditingTemplateName.value = false
  editableTemplateName.value = templateName.value
}

// ============================================
// HEADER ACTIONS
// ============================================

const handleBack = () => {
  emit('trigger-event', {
    name: 'back',
    event: {}
  })
}

const handleSave = async () => {
  try {
    isSaving.value = true

    const { design, html } = await exportHtml()

    emit('trigger-event', {
      name: 'save',
      event: {
        templateName: templateName.value,
        design: design,
        designJson: JSON.stringify(design),
        html: html,
      }
    })

  } catch (error) {
    console.error('[EMAIL-BUILDER] Erro ao salvar:', error)
  } finally {
    isSaving.value = false
  }
}

// ============================================
// WATCHERS
// ============================================

watch(() => props.content?.logoUrl, () => {
  logoError.value = false
})

watch(() => props.content?.initialDesign, (newDesign) => {
  if (newDesign && editorLoaded.value) {
    loadDesign(newDesign)
  }
})

// ============================================
// LIFECYCLE
// ============================================

onMounted(() => {
  console.log('[EMAIL-BUILDER] Componente montado')
  initUnlayer()
})

onBeforeUnmount(() => {
  console.log('[EMAIL-BUILDER] Componente desmontado')
  unlayerInstance = null
})
</script>

<style lang="scss" scoped>
.email-builder-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 700px;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Header Styles */
.email-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  width: 100%;
  box-sizing: border-box;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-logo {
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-logo svg {
  width: 24px;
  height: 24px;
}

.header-logo-img {
  height: 28px;
  width: auto;
  max-width: 140px;
  object-fit: contain;
}

.header-template-name {
  font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #1A1A1A;
  letter-spacing: -0.01em;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.15s ease;
}

.header-template-name:hover {
  background-color: #f3f4f6;
}

.header-template-name-input {
  font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #1A1A1A;
  letter-spacing: -0.01em;
  padding: 4px 8px;
  border: 1px solid #7c3aed;
  border-radius: 4px;
  outline: none;
  background: #ffffff;
  min-width: 150px;
}

.header-edit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #9ca3af;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.header-edit-btn:hover {
  color: #6b7280;
  background: #f3f4f6;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 19px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.header-btn svg {
  flex-shrink: 0;
}

.header-btn-secondary {
  background: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
}

.header-btn-secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.header-btn-primary {
  background: #7c3aed;
  color: #ffffff;
  border: none;
}

.header-btn-primary:hover:not(:disabled) {
  background: #6d28d9;
}

.header-btn-primary:disabled {
  background: #c4b5fd;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-loader {
  width: 14px;
  height: 14px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.email-builder-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  position: relative;
  min-height: 600px;
  height: 100%;
  overflow: hidden;
}

.unlayer-editor {
  width: 100%;
  height: 100%;
  min-height: 600px;
  flex: 1;

  &.unlayer-hidden {
    position: absolute;
    visibility: hidden;
    pointer-events: none;
  }

  // Force Unlayer iframe to fill container
  :deep(iframe) {
    width: 100% !important;
    height: 100% !important;
    min-height: 600px !important;
    border: none !important;
  }
}

.editor-loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 600px;
  gap: 16px;
  flex: 1;
}

.editor-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #64748b;
  font-size: 14px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #7c3aed;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.editor-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #ef4444;
  font-size: 14px;
  text-align: center;
  padding: 24px;
}

.retry-btn {
  padding: 8px 16px;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #6d28d9;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
