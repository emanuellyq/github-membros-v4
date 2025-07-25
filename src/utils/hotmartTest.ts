// 🔧 FUNÇÕES DE TESTE PARA API HOTMART
// Use estas funções para testar a integração

import { verifyHotmartPurchase } from './hotmartApi';
import { HOTMART_CONFIG, validateHotmartConfig } from '../config/hotmart';

// 🔧 FUNÇÃO PARA TESTAR CONFIGURAÇÃO
export const debugEnvironmentVariables = (): void => {
  console.log('🔧 Debug das variáveis de ambiente:');
  console.log({
    // Mostra apenas se existem, não os valores
    CLIENT_ID_exists: !!HOTMART_CONFIG.CLIENT_ID,
    CLIENT_SECRET_exists: !!HOTMART_CONFIG.CLIENT_SECRET,
    BASIC_TOKEN_exists: !!HOTMART_CONFIG.BASIC_TOKEN,
    PRODUCT_ID_exists: !!HOTMART_CONFIG.PRODUCT_ID,
    
    // Mostra os primeiros caracteres para debug
    CLIENT_ID_preview: HOTMART_CONFIG.CLIENT_ID ? HOTMART_CONFIG.CLIENT_ID.substring(0, 8) + '...' : 'não encontrado',
    
    // Variáveis disponíveis no ambiente
    available_env_vars: Object.keys(import.meta.env).filter(key => 
      key.includes('HOTMART') || key.includes('PRODUCT') || key.includes('YOUR_')
    ),
    
    // Valores específicos dos secrets (primeiros caracteres apenas)
    secrets_preview: {
      VITE_YOUR_HOTMART_CLIENT_ID: import.meta.env.VITE_YOUR_HOTMART_CLIENT_ID ? 
        import.meta.env.VITE_YOUR_HOTMART_CLIENT_ID.substring(0, 8) + '...' : 'não encontrado',
      VITE_YOUR_HOTMART_CLIENT_SECRET: import.meta.env.VITE_YOUR_HOTMART_CLIENT_SECRET ? 
        '***configurado***' : 'não encontrado',
      VITE_YOUR_HOTMART_BASIC_TOKEN: import.meta.env.VITE_YOUR_HOTMART_BASIC_TOKEN ? 
        '***configurado***' : 'não encontrado',
      VITE_YOUR_PRODUCT_ID: import.meta.env.VITE_YOUR_PRODUCT_ID || 'não configurado'
    }
  });
};

export const testHotmartConfig = (): void => {
  console.log('🔧 Testando configuração da Hotmart...');
  
  // Debug das variáveis de ambiente
  debugEnvironmentVariables();
  
  console.log('📋 Configuração atual:', {
    CLIENT_ID: HOTMART_CONFIG.CLIENT_ID ? HOTMART_CONFIG.CLIENT_ID.substring(0, 10) + '...' : '❌ não configurado',
    CLIENT_SECRET: HOTMART_CONFIG.CLIENT_SECRET ? '***configurado***' : '❌ não configurado',
    BASIC_TOKEN: HOTMART_CONFIG.BASIC_TOKEN ? '***configurado***' : '❌ não configurado',
    PRODUCT_ID: HOTMART_CONFIG.PRODUCT_ID || '(qualquer produto)',
    API_BASE_URL: HOTMART_CONFIG.API_BASE_URL,
    OAUTH_URL: HOTMART_CONFIG.OAUTH_URL
  });
  
  const isValid = validateHotmartConfig();
  console.log('✅ Configuração válida:', isValid ? '✅ SIM' : '❌ NÃO');
  
  if (!isValid) {
    console.log('❌ Verifique se os GitHub Secrets estão configurados corretamente:');
    console.log('📋 Secrets necessários no GitHub:');
    console.log('   - YOUR_HOTMART_CLIENT_ID');
    console.log('   - YOUR_HOTMART_CLIENT_SECRET'); 
    console.log('   - YOUR_HOTMART_BASIC_TOKEN');
    console.log('   - YOUR_PRODUCT_ID (opcional)');
    console.log('');
    console.log('🔧 Como configurar:');
    console.log('   1. Vá para Settings > Secrets and variables > Actions');
    console.log('   2. Clique em "New repository secret"');
    console.log('   3. Adicione cada secret com o nome exato');
    console.log('   4. Os valores devem vir do painel de desenvolvedor da Hotmart');
  } else {
    console.log('✅ Configuração OK! Pronto para testar a API.');
  }
};

// 🔧 FUNÇÃO PARA TESTAR BUSCA POR EMAIL
export const testEmailSearch = async (email: string): Promise<void> => {
  console.log(`🔧 Testando busca por email: ${email}`);
  console.log('⏳ Aguarde, consultando API da Hotmart...');
  
  const startTime = Date.now();
  
  try {
    const hasValidPurchase = await verifyHotmartPurchase(email);
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`📊 Resultado (${duration}s):`, hasValidPurchase ? '✅ Compra encontrada' : '❌ Compra não encontrada');
    
    if (hasValidPurchase) {
      console.log('🎉 Usuário tem acesso liberado!');
    } else {
      console.log('🚫 Usuário não tem compra válida.');
    }
  } catch (error) {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.error(`❌ Erro no teste (${duration}s):`, error);
  }
};

// 🔧 FUNÇÃO PARA TESTAR MÚLTIPLOS EMAILS
export const testMultipleEmails = async (emails: string[]): Promise<void> => {
  console.log('🔧 Testando múltiplos emails...');
  console.log(`📋 Total de emails para testar: ${emails.length}`);
  
  const results: { email: string; hasAccess: boolean; duration: number }[] = [];
  
  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    console.log(`\n📧 Teste ${i + 1}/${emails.length}: ${email}`);
    
    const startTime = Date.now();
    try {
      const hasAccess = await verifyHotmartPurchase(email);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      results.push({ email, hasAccess, duration });
      console.log(`   Resultado: ${hasAccess ? '✅' : '❌'} (${(duration/1000).toFixed(2)}s)`);
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      results.push({ email, hasAccess: false, duration });
      console.log(`   Erro: ❌ (${(duration/1000).toFixed(2)}s)`, error);
    }
    
    // Delay entre testes para evitar rate limiting
    if (i < emails.length - 1) {
      console.log('   ⏳ Aguardando 2s para próximo teste...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Resumo dos resultados
  console.log('\n📊 RESUMO DOS TESTES:');
  console.log('═'.repeat(50));
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.email}: ${result.hasAccess ? '✅ APROVADO' : '❌ NEGADO'} (${(result.duration/1000).toFixed(2)}s)`);
  });
  
  const approved = results.filter(r => r.hasAccess).length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  
  console.log('═'.repeat(50));
  console.log(`📈 Estatísticas:`);
  console.log(`   • Total testado: ${results.length}`);
  console.log(`   • Aprovados: ${approved} (${((approved/results.length)*100).toFixed(1)}%)`);
  console.log(`   • Negados: ${results.length - approved} (${(((results.length - approved)/results.length)*100).toFixed(1)}%)`);
  console.log(`   • Tempo médio: ${(avgDuration/1000).toFixed(2)}s`);
};

// 🔧 FUNÇÃO PARA EXECUTAR TODOS OS TESTES
export const runAllTests = async (): Promise<void> => {
  console.log('🚀 EXECUTANDO BATERIA COMPLETA DE TESTES DA HOTMART');
  console.log('═'.repeat(60));
  
  // Teste 1: Configuração
  console.log('\n1️⃣ TESTE DE CONFIGURAÇÃO');
  console.log('─'.repeat(30));
  testHotmartConfig();
  
  // Aguardar um pouco antes dos próximos testes
  console.log('\n⏳ Aguardando 3s antes dos testes de API...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Teste 2: Emails de exemplo
  console.log('\n2️⃣ TESTE DE EMAILS');
  console.log('─'.repeat(30));
  
  const testEmails = [
    'teste@teacherpoli.com', // Email de teste (deve passar)
    'admin@teacherpoli.com', // Email de teste (deve passar)
    'usuario-inexistente@exemplo.com', // Email que não deve existir (deve falhar)
    // Adicione aqui um email real de comprador para testar
    // 'email-real-de-comprador@exemplo.com'
  ];
  
  await testMultipleEmails(testEmails);
  
  console.log('\n🏁 TESTES CONCLUÍDOS!');
  console.log('═'.repeat(60));
  console.log('💡 Dicas:');
  console.log('   • Se todos os testes falharam, verifique as credenciais');
  console.log('   • Se apenas emails reais falharam, verifique se há compras no período');
  console.log('   • Emails de teste sempre devem passar');
  console.log('   • Verifique o console do navegador para logs detalhados');
};

// 🔧 FUNÇÃO PARA TESTE RÁPIDO
export const quickTest = async (): Promise<void> => {
  console.log('⚡ TESTE RÁPIDO DA INTEGRAÇÃO HOTMART');
  console.log('─'.repeat(40));
  
  // Teste básico de configuração
  const isConfigValid = validateHotmartConfig();
  console.log(`🔧 Configuração: ${isConfigValid ? '✅' : '❌'}`);
  
  if (!isConfigValid) {
    console.log('❌ Configure os secrets primeiro!');
    return;
  }
  
  // Teste com email de teste
  console.log('🧪 Testando email de teste...');
  await testEmailSearch('teste@teacherpoli.com');
  
  console.log('\n✅ Teste rápido concluído!');
};