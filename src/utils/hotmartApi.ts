import { HOTMART_CONFIG, ACCEPTED_STATUSES, validateHotmartConfig, getDefaultHeaders, getBasicAuthHeaders } from '../config/hotmart';

// 🔧 CONFIGURAÇÃO DA API DA HOTMART
// Este arquivo contém as funções para integração com a Hotmart seguindo a documentação oficial

interface UserCredentials {
  email: string;
  password: string;
  name: string;
  createdAt: Date;
}

interface HotmartTransaction {
  transaction: {
    id: string;
    status: string;
    approved_date?: string;
  };
  buyer: {
    email: string;
    name: string;
  };
  product: {
    id: string;
    name: string;
    ucode?: string;
  };
  purchase: {
    price: {
      value: number;
      currency_code: string;
    };
  };
}

interface HotmartSalesHistoryResponse {
  items: HotmartTransaction[];
  page_info: {
    number: number;
    size: number;
    total_elements: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
  };
}

// 🔧 FUNÇÃO PARA OBTER TOKEN DE ACESSO DA HOTMART (OAuth2)
const getHotmartAccessToken = async (): Promise<string | null> => {
  try {
    // 🔧 EM DESENVOLVIMENTO, RETORNAR TOKEN FAKE SE NÃO HOUVER CREDENCIAIS
    if (import.meta.env.DEV && !HOTMART_CONFIG.CLIENT_ID) {
      console.warn('🔧 MODO DESENVOLVIMENTO: Usando token fake');
      return 'fake-token-for-development';
    }
    
    // Validar configuração antes de fazer a requisição
    if (!validateHotmartConfig()) {
      console.error('❌ Configuração da Hotmart inválida');
      return null;
    }

    console.log('🔧 Solicitando token de acesso da Hotmart...');
    
    // Preparar dados do formulário conforme documentação
    const formData = new URLSearchParams();
    formData.append('grant_type', 'client_credentials');
    formData.append('client_id', HOTMART_CONFIG.CLIENT_ID);
    formData.append('client_secret', HOTMART_CONFIG.CLIENT_SECRET);

    const response = await fetch(`${HOTMART_CONFIG.OAUTH_URL}/security/oauth/token`, {
      method: 'POST',
      headers: getBasicAuthHeaders(),
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Falha na requisição do token:', response.status, errorText);
      throw new Error(`Failed to get access token: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Token de acesso obtido com sucesso');
    return data.access_token;
  } catch (error) {
    console.error('❌ Erro ao obter token de acesso da Hotmart:', error);
    return null;
  }
};

// 🔧 FUNÇÃO PARA BUSCAR HISTÓRICO DE VENDAS (conforme documentação)
const fetchSalesHistory = async (
  accessToken: string, 
  page: number = 1,
  buyerEmail?: string
): Promise<HotmartSalesHistoryResponse | null> => {
  try {
    console.log(`🔧 Buscando histórico de vendas (página ${page})...`);
    
    // Construir parâmetros da query conforme documentação
    const params = new URLSearchParams({
      'transaction_status': HOTMART_CONFIG.DEFAULT_TRANSACTION_STATUS,
      'max_results': HOTMART_CONFIG.MAX_RESULTS_PER_PAGE.toString(),
      'page': page.toString()
    });
    
    // Adicionar filtro por produto se especificado
    if (HOTMART_CONFIG.PRODUCT_ID) {
      params.append('product_id', HOTMART_CONFIG.PRODUCT_ID);
    }
    
    // Adicionar filtro por email se especificado
    if (buyerEmail) {
      params.append('buyer_email', buyerEmail);
    }
    
    // Adicionar período (últimos 90 dias para otimizar)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    
    params.append('start_date', startDate.toISOString().split('T')[0]);
    params.append('end_date', endDate.toISOString().split('T')[0]);
    
    const url = `${HOTMART_CONFIG.API_BASE_URL}/payments/api/v1/sales/history?${params.toString()}`;
    console.log('🔧 URL da requisição:', url.replace(accessToken, '***TOKEN***'));
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getDefaultHeaders(accessToken)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na API da Hotmart:', response.status, errorText);
      
      // Se for erro 401, o token pode ter expirado
      if (response.status === 401) {
        console.log('🔧 Token pode ter expirado, tentando renovar...');
        return null;
      }
      
      throw new Error(`Failed to fetch sales history: ${response.status} - ${errorText}`);
    }

    const data: HotmartSalesHistoryResponse = await response.json();
    console.log(`✅ Histórico obtido - ${data.items?.length || 0} transações encontradas`);
    
    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar histórico de vendas:', error);
    return null;
  }
};

// 🔧 FUNÇÃO OTIMIZADA PARA BUSCAR COMPRAS POR EMAIL
const searchPurchasesByEmail = async (email: string): Promise<HotmartTransaction[]> => {
  try {
    console.log(`🔧 Buscando compras para o email: ${email}`);
    
    const accessToken = await getHotmartAccessToken();
    if (!accessToken) {
      throw new Error('Não foi possível obter token de acesso');
    }

    // Primeira tentativa: buscar diretamente com filtro de email
    console.log('🔧 Tentativa 1: Busca direta com filtro de email');
    let salesData = await fetchSalesHistory(accessToken, 1, email);
    
    if (salesData && salesData.items.length > 0) {
      console.log(`✅ Encontradas ${salesData.items.length} transações com filtro direto`);
      return salesData.items.filter(item => 
        item.buyer.email.toLowerCase() === email.toLowerCase() &&
        ACCEPTED_STATUSES.includes(item.transaction.status)
      );
    }

    // Segunda tentativa: buscar sem filtro e filtrar localmente (fallback)
    console.log('🔧 Tentativa 2: Busca geral e filtro local');
    let allTransactions: HotmartTransaction[] = [];
    let page = 1;
    let hasMore = true;
    const maxPages = 5; // Limitar para evitar muitas requisições
    
    while (hasMore && page <= maxPages) {
      salesData = await fetchSalesHistory(accessToken, page);
      
      if (!salesData) {
        console.log('❌ Falha ao obter dados de vendas');
        break;
      }
      
      allTransactions = allTransactions.concat(salesData.items || []);
      hasMore = salesData.page_info?.has_next_page || false;
      page++;
      
      // Delay entre requisições para evitar rate limiting
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`🔧 Total de transações obtidas: ${allTransactions.length}`);
    
    // Filtrar por email e status
    const userTransactions = allTransactions.filter(transaction => {
      const emailMatch = transaction.buyer.email.toLowerCase() === email.toLowerCase();
      const statusMatch = ACCEPTED_STATUSES.includes(transaction.transaction.status);
      
      // Verificar produto (se especificado)
      const productMatch = !HOTMART_CONFIG.PRODUCT_ID || 
        transaction.product.id === HOTMART_CONFIG.PRODUCT_ID ||
        transaction.product.ucode === HOTMART_CONFIG.PRODUCT_ID;
      
      return emailMatch && statusMatch && productMatch;
    });
    
    console.log(`✅ Encontradas ${userTransactions.length} transações válidas para ${email}`);
    return userTransactions;
    
  } catch (error) {
    console.error('❌ Erro ao buscar compras por email:', error);
    return [];
  }
};

// 🔧 FUNÇÃO PRINCIPAL PARA VERIFICAR COMPRA NA HOTMART
export const verifyHotmartPurchase = async (email: string): Promise<boolean> => {
  try {
    console.log(`🔧 Verificando compra para: ${email}`);
    
    // 🔧 E-MAILS DE TESTE - SEMPRE APROVADOS
    const testEmails = [
      'teste@teacherpoli.com',
      'demo@teacherpoli.com',
      'admin@teacherpoli.com',
      'test@test.com',
      'usuario@teste.com',
      'manu@teacherpoli.com',
      'poli@teacherpoli.com'
    ];
    
    if (testEmails.includes(email.toLowerCase())) {
      console.log('✅ Email de teste aprovado automaticamente');
      return true;
    }

    // Verificar na API da Hotmart
    const transactions = await searchPurchasesByEmail(email);
    
    if (transactions.length > 0) {
      console.log('✅ Compra válida encontrada na Hotmart');
      
      // Log das transações encontradas (sem dados sensíveis)
      transactions.forEach(transaction => {
        console.log(`📋 Transação: ${transaction.transaction.id} - Status: ${transaction.transaction.status} - Produto: ${transaction.product.name}`);
      });
      
      return true;
    }

    console.log('❌ Nenhuma compra válida encontrada');
    return false;

  } catch (error) {
    console.error('❌ Erro ao verificar compra na Hotmart:', error);
    
    // Em caso de erro, permitir acesso para emails de teste
    const testEmails = [
      'teste@teacherpoli.com',
      'demo@teacherpoli.com',
      'admin@teacherpoli.com'
    ];
    
    if (testEmails.includes(email.toLowerCase())) {
      console.log('⚠️ Erro na API, mas email de teste aprovado');
      return true;
    }
    
    return false;
  }
};

// 🔧 FUNÇÃO PARA SALVAR CREDENCIAIS DO USUÁRIO
export const saveUserCredentials = async (credentials: UserCredentials): Promise<boolean> => {
  try {
    console.log(`🔧 Salvando credenciais para: ${credentials.email}`);
    
    // 🔧 E-MAILS DE TESTE - SEMPRE RETORNAR SUCESSO
    const testEmails = [
      'teste@teacherpoli.com',
      'demo@teacherpoli.com',
      'admin@teacherpoli.com',
      'test@test.com', 
      'usuario@teste.com',
      'manu@teacherpoli.com',
      'poli@teacherpoli.com'
    ];
    
    if (testEmails.includes(credentials.email.toLowerCase())) {
      console.log('✅ Credenciais de teste salvas com sucesso');
      return true;
    }

    // 🔧 IMPLEMENTAÇÃO REAL - SALVAR NO BACKEND
    // Aqui você implementaria a chamada para seu backend
    /*
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
    */
    
    // Por enquanto, simular sucesso
    console.log('✅ Credenciais salvas (simulado)');
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar credenciais:', error);
    return false;
  }
};

// 🔧 FUNÇÃO PARA VALIDAR LOGIN
export const validateUserLogin = async (email: string, password: string): Promise<boolean> => {
  try {
    console.log(`🔧 Validando login para: ${email}`);
    
    // 🔧 E-MAILS DE TESTE - ACEITAR QUALQUER SENHA COM MAIS DE 6 CARACTERES
    const testEmails = [
      'teste@teacherpoli.com',
      'demo@teacherpoli.com',
      'admin@teacherpoli.com', 
      'test@test.com',
      'usuario@teste.com',
      'manu@teacherpoli.com',
      'poli@teacherpoli.com'
    ];
    
    if (testEmails.includes(email.toLowerCase()) && password.length >= 6) {
      console.log('✅ Login de teste validado com sucesso');
      return true;
    }

    // 🔧 IMPLEMENTAÇÃO REAL - VALIDAR NO BACKEND
    // Aqui você implementaria a chamada para seu backend
    /*
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
    */
    
    // Por enquanto, simular validação baseada na verificação da compra
    const hasValidPurchase = await verifyHotmartPurchase(email);
    if (hasValidPurchase && password.length >= 6) {
      console.log('✅ Login validado com base na compra da Hotmart');
      return true;
    }
    
    console.log('❌ Login inválido');
    return false;
  } catch (error) {
    console.error('❌ Erro ao validar login:', error);
    return false;
  }
};

// 🔧 FUNÇÃO PARA SINCRONIZAR COMPRAS HISTÓRICAS
export const syncHistoricalPurchases = async (): Promise<void> => {
  try {
    console.log('🔧 Iniciando sincronização de compras históricas...');
    
    const accessToken = await getHotmartAccessToken();
    if (!accessToken) {
      throw new Error('Não foi possível obter token de acesso');
    }

    let page = 1;
    let hasMorePages = true;
    let totalSynced = 0;
    
    while (hasMorePages && page <= 50) { // Limite de segurança
      const salesData = await fetchSalesHistory(accessToken, page);
      
      if (!salesData) {
        console.log('❌ Falha ao obter dados de vendas');
        break;
      }
      
      // Processar cada transação
      for (const transaction of salesData.items || []) {
        if (ACCEPTED_STATUSES.includes(transaction.transaction.status)) {
          // Aqui você salvaria no seu banco de dados
          console.log(`📋 Processando: ${transaction.buyer.email} - ${transaction.product.name}`);
          totalSynced++;
        }
      }
      
      hasMorePages = salesData.page_info?.has_next_page || false;
      page++;
      
      // Delay para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`✅ Sincronização concluída - ${totalSynced} compras processadas`);
  } catch (error) {
    console.error('❌ Erro na sincronização de compras históricas:', error);
  }
};

/* 
🔧 RESUMO DAS MELHORIAS IMPLEMENTADAS:

1. ✅ Configuração correta dos nomes dos secrets do GitHub
2. ✅ Implementação da autenticação OAuth2 conforme documentação
3. ✅ Uso correto do endpoint de histórico de vendas
4. ✅ Filtros otimizados por email e produto
5. ✅ Tratamento de erros robusto
6. ✅ Rate limiting para evitar bloqueios
7. ✅ Logs detalhados para debug
8. ✅ Fallback para busca local quando necessário

🔧 PRÓXIMOS PASSOS:
1. Testar com credenciais reais no ambiente de produção
2. Implementar cache para reduzir chamadas à API
3. Adicionar webhook para sincronização em tempo real
4. Implementar banco de dados para armazenar compras localmente
*/