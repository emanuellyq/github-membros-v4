// 🔧 CONFIGURAÇÃO DA HOTMART
// Configure suas credenciais aqui ou use variáveis de ambiente

// 🔧 FUNÇÃO PARA OBTER VARIÁVEL DE AMBIENTE COM FALLBACKS
const getEnvVar = (key: string): string => {
  // Primeiro tenta a variável com prefixo VITE_
  const viteVar = import.meta.env[`VITE_${key}`];
  if (viteVar) return viteVar;
  
  // Depois tenta sem prefixo (para compatibilidade)
  const directVar = import.meta.env[key];
  if (directVar) return directVar;
  
  // Tenta variações do nome
  const variations = [
    `VITE_YOUR_${key}`,
    `YOUR_${key}`,
    `HOTMART_${key}`,
    `VITE_HOTMART_${key}`
  ];
  
  for (const variation of variations) {
    const value = import.meta.env[variation];
    if (value) return value;
  }
  
  return '';
};

export const HOTMART_CONFIG = {
  // 🔧 CREDENCIAIS DA HOTMART - Múltiplas fontes
  CLIENT_ID: getEnvVar('HOTMART_CLIENT_ID') || getEnvVar('YOUR_HOTMART_CLIENT_ID') || '',
  CLIENT_SECRET: getEnvVar('HOTMART_CLIENT_SECRET') || getEnvVar('YOUR_HOTMART_CLIENT_SECRET') || '',
  BASIC_TOKEN: getEnvVar('HOTMART_BASIC_TOKEN') || getEnvVar('YOUR_HOTMART_BASIC_TOKEN') || '',
  
  // 🔧 ID DO SEU PRODUTO
  PRODUCT_ID: getEnvVar('PRODUCT_ID') || getEnvVar('YOUR_PRODUCT_ID') || '',
  
  // 🔧 URLs DA API (conforme documentação oficial)
  API_BASE_URL: 'https://developers.hotmart.com',
  OAUTH_URL: 'https://api-sec-vlc.hotmart.com',
  
  // 🔧 CONFIGURAÇÕES DE BUSCA
  MAX_RESULTS_PER_PAGE: 50, // Máximo permitido pela API
  DEFAULT_TRANSACTION_STATUS: 'APPROVED'
};

// 🔧 TIPOS DE STATUS ACEITOS (conforme documentação)
export const ACCEPTED_STATUSES = [
  'APPROVED',
  'COMPLETE',
  'COMPLETED'
];

// 🔧 FUNÇÃO PARA VALIDAR CONFIGURAÇÃO
export const validateHotmartConfig = (): boolean => {
  // 🔧 DEBUG: Mostrar todas as variáveis disponíveis
  console.log('🔧 Variáveis de ambiente disponíveis:', {
    all_env_vars: Object.keys(import.meta.env),
    hotmart_related: Object.keys(import.meta.env).filter(key => 
      key.toLowerCase().includes('hotmart') || 
      key.toLowerCase().includes('client') ||
      key.toLowerCase().includes('token') ||
      key.toLowerCase().includes('product')
    ),
    current_config: {
      CLIENT_ID: HOTMART_CONFIG.CLIENT_ID ? `${HOTMART_CONFIG.CLIENT_ID.substring(0, 8)}...` : 'VAZIO',
      CLIENT_SECRET: HOTMART_CONFIG.CLIENT_SECRET ? 'CONFIGURADO' : 'VAZIO',
      BASIC_TOKEN: HOTMART_CONFIG.BASIC_TOKEN ? 'CONFIGURADO' : 'VAZIO',
      PRODUCT_ID: HOTMART_CONFIG.PRODUCT_ID || 'VAZIO'
    }
  });
  
  // 🔧 EM DESENVOLVIMENTO, PERMITIR FUNCIONAMENTO SEM CREDENCIAIS
  const isDevelopment = import.meta.env.DEV;
  
  if (isDevelopment && !HOTMART_CONFIG.CLIENT_ID) {
    console.warn('⚠️ MODO DESENVOLVIMENTO: Credenciais não encontradas');
    console.log('💡 Para testar localmente, crie um arquivo .env na raiz do projeto com:');
    console.log('   VITE_HOTMART_CLIENT_ID=seu_client_id');
    console.log('   VITE_HOTMART_CLIENT_SECRET=seu_client_secret');
    console.log('   VITE_HOTMART_BASIC_TOKEN=seu_basic_token');
    console.log('   VITE_PRODUCT_ID=seu_product_id');
    return true; // Permitir funcionamento em desenvolvimento sem credenciais
  }
  
  const requiredFields = ['CLIENT_ID', 'CLIENT_SECRET', 'BASIC_TOKEN'];
  
  for (const field of requiredFields) {
    const value = HOTMART_CONFIG[field as keyof typeof HOTMART_CONFIG];
    if (!value || value === '') {
      console.error(`Hotmart configuration missing: ${field}`);
      return false;
    }
  }
  
  return true;
};

// 🔧 FUNÇÃO PARA OBTER HEADERS PADRÃO
export const getDefaultHeaders = (accessToken?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  return headers;
};

// 🔧 FUNÇÃO PARA OBTER HEADERS DE AUTENTICAÇÃO BÁSICA
export const getBasicAuthHeaders = () => {
  return {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': `Basic ${HOTMART_CONFIG.BASIC_TOKEN}`,
    'Accept': 'application/json'
  };
};