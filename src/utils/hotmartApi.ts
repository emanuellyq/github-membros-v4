import { HOTMART_CONFIG, ACCEPTED_STATUSES, validateHotmartConfig, getDefaultHeaders } from '../config/hotmart';

// 🔧 CONFIGURAÇÃO DA API DA HOTMART
// Este arquivo contém as funções para integração com a Hotmart

interface UserCredentials {
  email: string;
  password: string;
  name: string;
  createdAt: Date;
}

interface HotmartWebhookPayload {
  event: string;
  data: {
    buyer: {
      email: string;
      name: string;
    };
    purchase: {
      status: string;
      product: {
        id: string;
        name: string;
      };
    };
  };
}

interface HotmartPurchase {
  buyer: {
    email: string;
    name: string;
  };
  product: {
    id: string;
    name: string;
  };
  purchase: {
    status: string;
    approved_date: string;
  };
}

// 🔧 FUNÇÃO PARA OBTER TOKEN DE ACESSO DA HOTMART
const getHotmartAccessToken = async (): Promise<string | null> => {
  try {
    // 🔧 EM DESENVOLVIMENTO, RETORNAR TOKEN FAKE
    if (import.meta.env.DEV && !HOTMART_CONFIG.CLIENT_ID) {
      console.warn('🔧 MODO DESENVOLVIMENTO: Usando token fake');
      return 'fake-token-for-development';
    }
    
    // Validar configuração antes de fazer a requisição
    if (!validateHotmartConfig()) {
      console.error('Hotmart configuration is invalid');
      return null;
    }

    console.log('Requesting Hotmart access token...');
    
    const response = await fetch(`${HOTMART_CONFIG.OAUTH_URL}/security/oauth/token`, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: HOTMART_CONFIG.CLIENT_ID,
        client_secret: HOTMART_CONFIG.CLIENT_SECRET
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token request failed:', response.status, errorText);
      throw new Error(`Failed to get access token: ${response.status}`);
    }

    const data = await response.json();
    console.log('Access token obtained successfully');
    return data.access_token;
  } catch (error) {
    console.error('Error getting Hotmart access token:', error);
    return null;
  }
};

// 🔧 FUNÇÃO PARA BUSCAR TODAS AS COMPRAS APROVADAS
const searchApprovedPurchases = async (page: number = 1): Promise<{ purchases: HotmartPurchase[], hasMore: boolean }> => {
  try {
    // 🔧 EM DESENVOLVIMENTO SEM CREDENCIAIS, RETORNAR DADOS FAKE
    if (import.meta.env.DEV && !HOTMART_CONFIG.CLIENT_ID) {
      console.warn('🔧 MODO DESENVOLVIMENTO: Retornando dados fake');
      return { purchases: [], hasMore: false };
    }
    
    const accessToken = await getHotmartAccessToken();
    if (!accessToken) {
      throw new Error('Unable to get access token');
    }

    console.log(`Fetching approved purchases from Hotmart (page ${page})...`);
    
    // Construir URL com parâmetros
    const params = new URLSearchParams({
      transaction_status: HOTMART_CONFIG.DEFAULT_TRANSACTION_STATUS,
      max_results: HOTMART_CONFIG.MAX_RESULTS_PER_PAGE.toString(),
      page: page.toString()
    });
    
    // Adicionar product_id se especificado
    if (HOTMART_CONFIG.PRODUCT_ID) {
      params.append('product_id', HOTMART_CONFIG.PRODUCT_ID);
    }
    
    const url = `${HOTMART_CONFIG.API_BASE_URL}/payments/api/v1/sales/history?${params.toString()}`;
    console.log('Request URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getDefaultHeaders(accessToken)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hotmart API Error:', response.status, errorText);
      throw new Error(`Failed to fetch sales history: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Hotmart API Response (page ${page}):`, {
      totalItems: data.items?.length || 0,
      hasNextPage: data.page_info?.has_next_page || false
    });
    
    const purchases = data.items || [];
    const hasMore = data.page_info?.has_next_page || false;
    
    console.log(`Found ${purchases.length} purchases on page ${page}`);

    return { purchases, hasMore };
  } catch (error) {
    console.error('Error fetching approved purchases:', error);
    return { purchases: [], hasMore: false };
  }
};

// 🔧 FUNÇÃO PARA BUSCAR COMPRAS POR EMAIL (FILTRANDO LOCALMENTE)
const searchPurchasesByEmail = async (email: string): Promise<HotmartPurchase[]> => {
  try {
    console.log(`Searching for purchases for email: ${email}`);
    
    let allPurchases: any[] = [];
    let page = 1;
    let hasMore = true;
    
    // Buscar todas as páginas de compras aprovadas
    while (hasMore && page <= 10) { // Limite de 10 páginas para evitar loops infinitos
      const result = await searchApprovedPurchases(page);
      allPurchases = allPurchases.concat(result.purchases);
      hasMore = result.hasMore;
      page++;
      
      // Delay entre requisições para evitar rate limiting
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`Total purchases fetched: ${allPurchases.length}`);
    
    // Filtrar por email e produto específico (se configurado)
    const userPurchases = allPurchases.filter((purchase: any) => {
      const emailMatch = purchase.buyer?.email?.toLowerCase() === email.toLowerCase();
      
      // Verificar produto (se especificado)
      const productMatch = !HOTMART_CONFIG.PRODUCT_ID || 
        purchase.product?.id === HOTMART_CONFIG.PRODUCT_ID ||
        purchase.product?.ucode === HOTMART_CONFIG.PRODUCT_ID;
      
      // Verificar status (múltiplas possibilidades)
      const status = purchase.transaction?.status || purchase.purchase?.status || purchase.status;
      const statusMatch = ACCEPTED_STATUSES.includes(status);
      
      console.log(`Purchase check for ${purchase.buyer?.email}:`, {
        emailMatch,
        productMatch,
        statusMatch,
        status,
        productId: purchase.product?.id || purchase.product?.ucode
      });
      
      return emailMatch && productMatch && statusMatch;
    });
    
    console.log(`Found ${userPurchases.length} purchases for email: ${email}`);
    return userPurchases;
  } catch (error) {
    console.error('Error searching purchases by email:', error);
    return [];
  }
};

// 🔧 FUNÇÃO ALTERNATIVA: BUSCAR EM BANCO DE DADOS LOCAL
const searchInLocalDatabase = async (email: string): Promise<boolean> => {
  try {
    // 🔧 IMPLEMENTAR BUSCA NO SEU BANCO DE DADOS
    // Esta função deve consultar seu banco de dados local onde você armazena
    // informações dos compradores sincronizadas via webhook
    
    const response = await fetch('/api/purchases/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        product_id: HOTMART_CONFIG.PRODUCT_ID
      }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.found === true;
  } catch (error) {
    console.error('Error searching in local database:', error);
    return false;
  }
};

// 🔧 FUNÇÃO PRINCIPAL PARA VERIFICAR COMPRA NA HOTMART (MELHORADA)
export const verifyHotmartPurchase = async (email: string): Promise<boolean> => {
  try {
    // 🔧 E-MAILS DE TESTE - REMOVER EM PRODUÇÃO
    const testEmails = [
      'teste@teacherpoli.com',
      'demo@teacherpoli.com',
      'admin@teacherpoli.com',
      'test@test.com',
      'usuario@teste.com'
    ];
    
    if (testEmails.includes(email.toLowerCase())) {
      return true;
    }

    // 🔧 ESTRATÉGIA 1: BUSCAR DIRETAMENTE NA API DA HOTMART
    console.log('Searching for purchases in Hotmart API...');
    const hotmartPurchases = await searchPurchasesByEmail(email);
    
    if (hotmartPurchases.length > 0) {
      console.log('Purchase found in Hotmart API');
      return true;
    }

    // 🔧 ESTRATÉGIA 2: BUSCAR NO BANCO DE DADOS LOCAL (FALLBACK)
    console.log('Searching in local database...');
    const foundInDatabase = await searchInLocalDatabase(email);
    
    if (foundInDatabase) {
      console.log('Purchase found in local database');
      return true;
    }

    console.log('No purchase found for email:', email);
    return false;

  } catch (error) {
    console.error('Error verifying Hotmart purchase:', error);
    return false;
  }
};

// 🔧 FUNÇÃO PARA SALVAR CREDENCIAIS DO USUÁRIO
export const saveUserCredentials = async (credentials: UserCredentials): Promise<boolean> => {
  try {
    // 🔧 E-MAILS DE TESTE - SEMPRE RETORNAR SUCESSO
    const testEmails = [
      'teste@teacherpoli.com',
      'demo@teacherpoli.com',
      'admin@teacherpoli.com',
      'test@test.com', 
      'usuario@teste.com'
    ];
    
    if (testEmails.includes(credentials.email.toLowerCase())) {
      return true;
    }

    // 🔧 IMPLEMENTAÇÃO REAL - SALVAR NO BACKEND
    const response = await fetch('/api/users/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password, // Hash this password!
        name: credentials.name,
        createdAt: credentials.createdAt
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error saving user credentials:', error);
    return false;
  }
};

// 🔧 FUNÇÃO PARA VALIDAR LOGIN
export const validateUserLogin = async (email: string, password: string): Promise<boolean> => {
  try {
    // 🔧 E-MAILS DE TESTE - ACEITAR QUALQUER SENHA
    const testEmails = [
      'teste@teacherpoli.com',
      'demo@teacherpoli.com',
      'admin@teacherpoli.com', 
      'test@test.com',
      'usuario@teste.com'
    ];
    
    if (testEmails.includes(email.toLowerCase()) && password.length >= 6) {
      return true;
    }

    // 🔧 IMPLEMENTAÇÃO REAL - VALIDAR NO BACKEND
    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error validating user login:', error);
    return false;
  }
};

// 🔧 FUNÇÃO PARA PROCESSAR WEBHOOK DA HOTMART
export const handleHotmartWebhook = async (payload: HotmartWebhookPayload) => {
  try {
    const { event, data } = payload;
    
    console.log('Processing Hotmart webhook:', event);
    
    switch (event) {
      case 'PURCHASE_APPROVED':
        // Salvar compra no banco de dados local
        await savePurchaseToDatabase({
          email: data.buyer.email,
          name: data.buyer.name,
          product_id: data.purchase.product.id,
          status: data.purchase.status,
          approved_date: new Date().toISOString()
        });
        console.log('Purchase approved and saved:', data.buyer.email);
        break;
        
      case 'PURCHASE_REFUNDED':
        // Remover/desativar acesso do usuário
        await deactivateUserAccess(data.buyer.email);
        console.log('Purchase refunded, access deactivated:', data.buyer.email);
        break;
        
      case 'PURCHASE_CANCELED':
        // Remover/desativar acesso do usuário
        await deactivateUserAccess(data.buyer.email);
        console.log('Purchase canceled, access deactivated:', data.buyer.email);
        break;
    }
  } catch (error) {
    console.error('Error processing Hotmart webhook:', error);
  }
};

// 🔧 FUNÇÃO PARA SALVAR COMPRA NO BANCO DE DADOS
const savePurchaseToDatabase = async (purchaseData: any) => {
  try {
    const response = await fetch('/api/purchases/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(purchaseData),
    });

    if (!response.ok) {
      throw new Error('Failed to save purchase to database');
    }
  } catch (error) {
    console.error('Error saving purchase to database:', error);
  }
};

// 🔧 FUNÇÃO PARA DESATIVAR ACESSO DO USUÁRIO
const deactivateUserAccess = async (email: string) => {
  try {
    const response = await fetch('/api/users/deactivate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error('Failed to deactivate user access');
    }
  } catch (error) {
    console.error('Error deactivating user access:', error);
  }
};

// 🔧 FUNÇÃO PARA SINCRONIZAR COMPRAS HISTÓRICAS (EXECUTAR UMA VEZ)
export const syncHistoricalPurchases = async (): Promise<void> => {
  try {
    console.log('Starting historical purchases sync...');
    
    const accessToken = await getHotmartAccessToken();
    if (!accessToken) {
      throw new Error('Unable to get access token');
    }

    // Buscar todas as vendas históricas do produto
    let page = 1;
    let hasMorePages = true;
    
    while (hasMorePages) {
      const response = await fetch(`${HOTMART_CONFIG.API_BASE_URL}/payments/api/v1/sales/history?transaction_status=APPROVED&page=${page}&max_results=50`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch historical sales');
      }

      const data = await response.json();
      
      // Salvar cada compra no banco de dados
      for (const purchase of data.items || []) {
        if (purchase.transaction?.status === 'APPROVED' || purchase.purchase?.status === 'APPROVED') {
          await savePurchaseToDatabase({
            email: purchase.buyer.email,
            name: purchase.buyer.name,
            product_id: purchase.product.id,
            status: purchase.transaction?.status || purchase.purchase?.status,
            approved_date: purchase.transaction?.approved_date || purchase.purchase?.approved_date
          });
        }
      }
      
      // Verificar se há mais páginas
      hasMorePages = data.page_info?.has_next_page || false;
      page++;
      
      // Delay para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('Historical purchases sync completed');
  } catch (error) {
    console.error('Error syncing historical purchases:', error);
  }
};

/* 
🔧 ENDPOINTS NECESSÁRIOS NO BACKEND:

1. POST /api/hotmart/webhook
   - Receber webhooks da Hotmart
   - Processar eventos de compra/reembolso

2. POST /api/purchases/search
   - Buscar compra por email no banco local
   - Retornar se encontrou ou não

3. POST /api/purchases/save
   - Salvar dados da compra no banco
   - Usado pelo webhook e sync histórico

4. POST /api/users/deactivate
   - Desativar acesso de usuário
   - Usado em reembolsos/cancelamentos

5. GET /api/purchases/sync-historical
   - Endpoint para executar sync histórico
   - Executar uma vez para importar compras antigas

🔧 CONFIGURAÇÃO DO WEBHOOK NA HOTMART:
- URL: https://seudominio.com/api/hotmart/webhook
- Eventos: PURCHASE_APPROVED, PURCHASE_REFUNDED, PURCHASE_CANCELED
- Método: POST
*/
