export default {
  editor: {
    label: {
      en: 'Email Builder',
      pt: 'Editor de Email',
    },
    icon: 'mail',
  },

  triggerEvents: [
    {
      name: 'editor-ready',
      label: { en: 'On editor ready', pt: 'Quando editor pronto' },
      event: {},
    },
    {
      name: 'design-loaded',
      label: { en: 'On design loaded', pt: 'Quando design carregado' },
      event: { design: {} },
    },
    {
      name: 'design-updated',
      label: { en: 'On design updated', pt: 'Quando design atualizado' },
      event: { type: '', item: {}, changes: {} },
    },
    {
      name: 'save',
      label: { en: 'On save', pt: 'Ao salvar' },
      event: {
        templateName: '',
        design: {},
        designJson: '',
        html: '',
      },
    },
    {
      name: 'back',
      label: { en: 'On back click', pt: 'Ao clicar em voltar' },
      event: {},
    },
    {
      name: 'name-changed',
      label: { en: 'On name changed', pt: 'Ao mudar nome' },
      event: { templateName: '' },
    },
  ],

  properties: {
    templateName: {
      label: { en: 'Template Name', pt: 'Nome do Template' },
      type: 'Text',
      section: 'settings',
      defaultValue: 'Novo Template',
      bindable: true,
    },

    initialDesign: {
      label: { en: 'Initial Design (JSON)', pt: 'Design Inicial (JSON)' },
      type: 'Text',
      section: 'settings',
      bindable: true,
      defaultValue: '',
      options: {
        placeholder: '{"counters":{},"body":{"rows":[]}}',
      },
    },

    logoUrl: {
      label: { en: 'Logo', pt: 'Logo' },
      type: 'Text',
      section: 'settings',
      defaultValue: '',
      bindable: true,
    },

    projectId: {
      label: { en: 'Unlayer Project ID', pt: 'ID do Projeto Unlayer' },
      type: 'Number',
      section: 'settings',
      defaultValue: 27666,
      bindable: true,
    },

    displayMode: {
      label: { en: 'Display Mode', pt: 'Modo de Exibicao' },
      type: 'TextSelect',
      section: 'settings',
      options: {
        options: [
          { value: 'email', label: 'Email' },
          { value: 'web', label: 'Web Page' },
          { value: 'popup', label: 'Popup' },
        ],
      },
      defaultValue: 'email',
      bindable: true,
    },

    height: {
      label: { en: 'Height', pt: 'Altura' },
      type: 'Length',
      section: 'settings',
      defaultValue: '100vh',
      bindable: true,
    },

    backgroundColor: {
      label: { en: 'Background Color', pt: 'Cor de Fundo' },
      type: 'Color',
      section: 'style',
      defaultValue: '#f8fafc',
      bindable: true,
    },
  },
}
