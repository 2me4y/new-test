import pdfplumber
import re
import json
import os

# Имя твоего файла
PDF_FILE = 'questions.pdf' 
OUTPUT_FILE = 'quiz_from_pdf.json'

def parse_pdf_quiz(pdf_path):
    questions = []
    current_q = None

    if not os.path.exists(pdf_path):
        print(f"Ошибка: Файл {pdf_path} не найден!")
        return []

    print(f"Начинаю чтение файла: {pdf_path}...")

    with pdfplumber.open(pdf_path) as pdf:
        # Перебираем все страницы
        for page in pdf.pages:
            text = page.extract_text()
            if not text:
                continue
            
            # Разбиваем текст на строки
            lines = text.split('\n')
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue

                # 1. Поиск нового вопроса (начинается с цифры и точки, например "1. ", "25. ")
                # Регулярка: ^\d+\. ищет начало строки, цифры и точку
                if re.match(r'^\d+\.', line):
                    # Если был предыдущий вопрос, сохраняем его
                    if current_q:
                        questions.append(current_q)
                    
                    # Создаем новый
                    current_q = {
                        "question": line,
                        "options": [],
                        "correct_index": -1,
                        "correct_answer": None
                    }

                # 2. Поиск вариантов ответа (начинаются с "o " или "• ")
                elif line.startswith('o ') or line.startswith('•') or line.startswith('O ') or "•" in line:
                    # Если мы еще не нашли ни одного вопроса, пропускаем мусор в начале файла
                    if current_q is None:
                        continue

                    is_correct = '•' in line  # Если есть жирная точка — это правильный ответ
                    
                    # Очищаем текст от маркеров
                    clean_option = line.replace('o ', '').replace('•', '').replace('O ', '').strip()
                    
                    # Бывает, что парсер PDF склеивает "oOption", разделяем если нужно
                    if clean_option.startswith('o') and len(clean_option) > 1 and clean_option[1].isupper():
                         clean_option = clean_option[1:].strip()

                    current_q['options'].append(clean_option)

                    # Если вариант правильный, записываем его индекс
                    if is_correct:
                        idx = len(current_q['options']) - 1
                        current_q['correct_index'] = idx
                        current_q['correct_answer'] = clean_option
                
                # 3. Обработка длинных строк (если вопрос или ответ перенеслись на новую строку)
                # Это упрощенная логика: если строка не вопрос и не ответ, добавляем к предыдущему
                else:
                    if current_q and len(current_q['options']) == 0:
                        # Дописываем к тексту вопроса
                        current_q['question'] += " " + line
                    elif current_q and len(current_q['options']) > 0:
                        # Дописываем к последнему варианту ответа
                        last_idx = len(current_q['options']) - 1
                        current_q['options'][last_idx] += " " + line

    # Сохраняем последний вопрос
    if current_q:
        questions.append(current_q)

    return questions

# Запуск
if __name__ == "__main__":
    data = parse_pdf_quiz(PDF_FILE)
    
    if data:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        
        print(f"\nГотово! Найдено вопросов: {len(data)}")
        print(f"Результат сохранен в {OUTPUT_FILE}")
    else:
        print("Не удалось извлечь данные.")