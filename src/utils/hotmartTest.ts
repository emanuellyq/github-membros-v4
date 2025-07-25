// 🔧 FUNÇÕES DE TESTE PARA API HOTMART
// Use estas funções para testar a integração

import { verifyHotmartPurchase } from './hotmartApi';
import { HOTMART_CONFIG, validateHotmartConfig } from '../config/hotmart';

// 🔧 FUNÇÃO PARA TESTAR CONFIGURAÇÃO
export const testHotmartConfig = (): void => {
  console.log('🔧 Testando configuração da Hotmart...');
  
  console.log('Configuração atual:', {
    CLIENT_ID: HOTMART_CONFIG.CLIENT_ID?.substring(0, 10) + '...',
    CLIENT_SECRET: HOTMART_CONFIG.CLIENT_SECRET ? '***configurado***' : '❌ não configurado',
    BASIC_TOKEN: HOTMART_CONFIG.BASIC_TOKEN ? '***configurado***' : '❌ não configurado',
    PRODUCT_ID: HOTMART_CONFIG.PRODUCT_ID || '(qualquer produto)',
    API_BASE_URL: HOTMART_CONFIG.API_BASE_URL
  });
  
  const isValid = validateHotmartConfig();
  console.log('Configuração válida:', isValid ? '✅' : '❌');
  
  if (!isValid) {
    console.log('❌ Configure suas credenciais no arquivo .env ou src/config/hotmart.ts');
  }
};

// 🔧 FUNÇÃO PARA TESTAR BUSCA POR EMAIL
export const testEmailSearch = async (email: string): Promise<void> => {
  console.log(`🔧 Testando busca por email: ${email}`);
  
  try {
    const hasValidPurchase = await verifyHotmartPurchase(email);
    console.log('Resultado:', hasValidPurchase ? '✅ Compra encontrada' : '❌ Compra não encontrada');
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
};

// 🔧 FUNÇÃO PARA TESTAR MÚLTIPLOS EMAILS
export const testMultipleEmails = async (emails: string[]): Promise<void> => {
  console.log('🔧 Testando múltiplos emails...');
  
  for (const email of emails) {
    await testEmailSearch(email);
    // Delay entre testes para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};

// 🔧 FUNÇÃO PARA EXECUTAR TODOS OS TESTES
export const runAllTests = async (): Promise<void> => {
  console.log('🔧 Executando todos os testes da Hotmart...');
  
  // Teste 1: Configuração
  testHotmartConfig();
  
  // Teste 2: Emails de exemplo
  const testEmails = [
    'teste@teacherpoli.com',
    'admin@teacherpoli.com',
    'email-real-de-comprador@exemplo.com' // Substitua por um email real
  ];
  
  await testMultipleEmails(testEmails);
  
  console.log('🔧 Testes concluídos!');
};

// 🔧 EXECUTAR TESTES AUTOMATICAMENTE EM DESENVOLVIMENTO
if (import.meta.env.DEV) {
  // Descomente a linha abaixo para executar testes automaticamente
  // runAllTests();
}