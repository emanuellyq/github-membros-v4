// 🔧 CONFIGURAÇÃO DA HOTMART
// Configure suas credenciais aqui ou use variáveis de ambiente

export const HOTMART_CONFIG = {
  // 🔧 CREDENCIAIS DA HOTMART - Usa GitHub Secrets
  CLIENT_ID: import.meta.env.VITE_YOUR_HOTMART_CLIENT_ID || '',
  CLIENT_SECRET: import.meta.env.VITE_YOUR_HOTMART_CLIENT_SECRET || '',
  BASIC_TOKEN: import.meta.env.VITE_YOUR_HOTMART_BASIC_TOKEN || '',
  
  // 🔧 ID DO SEU PRODUTO
  PRODUCT_ID: import.meta.env.VITE_YOUR_PRODUCT_ID || '',
  
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
  // 🔧 EM DESENVOLVIMENTO, PULAR VALIDAÇÃO SE NÃO HOUVER CREDENCIAIS
  const isDevelopment = import.meta.env.DEV;
  
  if (isDevelopment && !HOTMART_CONFIG.CLIENT_ID) {
    console.warn('🔧 MODO DESENVOLVIMENTO: Validação da Hotmart desabilitada');
    console.log('Para testar com credenciais reais, configure os secrets no GitHub');
    return true; // Permitir funcionamento em desenvolvimento sem credenciais
  }
  
  const requiredFields = ['CLIENT_ID', 'CLIENT_SECRET', 'BASIC_TOKEN'];
  
  for (const field of requiredFields) {
    const value = HOTMART_CONFIG[field as keyof typeof HOTMART_CONFIG];
    if (!value || value === '') {
      console.error(`Hotmart configuration missing: ${field}`);
      console.log('Available env vars:', {
        VITE_YOUR_HOTMART_CLIENT_ID: !!import.meta.env.VITE_YOUR_HOTMART_CLIENT_ID,
        VITE_YOUR_HOTMART_CLIENT_SECRET: !!import.meta.env.VITE_YOUR_HOTMART_CLIENT_SECRET,
        VITE_YOUR_HOTMART_BASIC_TOKEN: !!import.meta.env.VITE_YOUR_HOTMART_BASIC_TOKEN,
        VITE_YOUR_PRODUCT_ID: !!import.meta.env.VITE_YOUR_PRODUCT_ID
      });
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