import React, { useState } from 'react';
import { X, Settings, Database, Users, BookOpen, TestTube, Play, Bug, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { isAdmin } from '../utils/adminConfig';
import { testHotmartConfig, testEmailSearch, runAllTests } from '../utils/hotmartTest';
import { debugEnvironmentVariables } from '../config/hotmart';

interface AdminPanelProps {
  isVisible: boolean;
  onToggle: () => void;
  userEmail: string;
}

export default function AdminPanel({ isVisible, onToggle, userEmail }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('content');
  const [testEmail, setTestEmail] = useState('');
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  if (!isAdmin(userEmail)) {
    return null;
  }

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const handleDebugEnvironment = () => {
    addTestResult('🔧 Iniciando debug das variáveis de ambiente...');
    try {
      debugEnvironmentVariables();
      addTestResult('✅ Debug concluído - verifique o console do navegador');
    } catch (error) {
      addTestResult(`❌ Erro no debug: ${error}`);
    }
  };

  const handleTestConfig = () => {
    addTestResult('🔧 Testando configuração da Hotmart...');
    try {
      testHotmartConfig();
      addTestResult('✅ Teste de configuração concluído - verifique o console');
    } catch (error) {
      addTestResult(`❌ Erro no teste de configuração: ${error}`);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail.trim()) {
      addTestResult('❌ Digite um email para testar');
      return;
    }

    setIsLoading(true);
    addTestResult(`🔍 Testando email: ${testEmail}`);
    
    try {
      await testEmailSearch(testEmail);
      addTestResult('✅ Teste de email concluído - verifique o console');
    } catch (error) {
      addTestResult(`❌ Erro no teste de email: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunAllTests = async () => {
    setIsLoading(true);
    addTestResult('🚀 Executando todos os testes...');
    
    try {
      await runAllTests();
      addTestResult('✅ Todos os testes concluídos - verifique o console');
    } catch (error) {
      addTestResult(`❌ Erro nos testes: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-red-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Settings className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Painel Administrativo</h2>
              <p className="text-sm text-gray-600">Gerenciar conteúdo e configurações</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'content', label: 'Conteúdo', icon: BookOpen },
              { id: 'users', label: 'Usuários', icon: Users },
              { id: 'database', label: 'Banco de Dados', icon: Database },
              { id: 'hotmart', label: 'Teste Hotmart', icon: TestTube }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'content' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gerenciar Conteúdo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Vídeos de Onboarding</h4>
                  <p className="text-sm text-gray-600 mb-3">Editar vídeos da seção "Comece por Aqui"</p>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Editar Vídeos
                  </button>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Bônus Exclusivos</h4>
                  <p className="text-sm text-gray-600 mb-3">Gerenciar cursos e materiais bônus</p>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    Editar Bônus
                  </button>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Pop-ups e Modais</h4>
                  <p className="text-sm text-gray-600 mb-3">Configurar mensagens de boas-vindas</p>
                  <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                    Editar Pop-ups
                  </button>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Configurações Gerais</h4>
                  <p className="text-sm text-gray-600 mb-3">Links, textos e configurações globais</p>
                  <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                    Configurar
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gerenciar Usuários</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-yellow-800">
                  <strong>Atenção:</strong> Esta seção permite gerenciar usuários e suas permissões.
                </p>
              </div>
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Usuários Ativos</h4>
                  <p className="text-sm text-gray-600">Visualizar e gerenciar usuários cadastrados</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Permissões</h4>
                  <p className="text-sm text-gray-600">Configurar níveis de acesso</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Banco de Dados</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800">
                  <strong>Cuidado:</strong> Operações de banco de dados podem afetar dados dos usuários.
                </p>
              </div>
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Backup</h4>
                  <p className="text-sm text-gray-600 mb-3">Criar backup dos dados</p>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Criar Backup
                  </button>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Limpeza</h4>
                  <p className="text-sm text-gray-600 mb-3">Limpar dados temporários</p>
                  <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors">
                    Limpar Cache
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hotmart' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Teste da Integração Hotmart</h3>
              
              {/* Botões de Teste */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Bug className="h-4 w-4 mr-2" />
                    Debug Variáveis de Ambiente
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">Verificar se as credenciais estão carregadas</p>
                  <button
                    onClick={handleDebugEnvironment}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Bug className="h-4 w-4 mr-2" />
                    Debug Variáveis
                  </button>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Testar Configuração
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">Validar credenciais e conexão</p>
                  <button
                    onClick={handleTestConfig}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Testar Configuração
                  </button>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Testar Email Específico
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">Buscar compra por email</p>
                  <div className="flex space-x-2">
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="email@exemplo.com"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleTestEmail}
                      disabled={isLoading}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Testar
                    </button>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Play className="h-4 w-4 mr-2" />
                    Executar Todos os Testes
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">Bateria completa de testes</p>
                  <button
                    onClick={handleRunAllTests}
                    disabled={isLoading}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {isLoading ? 'Executando...' : 'Executar Todos'}
                  </button>
                </div>
              </div>

              {/* Área de Resultados */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Resultados dos Testes</h4>
                  <button
                    onClick={clearResults}
                    className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Limpar
                  </button>
                </div>
                
                <div className="bg-white rounded border border-gray-200 p-3 max-h-40 overflow-y-auto">
                  {testResults.length === 0 ? (
                    <p className="text-gray-500 text-sm">Nenhum teste executado ainda. Execute um teste acima para ver os resultados.</p>
                  ) : (
                    <div className="space-y-1">
                      {testResults.map((result, index) => (
                        <div key={index} className="text-sm font-mono text-gray-700">
                          {result}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Instruções */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Como usar:</h4>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. <strong>Debug Variáveis:</strong> Primeiro, verifique se as credenciais estão carregadas</li>
                  <li>2. <strong>Testar Configuração:</strong> Valide se as credenciais estão corretas</li>
                  <li>3. <strong>Testar Email:</strong> Teste com um email real de comprador</li>
                  <li>4. <strong>Todos os Testes:</strong> Execute uma bateria completa</li>
                </ol>
                <p className="text-sm text-blue-700 mt-2">
                  <strong>Dica:</strong> Abra o console do navegador (F12) para ver logs detalhados dos testes.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}