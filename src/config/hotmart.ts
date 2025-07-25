// 🔧 CONFIGURAÇÃO DA HOTMART
// Configure suas credenciais aqui ou use variáveis de ambiente

export const HOTMART_CONFIG = {
  // 🔧 CREDENCIAIS DA HOTMART - Usa GitHub Secrets ou variáveis locais
  CLIENT_ID: import.meta.env.VITE_HOTMART_CLIENT_ID || '',
             
  CLIENT_SECRET: import.meta.env.VITE_HOTMART_CLIENT_SECRET || '',
                 
  BASIC_TOKEN: import.meta.env.VITE_HOTMART_BASIC_TOKEN || '',
  
  // 🔧 ID DO SEU PRODUTO
  PRODUCT_ID: import.meta.env.VITE_PRODUCT_ID || '',
  
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
    if (!value || value === '') {
      console.error(`Hotmart configuration missing: ${field}`);
      console.log('Available env vars:', {
        VITE_HOTMART_CLIENT_ID: !!import.meta.env.VITE_HOTMART_CLIENT_ID,
        YOUR_HOTMART_CLIENT_ID: !!import.meta.env.YOUR_HOTMART_CLIENT_ID,
        YOUR_HOTMART_CLIENT_SECRET: !!import.meta.env.YOUR_HOTMART_CLIENT_SECRET,
        YOUR_HOTMART_BASIC_TOKEN: !!import.meta.env.YOUR_HOTMART_BASIC_TOKEN,
        YOUR_PRODUCT_ID: !!import.meta.env.YOUR_PRODUCT_ID
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
  };
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  return headers;
};
