export type Project = 'BFLsoft' | 'КБ';

export interface Operation {
  id: string;
  guid: string;
  fio: string;
  date: string; // ISO yyyy-mm-dd
  docType: string;
  operation: string;
  model: string;
  project: Project;
  cost: number; // ₽
}

const FIO = [
  'Иванов А. С.', 'Петрова М. В.', 'Сидоров К. Н.', 'Кузнецова Е. А.',
  'Смирнов Д. И.', 'Волкова О. П.', 'Морозов Р. Т.', 'Новикова Л. Г.',
  'Фёдоров П. М.', 'Соколова Н. Д.',
];

const DOC_TYPES = ['Паспорт', 'Договор', 'Счёт-фактура', 'Доверенность', 'Акт', 'Справка'];
const OPERATIONS = [
  'Распознавание текста', 'Извлечение полей', 'Классификация', 'Верификация подписи', 'Анализ таблиц',
];
const MODELS = ['GPT-4o Vision', 'Claude Vision', 'Yandex OCR', 'Tesseract Pro', 'Gemini Vision'];
const PROJECTS: Project[] = ['BFLsoft', 'КБ'];

function uuid(seed: number): string {
  const hex = (n: number, len: number) =>
    Math.abs(Math.floor(Math.sin(seed * n) * 0xffffffff)).toString(16).padStart(len, '0').slice(0, len);
  return `${hex(1, 8)}-${hex(2, 4)}-4${hex(3, 3)}-a${hex(4, 3)}-${hex(5, 12)}`;
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.floor(Math.abs(Math.sin(seed) * 10000)) % arr.length];
}

// Generate ~60 days of operations
function generate(): Operation[] {
  const ops: Operation[] = [];
  const today = new Date('2026-06-15');
  let id = 1;
  for (let d = 60; d >= 0; d--) {
    const day = new Date(today);
    day.setDate(today.getDate() - d);
    const iso = day.toISOString().slice(0, 10);
    const count = 2 + (Math.floor(Math.abs(Math.sin(d * 1.7) * 100)) % 6);
    for (let i = 0; i < count; i++) {
      const s = id * 13.37;
      const model = pick(MODELS, s + 5);
      const base = { 'GPT-4o Vision': 4.2, 'Claude Vision': 3.8, 'Yandex OCR': 1.5, 'Tesseract Pro': 0.8, 'Gemini Vision': 2.9 }[model] || 2;
      const cost = +(base * (0.6 + Math.abs(Math.sin(s)) * 1.8)).toFixed(2);
      ops.push({
        id: String(id),
        guid: uuid(id),
        fio: pick(FIO, s + 1),
        date: iso,
        docType: pick(DOC_TYPES, s + 2),
        operation: pick(OPERATIONS, s + 3),
        model,
        project: pick(PROJECTS, s + 4),
        cost,
      });
      id++;
    }
  }
  return ops;
}

export const OPERATIONS_DATA: Operation[] = generate();
export const DOC_TYPE_LIST = DOC_TYPES;
export const MODEL_LIST = MODELS;
export const PROJECT_LIST = PROJECTS;
export const FIO_LIST = FIO;