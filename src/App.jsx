import React, { useState } from 'react';
import { Shuffle, List, RotateCcw, CheckCircle, XCircle, CheckSquare, Square, Image as ImageIcon, Moon, Sun } from 'lucide-react';
import rawQuestions from './loool.json'; 

const PhilosophyQuiz = () => {
  // ИСПРАВЛЕНИЕ: Превращаем correct_index в correct, чтобы код понимал
  const [questions] = useState(rawQuestions.map(q => ({
    ...q,
    // Если в данных есть correct_index, используем его, иначе берем старый correct или correct_answer
    correct: q.correct_index !== undefined 
             ? q.correct_index 
             : (q.correct !== undefined ? q.correct : q.correct_answer)
  })));

  const [mode, setMode] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // --- НОВЫЕ СОСТОЯНИЯ ---
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false); // Темная тема
  // -----------------------

  const [showResult, setShowResult] = useState(false);
  const [incorrectQuestions, setIncorrectQuestions] = useState([]);
  const [questionOrder, setQuestionOrder] = useState([]);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 });
  
  const [showRangeInput, setShowRangeInput] = useState(false);
  const [startQuestion, setStartQuestion] = useState(1);
  const [endQuestion, setEndQuestion] = useState(questions.length);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);

  // Переключение темы
  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Классы для стилей (чтобы не писать длинные условия в верстке)
  const theme = {
    bg: isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50',
    card: isDarkMode ? 'bg-gray-800 border border-gray-700 shadow-2xl' : 'bg-white shadow-xl',
    textMain: isDarkMode ? 'text-gray-100' : 'text-gray-800',
    textSec: isDarkMode ? 'text-gray-400' : 'text-gray-600',
    input: isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-400' : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500',
    btnSecondary: isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    optionDefault: isDarkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-200' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50 text-gray-800',
    optionSelected: isDarkMode ? 'border-indigo-500 bg-indigo-900/30' : 'border-indigo-500 bg-indigo-50',
    
    // Результаты (адаптированные цвета)
    successBg: isDarkMode ? 'bg-green-900/30 border-green-800' : 'bg-green-50 border-green-200',
    successText: isDarkMode ? 'text-green-400' : 'text-green-800',
    errorBg: isDarkMode ? 'bg-red-900/30 border-red-800' : 'bg-red-50 border-red-200',
    errorText: isDarkMode ? 'text-red-400' : 'text-red-800',
    errorSubText: isDarkMode ? 'text-red-300' : 'text-red-700',
  };

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const createShuffledQuestion = (question) => {
    if (question.type === 'input') return question;

    const optionsWithIndex = question.options.map((opt, idx) => ({ text: opt, originalIndex: idx }));
    const shuffled = shuffleArray(optionsWithIndex);

    let newCorrect;
    if (question.type === 'multiple_select' && Array.isArray(question.correct)) {
        newCorrect = question.correct.map(origIdx => 
            shuffled.findIndex(opt => opt.originalIndex === origIdx)
        ).sort((a, b) => a - b);
    } else {
        newCorrect = shuffled.findIndex(opt => opt.originalIndex === question.correct);
    }

    return {
      ...question,
      options: shuffled.map(opt => opt.text),
      correct: newCorrect
    };
  };

  const resetAnswerState = () => {
    setSelectedIndices([]);
    setTextInput('');
    setShowResult(false);
  };

  const startQuiz = (quizMode) => {
    if (quizMode === 'sequential' || quizMode === 'random-range') {
      setShowRangeInput(true);
      setMode(quizMode);
      return;
    }
    
    setMode(quizMode);
    setCurrentIndex(0);
    resetAnswerState();
    setIncorrectQuestions([]);
    setStats({ correct: 0, incorrect: 0 });
    
    const shuffled = [...Array(questions.length).keys()].sort(() => Math.random() - 0.5);
    setQuestionOrder(shuffled);
    
    if (shuffleOptions) {
      setShuffledQuestions(questions.map(q => createShuffledQuestion(q)));
    } else {
      setShuffledQuestions(questions);
    }
  };

  const startSequentialQuiz = () => {
    const start = Math.max(1, Math.min(startQuestion || 1, questions.length));
    const end = Math.max(start, Math.min(endQuestion || questions.length, questions.length));
    
    setCurrentIndex(0);
    resetAnswerState();
    setIncorrectQuestions([]);
    setStats({ correct: 0, incorrect: 0 });
    setShowRangeInput(false);
    
    const range = [];
    for (let i = start - 1; i < end; i++) {
      range.push(i);
    }
    
    if (mode === 'random-range') {
      setQuestionOrder(shuffleArray(range));
    } else {
      setQuestionOrder(range);
    }
    
    if (shuffleOptions) {
      setShuffledQuestions(questions.map(q => createShuffledQuestion(q)));
    } else {
      setShuffledQuestions(questions);
    }
  };

  const handleOptionClick = (index, type) => {
    if (showResult) return;

    if (type === 'multiple_select') {
        if (selectedIndices.includes(index)) {
            setSelectedIndices(selectedIndices.filter(i => i !== index));
        } else {
            setSelectedIndices([...selectedIndices, index]);
        }
    } else {
        setSelectedIndices([index]);
        checkAnswer([index], type);
    }
  };

  const manualSubmit = () => {
    if (showResult) return;
    const currentQ = getCurrentQuestion();
    
    if (currentQ.type === 'input') {
        checkAnswer(textInput.trim(), 'input');
    } else {
        checkAnswer(selectedIndices, 'multiple_select');
    }
  };

  const checkAnswer = (userAnswer, type) => {
    setShowResult(true);
    const currentQ = getCurrentQuestion();
    let isCorrect = false;

    if (type === 'input') {
        isCorrect = userAnswer.toLowerCase() === String(currentQ.correct).toLowerCase();
    } else if (type === 'multiple_select') {
        const userSorted = [...userAnswer].sort((a, b) => a - b).toString();
        const correctSorted = [...currentQ.correct].sort((a, b) => a - b).toString();
        isCorrect = userSorted === correctSorted;
    } else {
        isCorrect = userAnswer[0] === currentQ.correct;
    }

    if (isCorrect) {
      setStats(prev => ({ ...prev, correct: prev.correct + 1 }));
      // МГНОВЕННЫЙ ПЕРЕХОД (без setTimeout)
      nextQuestion();
    } else {
      setStats(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
      if (!incorrectQuestions.includes(questionOrder[currentIndex])) {
        setIncorrectQuestions(prev => [...prev, questionOrder[currentIndex]]);
      }
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questionOrder.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetAnswerState();
    } else if (incorrectQuestions.length > 0) {
      const newOrder = mode === 'random' || mode === 'random-range'
        ? shuffleArray(incorrectQuestions)
        : incorrectQuestions;
      setQuestionOrder(newOrder);
      setIncorrectQuestions([]);
      setCurrentIndex(0);
      resetAnswerState();
    }
  };

  const resetQuiz = () => {
    setMode(null);
    setCurrentIndex(0);
    resetAnswerState();
    setIncorrectQuestions([]);
    setQuestionOrder([]);
    setStats({ correct: 0, incorrect: 0 });
    setShowRangeInput(false);
    setShuffledQuestions([]);
  };

  const getCurrentQuestion = () => {
    if (shuffledQuestions.length === 0) return questions[0];
    return shuffledQuestions[questionOrder[currentIndex]];
  };

  // --- КОМПОНЕНТ ПЕРЕКЛЮЧАТЕЛЯ ТЕМЫ ---
  const ThemeToggle = () => (
    <button 
      onClick={toggleTheme} 
      className={`absolute top-4 right-4 p-2 rounded-full transition-all ${isDarkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-white text-orange-500 shadow-md hover:bg-gray-100'}`}
    >
      {isDarkMode ? <Moon size={24} /> : <Sun size={24} />}
    </button>
  );

  if (showRangeInput) {
    return (
      <div className={`min-h-screen ${theme.bg} p-8 transition-colors duration-300`}>
        <ThemeToggle />
        <div className="max-w-2xl mx-auto">
          <div className={`${theme.card} rounded-2xl p-8 transition-colors duration-300`}>
            <h2 className={`text-3xl font-bold text-center mb-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent`}>
              Выберите диапазон
            </h2>
            <p className={`text-center mb-8 ${theme.textSec}`}>Всего доступно: {questions.length}</p>
            
            {shuffleOptions && (
              <div className={`mb-6 p-3 border rounded-lg text-center ${isDarkMode ? 'bg-green-900/20 border-green-800 text-green-400' : 'bg-green-50 border-green-200 text-green-700'}`}>
                <p className="text-sm">✓ Варианты ответов будут перемешаны</p>
              </div>
            )}
            
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme.textSec}`}>С вопроса:</label>
                <input
                  type="number" min="1" max={questions.length}
                  value={startQuestion}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStartQuestion(val === '' ? '' : parseInt(val) || 1);
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-colors ${theme.input}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme.textSec}`}>До вопроса:</label>
                <input
                  type="number" min="1" max={questions.length}
                  value={endQuestion}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEndQuestion(val === '' ? '' : parseInt(val) || 1);
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-colors ${theme.input}`}
                />
              </div>
              
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setShowRangeInput(false); setMode(null); }} className={`flex-1 font-semibold py-3 px-6 rounded-lg transition-colors ${theme.btnSecondary}`}>Назад</button>
                <button onClick={startSequentialQuiz} className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">Начать</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!mode) {
    return (
      <div className={`min-h-screen ${theme.bg} p-8 transition-colors duration-300`}>
        <ThemeToggle />
        <div className="max-w-2xl mx-auto">
          <div className={`${theme.card} rounded-2xl p-8 transition-colors duration-300`}>
            <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              MOOK ТЕСТ ЕБАНАЖИЗНЬ
            </h1>
            <p className={`text-center mb-8 ${theme.textSec}`}>Выберите режим</p>
            
            <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={shuffleOptions} onChange={(e) => setShuffleOptions(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500" />
                <span className={`font-medium ${theme.textMain}`}>🔀 Перемешать варианты ответов</span>
              </label>
            </div>
            
            <div className="space-y-4">
              <button onClick={() => startQuiz('sequential')} className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-6 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3">
                <List size={24} />
                <div className="text-left"><div className="text-lg">По порядку</div><div className="text-sm opacity-90">Идти по списку вопросов</div></div>
              </button>
              <button onClick={() => startQuiz('random-range')} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-6 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3">
                <Shuffle size={24} />
                <div className="text-left"><div className="text-lg">Случайный (Диапазон)</div><div className="text-sm opacity-90">Выбрать часть и перемешать</div></div>
              </button>
              <button onClick={() => startQuiz('random')} className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold py-6 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3">
                <Shuffle size={24} />
                <div className="text-left"><div className="text-lg">Все вопросы случайно</div><div className="text-sm opacity-90">Полный хаос</div></div>
              </button>
            </div>
            <div className={`mt-6 text-center ${theme.textSec}`}><p className="text-sm">Всего вопросов: {questions.length}</p></div>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = getCurrentQuestion();
  const progress = ((currentIndex + 1) / questionOrder.length) * 100;
  const isMulti = currentQ.type === 'multiple_select';

  return (
    <div className={`min-h-screen ${theme.bg} p-4 md:p-8 transition-colors duration-300`}>
      <ThemeToggle />
      <div className="max-w-4xl mx-auto">
        <div className={`${theme.card} rounded-2xl p-6 md:p-8 transition-colors duration-300`}>
          
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <button onClick={resetQuiz} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${theme.btnSecondary}`}>
                <RotateCcw size={18} /><span className="hidden sm:inline">Меню</span>
              </button>
            </div>
            <div className="flex gap-4 text-sm font-bold">
              <div className={`flex items-center gap-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}><CheckCircle size={18} /><span>{stats.correct}</span></div>
              <div className={`flex items-center gap-1 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}><XCircle size={18} /><span>{stats.incorrect}</span></div>
            </div>
          </div>

          <div className="mb-6">
            <div className={`flex justify-between text-sm mb-2 ${theme.textSec}`}>
              <span>Вопрос {currentIndex + 1} из {questionOrder.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            {incorrectQuestions.length > 0 && (
              <div className="mt-2 text-xs text-orange-500">📝 Повтор ошибок: {incorrectQuestions.length}</div>
            )}
          </div>

          <div className="mb-8">
             {currentQ.image && (
                <div className={`mb-6 flex justify-center p-4 rounded-lg border ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                  <img 
                      src={import.meta.env.BASE_URL + currentQ.image.replace(/^\//, '')} 
                      alt="Task" 
                      className="max-h-80 object-contain rounded shadow-sm" 
                  />
                </div>
             )}
             
            <h2 className={`text-xl md:text-2xl font-semibold mb-4 ${theme.textMain}`}>{currentQ.question}</h2>
            {isMulti && <span className={`inline-block text-xs px-2 py-1 rounded-full font-bold mb-4 ${isDarkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>Выберите несколько</span>}
            {currentQ.type === 'input' && <span className={`inline-block text-xs px-2 py-1 rounded-full font-bold mb-4 ${isDarkMode ? 'bg-orange-900 text-orange-300' : 'bg-orange-100 text-orange-700'}`}>Впишите ответ</span>}

            <div className="space-y-3">
              {currentQ.type === 'input' ? (
                <div className="space-y-4">
                   <input type="text" value={textInput} onChange={e => setTextInput(e.target.value)} placeholder="Введите ответ..." disabled={showResult} className={`w-full p-4 border-2 rounded-lg text-lg outline-none transition ${theme.input}`} onKeyDown={(e) => e.key === 'Enter' && manualSubmit()} />
                </div>
              ) : (
                currentQ.options.map((option, index) => {
                    const isSelected = selectedIndices.includes(index);
                    
                    let borderClass = theme.optionDefault;
                    let icon = isMulti ? (isSelected ? <CheckSquare className="text-indigo-500"/> : <Square className="text-gray-400"/>) : null;
                    
                    if (showResult) {
                        const isCorrectIndex = isMulti ? currentQ.correct.includes(index) : currentQ.correct === index;
                        if (isCorrectIndex) { 
                            borderClass = `border-green-500 ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`; 
                            icon = <CheckCircle className={isDarkMode ? 'text-green-400' : 'text-green-600'} size={20}/>; 
                        } 
                        else if (isSelected && !isCorrectIndex) { 
                            borderClass = `border-red-500 ${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'}`; 
                            icon = <XCircle className={isDarkMode ? 'text-red-400' : 'text-red-600'} size={20}/>; 
                        }
                    } else if (isSelected) {
                        borderClass = theme.optionSelected;
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => handleOptionClick(index, currentQ.type)}
                        disabled={showResult}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex justify-between items-center ${borderClass} ${showResult ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span className={`font-medium ${theme.textMain}`}>{option}</span>
                        {icon}
                      </button>
                    );
                })
              )}
            </div>

            {!showResult && (currentQ.type === 'input' || isMulti) && (
                <button onClick={manualSubmit} className="mt-6 w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition transform active:scale-[0.99]">Ответить</button>
            )}
          </div>

          {showResult && (
            <div className="space-y-4">
               {(() => {
                   const isCorrect = currentQ.type === 'input' 
                      ? textInput.toLowerCase() === String(currentQ.correct).toLowerCase()
                      : (isMulti 
                          ? [...selectedIndices].sort().toString() === [...currentQ.correct].sort().toString()
                          : selectedIndices[0] === currentQ.correct);
                   if (isCorrect) {
                       return <div className={`p-4 border rounded-lg flex items-center gap-2 font-bold ${theme.successBg} ${theme.successText}`}><CheckCircle size={20}/> Правильно! 🎉</div>
                   } else {
                       return (
                           <div className={`p-4 border rounded-lg ${theme.errorBg}`}>
                               <p className={`font-semibold flex items-center gap-2 mb-2 ${theme.errorText}`}><XCircle size={20}/> Неправильно</p>
                               <p className={`text-sm ${theme.errorSubText}`}>Правильный ответ: <strong>{currentQ.type === 'input' ? currentQ.correct : (isMulti ? currentQ.correct.map(i => currentQ.options[i]).join(', ') : currentQ.options[currentQ.correct])}</strong></p>
                           </div>
                       )
                   }
               })()}
              <button onClick={nextQuestion} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all">{currentIndex < questionOrder.length - 1 ? 'Следующий вопрос →' : incorrectQuestions.length > 0 ? 'Повторить неправильные →' : 'Завершить тест ✓'}</button>
            </div>
          )}
          
          {currentIndex === questionOrder.length - 1 && showResult && incorrectQuestions.length === 0 && (
            <div className={`mt-6 p-6 border rounded-lg text-center ${isDarkMode ? 'bg-green-900/20 border-green-800' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'}`}>
              <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-green-400' : 'text-green-800'}`}>Поздравляем! 🎊</h3>
              <p className={isDarkMode ? 'text-green-300' : 'text-green-700'}>Вы прошли весь тест!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhilosophyQuiz;