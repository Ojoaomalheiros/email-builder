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
      <!-- Save Error Toast -->
      <div v-if="saveError" class="save-error-toast">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ saveError }}</span>
        <button class="toast-close" @click="saveError = null">&times;</button>
      </div>
    </header>

    <!-- Back Confirmation Modal -->
    <div v-if="showBackConfirm" class="modal-overlay" @click.self="cancelBack">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Sair sem salvar?</h3>
          <button class="modal-close" @click="cancelBack">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p>Suas alterações ainda não foram salvas. Se você sair agora, todas as mudanças serão perdidas.</p>
        </div>
        <div class="modal-footer">
          <button class="modal-btn modal-btn-secondary" @click="cancelBack">Continuar editando</button>
          <button class="modal-btn modal-btn-danger" @click="confirmBack">Sair sem salvar</button>
        </div>
      </div>
    </div>

    <!-- Save Success Modal -->
    <div v-if="showSaveSuccess" class="modal-overlay" @click.self="closeSaveSuccess">
      <div class="modal-content">
        <div class="modal-header modal-header-success">
          <h3>Template salvo!</h3>
          <button class="modal-close" @click="closeSaveSuccess">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <p>O template <strong>{{ templateName }}</strong> foi salvo com sucesso.</p>
        </div>
        <div class="modal-footer">
          <button class="modal-btn modal-btn-primary" @click="navigateToTemplates">Ir para Templates</button>
        </div>
      </div>
    </div>

    <!-- Save Loading Overlay -->
    <div v-if="isSaving" class="loading-overlay">
      <div class="loading-spinner-large"></div>
      <p class="loading-message">Salvando template...</p>
    </div>

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
const saveError = ref(null)
const currentDesign = ref(null)
const currentHtml = ref('')
let unlayerInstance = null

// Template name editing
const isEditingTemplateName = ref(false)
const editableTemplateName = ref('')
const templateNameInputRef = ref(null)

// Modal states
const showBackConfirm = ref(false)
const showSaveSuccess = ref(false)
const hasChanges = ref(false)

// URL param loaded template
const loadedTemplateId = ref(null)
const loadedTemplateName = ref(null)
const loadedTemplateAssunto = ref(null)
const isLoadingTemplate = ref(false)

// ============================================
// COMPUTED PROPERTIES
// ============================================

const templateName = computed(() => loadedTemplateName.value || props.content?.templateName || 'Novo Template')

const logoUrl = computed(() => {
  return props.content?.logoUrl || 'https://rposipkylgypxzqucjae.supabase.co/storage/v1/object/public/flashcrm/logoflashSemFundo.png'
})

const height = computed(() => props.content?.height || '100vh')
const backgroundColor = computed(() => props.content?.backgroundColor || '#f8fafc')
const projectId = computed(() => props.content?.projectId || 27666)
const displayMode = computed(() => props.content?.displayMode || 'email')
const emailWidth = computed(() => props.content?.emailWidth || 600)

// New props for Supabase save
const empresaId = computed(() => props.content?.empresaId)
const templateId = computed(() => loadedTemplateId.value || props.content?.templateId)
const assunto = computed(() => loadedTemplateAssunto.value || props.content?.assunto || '')
const templatesPagePath = computed(() => props.content?.templatesPagePath || '/templates')

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
// URL PARAM PARSING & TEMPLATE LOADING
// ============================================

const parseUrlParams = () => {
  try {
    const win = typeof wwLib !== 'undefined' ? wwLib.getFrontWindow() : window
    const urlParams = new URLSearchParams(win?.location?.search || '')
    return urlParams.get('id') ? parseInt(urlParams.get('id'), 10) : null
  } catch (e) {
    console.error('[EMAIL-BUILDER] Error parsing URL params:', e)
    return null
  }
}

const loadTemplateFromDb = async (id) => {
  try {
    isLoadingTemplate.value = true
    console.log('[EMAIL-BUILDER] Carregando template do banco, id:', id)

    const supabase = wwLib.wwPlugins?.supabase?.instance
    if (!supabase) {
      console.error('[EMAIL-BUILDER] Plugin Supabase não encontrado')
      return null
    }

    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('[EMAIL-BUILDER] Erro ao buscar template:', error)
      return null
    }

    console.log('[EMAIL-BUILDER] Template carregado:', data?.nome)
    return data
  } catch (error) {
    console.error('[EMAIL-BUILDER] Erro ao carregar template:', error)
    return null
  } finally {
    isLoadingTemplate.value = false
  }
}

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

    unlayer.addEventListener('editor:ready', async () => {
      console.log('[EMAIL-BUILDER] Editor pronto!')
      editorLoaded.value = true

      // Set email body width (default 600px, similar to Klaviyo)
      const width = emailWidth.value || 600
      console.log('[EMAIL-BUILDER] Definindo largura do email:', width, 'px')
      unlayer.setBodyValues({
        contentWidth: `${width}px`,
      })

      // Priority 1: Load template from URL ?id= param
      const urlTemplateId = parseUrlParams()
      if (urlTemplateId) {
        console.log('[EMAIL-BUILDER] Template ID encontrado na URL:', urlTemplateId)
        const template = await loadTemplateFromDb(urlTemplateId)
        if (template) {
          loadedTemplateId.value = template.id
          loadedTemplateName.value = template.nome
          loadedTemplateAssunto.value = template.assunto

          // Design JSON is stored in descricao field
          if (template.descricao) {
            try {
              const design = typeof template.descricao === 'string'
                ? JSON.parse(template.descricao)
                : template.descricao
              unlayer.loadDesign(design)
              console.log('[EMAIL-BUILDER] Design carregado do banco')
            } catch (e) {
              console.error('[EMAIL-BUILDER] Erro ao parsear design JSON:', e)
            }
          }

          emit('trigger-event', {
            name: 'template-loaded',
            event: { template }
          })
        }
      }
      // Priority 2: Load from props (WeWeb binding)
      else {
        const initialDesign = props.content?.initialDesign
        if (initialDesign) {
          loadDesign(initialDesign)
        }
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
      hasChanges.value = true
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

const fixEmailHeight = (html) => {
  // Add height:100% to html/body/table so background fills the entire email client viewport
  let fixed = html
    .replace(/<html/i, '<html style="height:100%;" ')
    .replace(/<body([^>]*?)style="([^"]*?)"/i, '<body$1style="$2;height:100%"')
    .replace(
      /(<table[^>]*?role="presentation"[^>]*?style="[^"]*?)(")/i,
      '$1;height:100%$2'
    )
  return fixed
}

const exportHtml = () => {
  return new Promise((resolve, reject) => {
    if (!unlayerInstance) {
      reject(new Error('Editor não inicializado'))
      return
    }

    unlayerInstance.exportHtml((data) => {
      const { design, html } = data
      const fixedHtml = fixEmailHeight(html)
      currentDesign.value = design
      currentHtml.value = fixedHtml
      resolve({ design, html: fixedHtml })
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
    loadedTemplateName.value = newName
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
  console.log('[EMAIL-BUILDER] handleBack() chamado')
  console.log('[EMAIL-BUILDER] hasChanges:', hasChanges.value)

  if (hasChanges.value) {
    console.log('[EMAIL-BUILDER] Mostrando modal de confirmação')
    showBackConfirm.value = true
  } else {
    navigateBack()
  }
}

const cancelBack = () => {
  console.log('[EMAIL-BUILDER] cancelBack() - fechando modal')
  showBackConfirm.value = false
}

const confirmBack = () => {
  console.log('[EMAIL-BUILDER] confirmBack() - saindo sem salvar')
  showBackConfirm.value = false
  navigateBack()
}

const navigateBack = () => {
  console.log('[EMAIL-BUILDER] navigateBack() para:', templatesPagePath.value)

  // Emit event for any workflow that might be listening
  emit('trigger-event', {
    name: 'back',
    event: {}
  })

  // Navigate to templates page
  try {
    const frontWindow = wwLib.getFrontWindow()

    if (frontWindow?.wwLib?.goTo) {
      console.log('[EMAIL-BUILDER] Usando frontWindow.wwLib.goTo()')
      frontWindow.wwLib.goTo(templatesPagePath.value)
    } else if (wwLib?.goTo) {
      console.log('[EMAIL-BUILDER] Usando wwLib.goTo()')
      wwLib.goTo(templatesPagePath.value)
    } else {
      console.log('[EMAIL-BUILDER] Fallback: window.location.href')
      frontWindow.location.href = templatesPagePath.value
    }
  } catch (error) {
    console.error('[EMAIL-BUILDER] Erro ao navegar:', error)
    try {
      const frontWindow = wwLib.getFrontWindow()
      frontWindow.location.href = templatesPagePath.value
    } catch (e) {
      console.error('[EMAIL-BUILDER] Erro no fallback:', e)
    }
  }
}

const closeSaveSuccess = () => {
  showSaveSuccess.value = false
}

const navigateToTemplates = () => {
  showSaveSuccess.value = false
  navigateBack()
}

const handleSave = async () => {
  try {
    isSaving.value = true
    saveError.value = null

    // Validate empresaId
    if (!empresaId.value) {
      throw new Error('ID da empresa não configurado')
    }

    const { design, html } = await exportHtml()
    const designJson = JSON.stringify(design)

    // Get Supabase instance
    const supabase = wwLib.wwPlugins?.supabase?.instance
    if (!supabase) {
      throw new Error('Plugin Supabase não encontrado')
    }

    // Prepare template data
    const templateData = {
      empresa_id: empresaId.value,
      nome: templateName.value,
      conteudo: html,
      descricao: designJson, // Store design JSON in descricao for reload capability
      tipo: 'email',
      assunto: assunto.value || templateName.value,
      ativo: true,
      updated_at: new Date().toISOString(),
    }

    let result
    if (templateId.value) {
      // Update existing template
      console.log('[EMAIL-BUILDER] Atualizando template:', templateId.value)
      result = await supabase
        .from('message_templates')
        .update(templateData)
        .eq('id', templateId.value)
        .eq('empresa_id', empresaId.value)
        .select()
        .single()
    } else {
      // Insert new template
      console.log('[EMAIL-BUILDER] Criando novo template')
      result = await supabase
        .from('message_templates')
        .insert(templateData)
        .select()
        .single()
    }

    if (result.error) {
      throw new Error(result.error.message)
    }

    console.log('[EMAIL-BUILDER] Template salvo:', result.data)

    // Reset changes flag
    hasChanges.value = false

    // Emit save event (for any workflow that might be listening)
    emit('trigger-event', {
      name: 'save',
      event: {
        templateId: result.data.id,
        templateName: templateName.value,
        design: design,
        designJson: designJson,
        html: html,
        success: true,
      }
    })

    // Show success modal
    console.log('[EMAIL-BUILDER] Mostrando modal de sucesso')
    showSaveSuccess.value = true

  } catch (error) {
    console.error('[EMAIL-BUILDER] Erro ao salvar:', error)
    saveError.value = error.message

    emit('trigger-event', {
      name: 'save',
      event: {
        success: false,
        error: error.message,
      }
    })
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
  position: relative;
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

/* Save Error Toast */
.save-error-toast {
  position: absolute;
  top: 100%;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  margin-top: 8px;
  animation: slideDown 0.2s ease-out;
}

.save-error-toast svg {
  flex-shrink: 0;
}

.toast-close {
  background: none;
  border: none;
  color: #dc2626;
  font-size: 18px;
  cursor: pointer;
  padding: 0 0 0 8px;
  line-height: 1;
}

.toast-close:hover {
  color: #b91c1c;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

/* ============================================
   MODAL STYLES
   ============================================ */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: modalSlideIn 0.2s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1A1A1A;
  }
}

.modal-header-success h3 {
  color: #16a34a;
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.1s;

  svg {
    width: 18px;
    height: 18px;
    color: #6b7280;
  }

  &:hover {
    background: #f3f4f6;
  }
}

.modal-body {
  padding: 20px;

  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: #374151;
  }
}

.success-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;

  svg {
    width: 48px;
    height: 48px;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.modal-btn {
  padding: 9px 19px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.modal-btn-secondary {
  background: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;

  &:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }
}

.modal-btn-danger {
  background: #dc2626;
  color: #ffffff;
  border: none;

  &:hover {
    background: #b91c1c;
  }
}

.modal-btn-primary {
  background: #7c3aed;
  color: #ffffff;
  border: none;

  &:hover {
    background: #6d28d9;
  }
}

/* ============================================
   LOADING OVERLAY
   ============================================ */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2001;
  gap: 16px;
}

.loading-spinner-large {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top-color: #7c3aed;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-message {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  margin: 0;
}
</style>
