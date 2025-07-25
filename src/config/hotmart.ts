// 🔧 CONFIGURAÇÃO DA HOTMART
// Configure suas credenciais aqui ou use variáveis de ambiente

export const HOTMART_CONFIG = {
  // 🔧 CREDENCIAIS DA HOTMART - Configure com suas credenciais reais
  CLIENT_ID: import.meta.env.VITE_HOTMART_CLIENT_ID || 'your_hotmart_client_id',
  CLIENT_SECRET: import.meta.env.VITE_HOTMART_CLIENT_SECRET || 'your_hotmart_client_secret',
  BASIC_TOKEN: import.meta.env.VITE_HOTMART_BASIC_TOKEN || 'your_hotmart_basic_token',
  
  // 🔧 ID DO SEU PRODUTO (opcional - se não especificado, aceita qualquer produto)
  PRODUCT_ID: import.meta.env.VITE_HOTMART_PRODUCT_ID || '',
  
  // 🔧 URLs DA API
  API_BASE_URL: 'https://developers.hotmart.com',
  OAUTH_URL: 'https://api-sec-vlc.hotmart.com',
  
  // 🔧 CONFIGURAÇÕES DE BUSCA
  MAX_RESULTS_PER_PAGE: 100,
  DEFAULT_TRANSACTION_STATUS: 'APPROVED'
};

// 🔧 TIPOS DE STATUS ACEITOS
export const ACCEPTED_STATUSES = [
  'APPROVED',
  'COMPLETE',
  'COMPLETED'
];

// 🔧 FUNÇÃO PARA VALIDAR CONFIGURAÇÃO
export const validateHotmartConfig = (): boolean => {
  const requiredFields = ['CLIENT_ID', 'CLIENT_SECRET', 'BASIC_TOKEN'];
  
  for (const field of requiredFields) {
    const value = HOTMART_CONFIG[field as keyof typeof HOTMART_CONFIG];
    if (!value || value.startsWith('your_hotmart_')) {
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
  };
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  return headers;
};