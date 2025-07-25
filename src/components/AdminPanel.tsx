import React, { useState } from 'react';
import { Settings, Plus, Edit3, Save, X, Upload, Trash2, Eye, EyeOff, ArrowLeft, Video, MessageSquare } from 'lucide-react';
import { BonusResource, BonusLesson, QuizQuestion } from '../types';
import { bonusResources } from '../data/bonusData';
import { OnboardingVideo, PopupContent, getOnboardingVideos, getPopupContents, saveOnboardingVideos, savePopupContents } from '../data/onboardingData';
import { testHotmartConfig, testEmailSearch, runAllTests } from '../utils/hotmartTest';
import { debugEnvironmentVariables } from '../config/hotmart';

interface AdminPanelProps {
  isVisible: boolean;
  onToggle: () => void;
  userEmail: string;
}

export default function AdminPanel({ isVisible, onToggle, userEmail }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'bonuses' | 'lessons' | 'exercises' | 'onboarding' | 'popups' | 'hotmart'>('bonuses');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 left-6 z-50 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-all"
        title="Painel Admin"
      >
        <Settings className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Painel de Administração</h2>
              <p className="text-red-100 text-sm">Logado como: {userEmail}</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="p-2 text-red-100 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'bonuses', label: 'Gerenciar Bônus', icon: '🎁' },
              { id: 'lessons', label: 'Gerenciar Aulas', icon: '📚' },
              { id: 'exercises', label: 'Gerenciar Exercícios', icon: '🧠' },
              { id: 'onboarding', label: 'Comece por Aqui', icon: '🚀' },
              { id: 'popups', label: 'Pop-ups', icon: '💬' },
              { id: 'hotmart', label: 'Teste Hotmart', icon: '🔧' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'bonuses' && <BonusManagement />}
          {activeTab === 'lessons' && <LessonManagement />}
          {activeTab === 'exercises' && <ExerciseManagement />}
          {activeTab === 'onboarding' && <OnboardingManagement />}
          {activeTab === 'popups' && <PopupManagement />}
          {activeTab === 'hotmart' && <HotmartTestManagement />}
        </div>
      </div>
    </div>
  );
}

// Componente para gerenciar bônus
function BonusManagement() {
  const [editingBonus, setEditingBonus] = useState<BonusResource | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [bonusList, setBonusList] = useState<BonusResource[]>(() => {
    const saved = localStorage.getItem('teacherpoli_bonus_data');
    return saved ? JSON.parse(saved) : bonusResources;
  });

  const handleEdit = (bonus: BonusResource) => {
    setEditingBonus({ ...bonus });
  };

  const handleAddNew = () => {
    const newBonus: BonusResource = {
      id: `bonus-${Date.now()}`,
      title: 'Novo Bônus',
      description: 'Descrição do novo bônus',
      type: 'course',
      thumbnail: 'https://images.pexels.com/photos/4145190/pexels-photo-4145190.jpeg?auto=compress&cs=tinysrgb&w=800',
      totalLessons: 0,
      totalDuration: '0h',
      rating: 5.0,
      downloads: 0,
      lessons: []
    };
    setEditingBonus(newBonus);
    setShowAddForm(true);
  };
  const handleSave = () => {
    if (editingBonus) {
      let updatedBonusList;
      if (showAddForm) {
        // Adicionar novo bônus
        updatedBonusList = [...bonusList, editingBonus];
        setBonusList(updatedBonusList);
        setShowAddForm(false);
      } else {
        // Atualizar bônus existente
        updatedBonusList = bonusList.map(bonus => 
            bonus.id === editingBonus.id ? editingBonus : bonus
          );
        setBonusList(updatedBonusList);
      }
      
      // Salvar no localStorage para persistência
      localStorage.setItem('teacherpoli_bonus_data', JSON.stringify(updatedBonusList));
      
      // Forçar atualização na página principal
      window.dispatchEvent(new CustomEvent('bonusDataUpdated'));
      
      console.log('Salvando bônus:', editingBonus);
      setEditingBonus(null);
      alert(showAddForm ? 'Novo bônus criado com sucesso!' : 'Bônus atualizado com sucesso!');
    }
  };

  const handleCancel = () => {
    setEditingBonus(null);
    setShowAddForm(false);
  };

  const handleDelete = (bonusId: string) => {
    if (confirm('Tem certeza que deseja excluir este bônus? Esta ação não pode ser desfeita.')) {
      const updatedBonusList = bonusList.filter(bonus => bonus.id !== bonusId);
      setBonusList(updatedBonusList);
      localStorage.setItem('teacherpoli_bonus_data', JSON.stringify(updatedBonusList));
      
      // Forçar atualização na página principal
      window.dispatchEvent(new CustomEvent('bonusDataUpdated'));
      
      alert('Bônus excluído com sucesso!');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingBonus) {
      // Simular upload de imagem
      const imageUrl = URL.createObjectURL(file);
      setEditingBonus({ ...editingBonus, thumbnail: imageUrl });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Gerenciar Bônus</h3>
        <button
          onClick={handleAddNew}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Bônus
        </button>
      </div>

      {editingBonus ? (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">
              {showAddForm ? 'Criando Novo Bônus' : `Editando: ${editingBonus.title}`}
            </h4>
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
              <input
                type="text"
                value={editingBonus.title}
                onChange={(e) => setEditingBonus({ ...editingBonus, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ID do Bônus</label>
              <input
                type="text"
                value={editingBonus.id}
                onChange={(e) => setEditingBonus({ ...editingBonus, id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="bonus-exemplo"
                disabled={!showAddForm}
                title={!showAddForm ? "ID não pode ser alterado após criação" : ""}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
              <select
                value={editingBonus.type}
                onChange={(e) => setEditingBonus({ ...editingBonus, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="course">Curso</option>
                <option value="ebook">E-book</option>
                <option value="guide">Guia</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
              <textarea
                value={editingBonus.description}
                onChange={(e) => setEditingBonus({ ...editingBonus, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duração Total</label>
              <input
                type="text"
                value={editingBonus.totalDuration}
                onChange={(e) => setEditingBonus({ ...editingBonus, totalDuration: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Ex: 4h 30min"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total de Aulas</label>
              <input
                type="number"
                min="0"
                value={editingBonus.totalLessons}
                onChange={(e) => setEditingBonus({ ...editingBonus, totalLessons: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Avaliação</label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={editingBonus.rating}
                onChange={(e) => setEditingBonus({ ...editingBonus, rating: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Downloads</label>
              <input
                type="number"
                min="0"
                value={editingBonus.downloads}
                onChange={(e) => setEditingBonus({ ...editingBonus, downloads: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Imagem de Capa</label>
              <div className="flex items-center space-x-4">
                <img 
                  src={editingBonus.thumbnail} 
                  alt="Preview" 
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <label className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg cursor-pointer transition-colors">
                  <Upload className="h-4 w-4 inline mr-2" />
                  Alterar Imagem
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {showAddForm ? 'Criar Bônus' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bonusList.map((bonus) => (
            <div key={bonus.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <img 
                src={bonus.thumbnail} 
                alt={bonus.title}
                className="w-full h-32 object-cover rounded-lg mb-3"
              />
              <h4 className="font-semibold text-gray-900 mb-2">{bonus.title}</h4>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{bonus.description}</p>
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  <div>{bonus.totalLessons} aulas</div>
                  <div>{bonus.downloads} downloads</div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(bonus)}
                    className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(bonus.id)}
                    className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors flex items-center"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Componente para gerenciar aulas
function LessonManagement() {
  const [selectedBonus, setSelectedBonus] = useState<string>('');
  const [editingLesson, setEditingLesson] = useState<BonusLesson | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const selectedBonusData = bonusResources.find(b => b.id === selectedBonus);

  const handleEditLesson = (lesson: BonusLesson) => {
    setEditingLesson({ ...lesson });
  };

  const handleSaveLesson = () => {
    if (editingLesson) {
      console.log('Salvando aula:', editingLesson);
      setEditingLesson(null);
      alert('Aula salva com sucesso!');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Gerenciar Aulas</h3>
        <div className="flex space-x-3">
          <select
            value={selectedBonus}
            onChange={(e) => setSelectedBonus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">Selecione um bônus</option>
            {bonusResources.map((bonus) => (
              <option key={bonus.id} value={bonus.id}>{bonus.title}</option>
            ))}
          </select>
          {selectedBonus && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Aula
            </button>
          )}
        </div>
      </div>

      {editingLesson ? (
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-4">Editando: {editingLesson.title}</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Título da Aula</label>
              <input
                type="text"
                value={editingLesson.title}
                onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
              <textarea
                value={editingLesson.description}
                onChange={(e) => setEditingLesson({ ...editingLesson, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL do Vídeo</label>
                <input
                  type="url"
                  value={editingLesson.videoUrl}
                  onChange={(e) => setEditingLesson({ ...editingLesson, videoUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="https://www.youtube.com/embed/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duração</label>
                <input
                  type="text"
                  value={editingLesson.duration}
                  onChange={(e) => setEditingLesson({ ...editingLesson, duration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Ex: 25:30"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Conteúdo da Aula</label>
              <textarea
                value={editingLesson.textContent}
                onChange={(e) => setEditingLesson({ ...editingLesson, textContent: e.target.value })}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm"
                placeholder="Digite o conteúdo em markdown..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setEditingLesson(null)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveLesson}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </button>
          </div>
        </div>
      ) : selectedBonusData ? (
        <div className="space-y-4">
          {selectedBonusData.lessons.map((lesson, index) => (
            <div key={lesson.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {index + 1}. {lesson.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">{lesson.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>⏱️ {lesson.duration}</span>
                    <span>🧠 {lesson.exercises.length} exercícios</span>
                    <span className={lesson.completed ? 'text-green-600' : 'text-gray-400'}>
                      {lesson.completed ? '✅ Concluída' : '⏳ Pendente'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleEditLesson(lesson)}
                  className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors flex items-center"
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>Selecione um bônus para gerenciar suas aulas</p>
        </div>
      )}
    </div>
  );
}

// Componente para gerenciar exercícios
function ExerciseManagement() {
  const [selectedBonus, setSelectedBonus] = useState<string>('');
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [editingExercise, setEditingExercise] = useState<QuizQuestion | null>(null);

  const selectedBonusData = bonusResources.find(b => b.id === selectedBonus);
  const selectedLessonData = selectedBonusData?.lessons.find(l => l.id === selectedLesson);

  const handleEditExercise = (exercise: QuizQuestion) => {
    setEditingExercise({ ...exercise });
  };

  const handleSaveExercise = () => {
    if (editingExercise) {
      console.log('Salvando exercício:', editingExercise);
      setEditingExercise(null);
      alert('Exercício salvo com sucesso!');
    }
  };

  const addNewOption = () => {
    if (editingExercise) {
      setEditingExercise({
        ...editingExercise,
        options: [...editingExercise.options, '']
      });
    }
  };

  const removeOption = (index: number) => {
    if (editingExercise && editingExercise.options.length > 2) {
      const newOptions = editingExercise.options.filter((_, i) => i !== index);
      setEditingExercise({
        ...editingExercise,
        options: newOptions,
        correctAnswer: editingExercise.correctAnswer >= index ? Math.max(0, editingExercise.correctAnswer - 1) : editingExercise.correctAnswer
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Gerenciar Exercícios</h3>
        <div className="flex space-x-3">
          <select
            value={selectedBonus}
            onChange={(e) => {
              setSelectedBonus(e.target.value);
              setSelectedLesson('');
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">Selecione um bônus</option>
            {bonusResources.map((bonus) => (
              <option key={bonus.id} value={bonus.id}>{bonus.title}</option>
            ))}
          </select>
          
          {selectedBonusData && (
            <select
              value={selectedLesson}
              onChange={(e) => setSelectedLesson(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Selecione uma aula</option>
              {selectedBonusData.lessons.map((lesson, index) => (
                <option key={lesson.id} value={lesson.id}>
                  {index + 1}. {lesson.title}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {editingExercise ? (
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-4">Editando Exercício</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pergunta</label>
              <textarea
                value={editingExercise.question}
                onChange={(e) => setEditingExercise({ ...editingExercise, question: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Opções de Resposta</label>
              {editingExercise.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={editingExercise.correctAnswer === index}
                    onChange={() => setEditingExercise({ ...editingExercise, correctAnswer: index })}
                    className="text-red-600"
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...editingExercise.options];
                      newOptions[index] = e.target.value;
                      setEditingExercise({ ...editingExercise, options: newOptions });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder={`Opção ${index + 1}`}
                  />
                  {editingExercise.options.length > 2 && (
                    <button
                      onClick={() => removeOption(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addNewOption}
                className="text-red-600 hover:text-red-800 text-sm flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Opção
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Explicação</label>
              <textarea
                value={editingExercise.explanation || ''}
                onChange={(e) => setEditingExercise({ ...editingExercise, explanation: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Explicação da resposta correta (opcional)"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setEditingExercise(null)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveExercise}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </button>
          </div>
        </div>
      ) : selectedLessonData ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-blue-900">
              Aula: {selectedLessonData.title}
            </h4>
            <p className="text-blue-700 text-sm">{selectedLessonData.exercises.length} exercícios</p>
          </div>
          
          {selectedLessonData.exercises.map((exercise, index) => (
            <div key={exercise.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Exercício {index + 1}
                  </h4>
                  <p className="text-sm text-gray-700 mb-2">{exercise.question}</p>
                  <div className="text-xs text-gray-500">
                    {exercise.options.length} opções • Resposta correta: {exercise.options[exercise.correctAnswer]}
                  </div>
                </div>
                <button
                  onClick={() => handleEditExercise(exercise)}
                  className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors flex items-center"
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>Selecione um bônus e uma aula para gerenciar os exercícios</p>
        </div>
      )}
    </div>
  );
}

// Componente para gerenciar área "Comece por Aqui"
function OnboardingManagement() {
  const [videos, setVideos] = useState<OnboardingVideo[]>(getOnboardingVideos());
  const [editingVideo, setEditingVideo] = useState<OnboardingVideo | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleEditVideo = (video: OnboardingVideo) => {
    setEditingVideo({ ...video });
  };

  const handleAddNew = () => {
    const newVideo: OnboardingVideo = {
      id: `video-${Date.now()}`,
      title: 'Nova Aula',
      description: 'Descrição da nova aula',
      duration: '0:00',
      completed: false,
      locked: false,
      embedUrl: 'https://www.youtube.com/embed/'
    };
    setEditingVideo(newVideo);
    setShowAddForm(true);
  };

  const handleSave = () => {
    if (editingVideo) {
      let updatedVideos;
      if (showAddForm) {
        updatedVideos = [...videos, editingVideo];
        setShowAddForm(false);
      } else {
        updatedVideos = videos.map(video => 
          video.id === editingVideo.id ? editingVideo : video
        );
      }
      
      setVideos(updatedVideos);
      saveOnboardingVideos(updatedVideos);
      
      // Forçar atualização na página principal
      window.dispatchEvent(new CustomEvent('onboardingDataUpdated'));
      
      setEditingVideo(null);
      alert(showAddForm ? 'Nova aula criada com sucesso!' : 'Aula atualizada com sucesso!');
    }
  };

  const handleDelete = (videoId: string) => {
    if (confirm('Tem certeza que deseja excluir esta aula? Esta ação não pode ser desfeita.')) {
      const updatedVideos = videos.filter(video => video.id !== videoId);
      setVideos(updatedVideos);
      saveOnboardingVideos(updatedVideos);
      
      // Forçar atualização na página principal
      window.dispatchEvent(new CustomEvent('onboardingDataUpdated'));
      
      alert('Aula excluída com sucesso!');
    }
  };

  const handleCancel = () => {
    setEditingVideo(null);
    setShowAddForm(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Gerenciar "Comece por Aqui"</h3>
        <button
          onClick={handleAddNew}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Aula
        </button>
      </div>

      {editingVideo ? (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">
              {showAddForm ? 'Criando Nova Aula' : `Editando: ${editingVideo.title}`}
            </h4>
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
              <input
                type="text"
                value={editingVideo.title}
                onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duração</label>
              <input
                type="text"
                value={editingVideo.duration}
                onChange={(e) => setEditingVideo({ ...editingVideo, duration: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Ex: 5:30"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
              <textarea
                value={editingVideo.description}
                onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">URL do Vídeo (YouTube Embed)</label>
              <input
                type="url"
                value={editingVideo.embedUrl}
                onChange={(e) => setEditingVideo({ ...editingVideo, embedUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="https://www.youtube.com/embed/VIDEO_ID"
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingVideo.locked}
                  onChange={(e) => setEditingVideo({ ...editingVideo, locked: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Aula bloqueada</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {showAddForm ? 'Criar Aula' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map((video, index) => (
            <div key={video.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {index + 1}. {video.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">{video.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>⏱️ {video.duration}</span>
                    <span className={video.locked ? 'text-red-600' : 'text-green-600'}>
                      {video.locked ? '🔒 Bloqueada' : '🔓 Liberada'}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditVideo(video)}
                    className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(video.id)}
                    className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors flex items-center"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Componente para gerenciar pop-ups
function PopupManagement() {
  const [popups, setPopups] = useState<PopupContent[]>(getPopupContents());
  const [editingPopup, setEditingPopup] = useState<PopupContent | null>(null);

  const handleEditPopup = (popup: PopupContent) => {
    setEditingPopup({ ...popup });
  };

  const handleSave = () => {
    if (editingPopup) {
      const updatedPopups = popups.map(popup => 
        popup.id === editingPopup.id ? editingPopup : popup
      );
      
      setPopups(updatedPopups);
      savePopupContents(updatedPopups);
      
      // Forçar atualização na página principal
      window.dispatchEvent(new CustomEvent('popupDataUpdated'));
      
      setEditingPopup(null);
      alert('Pop-up atualizado com sucesso!');
    }
  };

  const handleCancel = () => {
    setEditingPopup(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingPopup) {
      const imageUrl = URL.createObjectURL(file);
      setEditingPopup({ ...editingPopup, imageUrl });
    }
  };

  const addFeature = () => {
    if (editingPopup) {
      setEditingPopup({
        ...editingPopup,
        features: [...editingPopup.features, '']
      });
    }
  };

  const removeFeature = (index: number) => {
    if (editingPopup && editingPopup.features.length > 1) {
      const newFeatures = editingPopup.features.filter((_, i) => i !== index);
      setEditingPopup({ ...editingPopup, features: newFeatures });
    }
  };

  const updateFeature = (index: number, value: string) => {
    if (editingPopup) {
      const newFeatures = [...editingPopup.features];
      newFeatures[index] = value;
      setEditingPopup({ ...editingPopup, features: newFeatures });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Gerenciar Pop-ups</h3>
      </div>

      {editingPopup ? (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">
              Editando: {editingPopup.type === 'welcome' ? 'Pop-up de Boas-vindas' : 'Pop-up Plano Obrigatório'}
            </h4>
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Título Principal</label>
                <input
                  type="text"
                  value={editingPopup.title}
                  onChange={(e) => setEditingPopup({ ...editingPopup, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Use {userName} para nome do usuário"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subtítulo</label>
                <input
                  type="text"
                  value={editingPopup.subtitle}
                  onChange={(e) => setEditingPopup({ ...editingPopup, subtitle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
              <textarea
                value={editingPopup.description}
                onChange={(e) => setEditingPopup({ ...editingPopup, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Texto do Botão</label>
              <input
                type="text"
                value={editingPopup.buttonText}
                onChange={(e) => setEditingPopup({ ...editingPopup, buttonText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Características/Benefícios</label>
              {editingPopup.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder={`Característica ${index + 1}`}
                  />
                  {editingPopup.features.length > 1 && (
                    <button
                      onClick={() => removeFeature(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addFeature}
                className="text-red-600 hover:text-red-800 text-sm flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Característica
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Imagem</label>
                <div className="flex items-center space-x-4">
                  {editingPopup.imageUrl && (
                    <img 
                      src={editingPopup.imageUrl} 
                      alt="Preview" 
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <label className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg cursor-pointer transition-colors">
                    <Upload className="h-4 w-4 inline mr-2" />
                    {editingPopup.imageUrl ? 'Alterar Imagem' : 'Adicionar Imagem'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL do Vídeo (opcional)</label>
                <input
                  type="url"
                  value={editingPopup.videoUrl || ''}
                  onChange={(e) => setEditingPopup({ ...editingPopup, videoUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="https://www.youtube.com/embed/VIDEO_ID"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {popups.map((popup) => (
            <div key={popup.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {popup.type === 'welcome' ? 'Pop-up de Boas-vindas' : 'Pop-up Plano Obrigatório'}
                    </h4>
                    <p className="text-sm text-gray-500">{popup.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleEditPopup(popup)}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Editar
                </button>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Título:</strong> {popup.title}</p>
                <p><strong>Características:</strong> {popup.features.length} itens</p>
                <p><strong>Botão:</strong> {popup.buttonText}</p>
                {popup.imageUrl && <p><strong>Imagem:</strong> ✅ Configurada</p>}
                {popup.videoUrl && <p><strong>Vídeo:</strong> ✅ Configurado</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Componente para testar integração Hotmart
function HotmartTestManagement() {
  const [testEmail, setTestEmail] = useState('');
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleConfigTest = () => {
    setTestResults([]);
    addResult('Testando configuração...');
    
    // Capturar logs do console
    const originalLog = console.log;
    console.log = (...args) => {
      addResult(args.join(' '));
      originalLog(...args);
    };
    
    testHotmartConfig();
    
    // Restaurar console.log
    console.log = originalLog;
  };

  const handleEmailTest = async () => {
    if (!testEmail.trim()) {
      addResult('❌ Digite um email para testar');
      return;
    }

    setIsLoading(true);
    setTestResults([]);
    addResult(`Testando email: ${testEmail}`);

    // Capturar logs do console
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      addResult(args.join(' '));
      originalLog(...args);
    };
    
    console.error = (...args) => {
      addResult(`❌ ${args.join(' ')}`);
      originalError(...args);
    };

    try {
      await testEmailSearch(testEmail);
    } catch (error) {
      addResult(`❌ Erro: ${error}`);
    } finally {
      // Restaurar console
      console.log = originalLog;
      console.error = originalError;
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-6">Teste de Integração Hotmart</h3>
      
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold mb-4">Teste de Configuração</h4>
          <div className="space-y-3">
            <button
              onClick={() => {
                console.log('🔧 Testando configuração da Hotmart...');
                testHotmartConfig();
              }}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Testar Configuração
            </button>
            
            <button
              onClick={() => {
                console.log('🔧 Debug das variáveis de ambiente...');
                debugEnvironmentVariables();
              }}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Debug Variáveis de Ambiente
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold mb-4">Teste de Busca por Email</h4>
          <div className="space-y-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Digite um email para testar"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleEmailTest}
              disabled={isLoading}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Testando...' : 'Testar Email'}
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold mb-4">Resultados dos Testes</h4>
          <div className="bg-gray-100 rounded-lg p-4 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">Nenhum teste executado ainda</p>
            ) : (
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setTestResults([])}
            className="mt-3 text-gray-600 hover:text-gray-800 text-sm"
          >
            Limpar Resultados
          </button>
        </div>
      </div>
    </div>
  );
}