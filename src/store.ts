import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Status = '毫无了解' | '看完课程' | '基本掌握';
export type Proficiency = '差劲' | '一般' | '还行' | '不错' | '登峰';
export type LearningStatus = 'none' | 'course' | 'practice' | 'perfect';

export type ColorMode = 'auto' | 'manual' | 'off';

export interface SmallModule {
  id: string;
  name: string;
  status: Status;
  proficiency?: Proficiency;
  unlinkedFromMap?: boolean;
  colorDepth?: number; // 0-100
}

export interface BigModule {
  id: string;
  name: string;
  smallModules: SmallModule[];
  unlinkedFromMap?: boolean;
  colorDepth?: number; // 0-100
}

export interface Subject {
  id: string;
  name: string;
  type: 'main' | 'sub';
  maxScore: number;
  score: number;
  papers: number;
  bigModules: BigModule[];
  learningStatus?: LearningStatus;
  colorMode?: ColorMode;
}

const initialSubjects: Record<string, Subject> = {
  chinese: { id: 'chinese', name: '语文', type: 'main', maxScore: 150, score: 0, papers: 0, bigModules: [] },
  math: { id: 'math', name: '数学', type: 'main', maxScore: 150, score: 0, papers: 0, bigModules: [] },
  english: { id: 'english', name: '英语', type: 'main', maxScore: 150, score: 0, papers: 0, bigModules: [] },
  physics: { id: 'physics', name: '物理', type: 'sub', maxScore: 100, score: 0, papers: 0, bigModules: [] },
  chemistry: { id: 'chemistry', name: '化学', type: 'sub', maxScore: 100, score: 0, papers: 0, bigModules: [] },
  biology: { id: 'biology', name: '生物', type: 'sub', maxScore: 100, score: 0, papers: 0, bigModules: [] },
};

export interface ToastMessage {
  id: string;
  message: string;
}

export type CalendarColor = 'white' | 'red' | 'yellow' | 'green';

export interface GraveyardEntry {
  id: string;
  subjectId: string;
  bigModuleName: string;
  smallModuleName: string;
  content: string;
  date: string;
}

export interface Deadlines {
  gaokao: string;
  grade11: string;
  nextExam: string;
  nextExamName: string;
}

export interface DailyStat {
  papers: number;
  litDots: number;
}

export interface AppState {
  currentSubjects: Record<string, Subject>;
  pastSubjects: Record<string, Subject>;
  toasts: ToastMessage[];
  englishWords: number;
  calendarData: Record<string, CalendarColor>;
  notesData: Record<string, string>;
  graveyard: GraveyardEntry[];
  deadlines: Deadlines;
  dailyStats: Record<string, DailyStat>;
  
  addToast: (message: string) => void;
  removeToast: (id: string) => void;
  
  updateSubject: (isPast: boolean, subjectId: string, data: Partial<Subject>) => void;
  updateBigModule: (isPast: boolean, subjectId: string, bigModuleId: string, data: Partial<BigModule>) => void;
  addBigModule: (isPast: boolean, subjectId: string, name: string) => void;
  addSmallModule: (isPast: boolean, subjectId: string, bigModuleId: string, name: string) => void;
  updateSmallModule: (isPast: boolean, subjectId: string, bigModuleId: string, smallModuleId: string, data: Partial<SmallModule>) => void;
  deleteBigModule: (isPast: boolean, subjectId: string, bigModuleId: string) => void;
  deleteSmallModule: (isPast: boolean, subjectId: string, bigModuleId: string, smallModuleId: string) => void;
  
  toggleUnlinkBigModule: (isPast: boolean, subjectId: string, bigModuleId: string) => void;
  toggleUnlinkSmallModule: (isPast: boolean, subjectId: string, bigModuleId: string, smallModuleId: string) => void;
  
  updateEnglishWords: (delta: number) => void;
  updateCalendar: (dateStr: string, color: CalendarColor) => void;
  updateNote: (dateStr: string, note: string) => void;

  addGraveyardEntry: (entry: Omit<GraveyardEntry, 'id' | 'date'>) => void;
  deleteGraveyardEntry: (id: string) => void;
  updateDeadlines: (data: Partial<Deadlines>) => void;
  recordDailyStat: (papersDelta: number, litDotsDelta: number) => void;
}

const CONGRATS_MESSAGES = [
  "太棒了！星空因你更璀璨！",
  "稳扎稳打，又亮起一颗星！",
  "你的努力，星辰皆可见！",
  "继续保持，星图正在苏醒！",
  "每一步算数，每一颗星都闪耀！",
  "登峰造极！你就是夜空中最亮的星！"
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentSubjects: JSON.parse(JSON.stringify(initialSubjects)),
      pastSubjects: JSON.parse(JSON.stringify(initialSubjects)),
      toasts: [],
      englishWords: 0,
      calendarData: {},
      notesData: {},
      graveyard: [],
      deadlines: {
        gaokao: '2027-06-07',
        grade11: '2026-07-15',
        nextExam: '2026-04-30',
        nextExamName: '期中考试'
      },
      dailyStats: {},

      addToast: (message) => {
        const id = Date.now().toString();
        set((state) => ({ toasts: [...state.toasts, { id, message }] }));
        setTimeout(() => {
          set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
        }, 4000);
      },

      removeToast: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) })),
      
      updateSubject: (isPast, subjectId, data) => set((state) => {
        const target = isPast ? 'pastSubjects' : 'currentSubjects';
        
        // Record daily stats if papers changed
        if (data.papers !== undefined) {
          const oldPapers = state[target][subjectId].papers;
          const delta = data.papers - oldPapers;
          if (delta > 0) {
            get().recordDailyStat(delta, 0);
            
            const oldStars = Math.floor(oldPapers / 5);
            const newStars = Math.floor(data.papers / 5);
            if (newStars > oldStars) {
               const randomMsg = CONGRATS_MESSAGES[Math.floor(Math.random() * CONGRATS_MESSAGES.length)];
               get().addToast(`完成5张卷子！点亮一颗新星！${randomMsg}`);
               get().recordDailyStat(0, newStars - oldStars);
            }
          }
        }

        return {
          [target]: {
            ...state[target],
            [subjectId]: { ...state[target][subjectId], ...data }
          }
        };
      }),

      updateBigModule: (isPast, subjectId, bigModuleId, data) => set((state) => {
        const target = isPast ? 'pastSubjects' : 'currentSubjects';
        return {
          [target]: {
            ...state[target],
            [subjectId]: {
              ...state[target][subjectId],
              bigModules: state[target][subjectId].bigModules.map(bm => 
                bm.id === bigModuleId ? { ...bm, ...data } : bm
              )
            }
          }
        };
      }),

      addBigModule: (isPast, subjectId, name) => set((state) => {
        const target = isPast ? 'pastSubjects' : 'currentSubjects';
        const newBigModule: BigModule = { id: Date.now().toString(), name, smallModules: [], unlinkedFromMap: false };
        return {
          [target]: {
            ...state[target],
            [subjectId]: {
              ...state[target][subjectId],
              bigModules: [...state[target][subjectId].bigModules, newBigModule]
            }
          }
        };
      }),

      addSmallModule: (isPast, subjectId, bigModuleId, name) => set((state) => {
        const target = isPast ? 'pastSubjects' : 'currentSubjects';
        const newSmallModule: SmallModule = { id: Date.now().toString(), name, status: '毫无了解', unlinkedFromMap: false };
        return {
          [target]: {
            ...state[target],
            [subjectId]: {
              ...state[target][subjectId],
              bigModules: state[target][subjectId].bigModules.map(bm => 
                bm.id === bigModuleId 
                  ? { ...bm, smallModules: [...bm.smallModules, newSmallModule] }
                  : bm
              )
            }
          }
        };
      }),

      updateSmallModule: (isPast, subjectId, bigModuleId, smallModuleId, data) => {
        const state = get();
        const target = isPast ? 'pastSubjects' : 'currentSubjects';
        const subject = state[target][subjectId];
        const bigModule = subject.bigModules.find(bm => bm.id === bigModuleId);
        
        if (!bigModule) return;

        // Calculate total dots before
        let countBefore = 0;
        const processBM = (bm: BigModule) => {
          if (bm.unlinkedFromMap) return 0;
          if (bm.smallModules.length === 0) return 0;
          let c = 0;
          let allOkayOrBetter = true;
          let allPeak = true;
          let hasLinkedSmallModules = false;
          bm.smallModules.forEach(sm => {
            if (sm.unlinkedFromMap) return;
            hasLinkedSmallModules = true;
            if (sm.status === '基本掌握' && sm.proficiency) {
              if (sm.proficiency === '还行' || sm.proficiency === '不错') {
                c += 1;
                allPeak = false;
              } else if (sm.proficiency === '登峰') {
                c += 2;
              } else {
                allOkayOrBetter = false;
                allPeak = false;
              }
            } else {
              allOkayOrBetter = false;
              allPeak = false;
            }
          });
          if (hasLinkedSmallModules) {
            if (allPeak) c += 5;
            else if (allOkayOrBetter) c += 3;
          }
          return c;
        };
        countBefore = processBM(bigModule);

        const prevAllOkay = bigModule.smallModules.length > 0 && bigModule.smallModules.every(sm => sm.status === '基本掌握' && (sm.proficiency === '还行' || sm.proficiency === '不错' || sm.proficiency === '登峰'));
        const prevAllPeak = bigModule.smallModules.length > 0 && bigModule.smallModules.every(sm => sm.status === '基本掌握' && sm.proficiency === '登峰');

        set((state) => {
          return {
            [target]: {
              ...state[target],
              [subjectId]: {
                ...state[target][subjectId],
                bigModules: state[target][subjectId].bigModules.map(bm => 
                  bm.id === bigModuleId 
                    ? {
                        ...bm,
                        smallModules: bm.smallModules.map(sm => 
                          sm.id === smallModuleId ? { ...sm, ...data } : sm
                        )
                      }
                    : bm
                )
              }
            }
          };
        });

        // Check new state for achievements
        const newState = get();
        const newBigModule = newState[target][subjectId].bigModules.find(bm => bm.id === bigModuleId);
        if (newBigModule && newBigModule.smallModules.length > 0 && !newBigModule.unlinkedFromMap) {
          const countAfter = processBM(newBigModule);
          if (countAfter > countBefore) {
            get().recordDailyStat(0, countAfter - countBefore);
          }

          const newAllOkay = newBigModule.smallModules.every(sm => sm.status === '基本掌握' && (sm.proficiency === '还行' || sm.proficiency === '不错' || sm.proficiency === '登峰'));
          const newAllPeak = newBigModule.smallModules.every(sm => sm.status === '基本掌握' && sm.proficiency === '登峰');

          const randomMsg = CONGRATS_MESSAGES[Math.floor(Math.random() * CONGRATS_MESSAGES.length)];

          if (!prevAllPeak && newAllPeak) {
            newState.addToast(`【${newBigModule.name}】已登峰造极！${randomMsg}`);
          } else if (!prevAllOkay && newAllOkay && !newAllPeak) {
            newState.addToast(`【${newBigModule.name}】全部达标！${randomMsg}`);
          }
        }
      },

      deleteBigModule: (isPast, subjectId, bigModuleId) => set((state) => {
        const target = isPast ? 'pastSubjects' : 'currentSubjects';
        return {
          [target]: {
            ...state[target],
            [subjectId]: {
              ...state[target][subjectId],
              bigModules: state[target][subjectId].bigModules.filter(bm => bm.id !== bigModuleId)
            }
          }
        };
      }),

      deleteSmallModule: (isPast, subjectId, bigModuleId, smallModuleId) => set((state) => {
        const target = isPast ? 'pastSubjects' : 'currentSubjects';
        return {
          [target]: {
            ...state[target],
            [subjectId]: {
              ...state[target][subjectId],
              bigModules: state[target][subjectId].bigModules.map(bm => 
                bm.id === bigModuleId 
                  ? { ...bm, smallModules: bm.smallModules.filter(sm => sm.id !== smallModuleId) }
                  : bm
              )
            }
          }
        };
      }),

      toggleUnlinkBigModule: (isPast, subjectId, bigModuleId) => set((state) => {
        const target = isPast ? 'pastSubjects' : 'currentSubjects';
        return {
          [target]: {
            ...state[target],
            [subjectId]: {
              ...state[target][subjectId],
              bigModules: state[target][subjectId].bigModules.map(bm => 
                bm.id === bigModuleId ? { ...bm, unlinkedFromMap: !bm.unlinkedFromMap } : bm
              )
            }
          }
        };
      }),

      toggleUnlinkSmallModule: (isPast, subjectId, bigModuleId, smallModuleId) => set((state) => {
        const target = isPast ? 'pastSubjects' : 'currentSubjects';
        return {
          [target]: {
            ...state[target],
            [subjectId]: {
              ...state[target][subjectId],
              bigModules: state[target][subjectId].bigModules.map(bm => 
                bm.id === bigModuleId 
                  ? {
                      ...bm,
                      smallModules: bm.smallModules.map(sm => 
                        sm.id === smallModuleId ? { ...sm, unlinkedFromMap: !sm.unlinkedFromMap } : sm
                      )
                    }
                  : bm
              )
            }
          }
        };
      }),

      updateEnglishWords: (delta) => set((state) => {
        const newWords = Math.max(0, state.englishWords + delta);
        const oldDots = Math.floor(state.englishWords / 30);
        const newDots = Math.floor(newWords / 30);
        
        if (newDots > oldDots) {
           const randomMsg = CONGRATS_MESSAGES[Math.floor(Math.random() * CONGRATS_MESSAGES.length)];
           get().addToast(`单词积累+30！点亮一颗新星！${randomMsg}`);
           get().recordDailyStat(0, newDots - oldDots);
        }
        
        return { englishWords: newWords };
      }),

      updateCalendar: (dateStr, color) => set((state) => ({
        calendarData: { ...state.calendarData, [dateStr]: color }
      })),

      updateNote: (dateStr, note) => set((state) => ({
        notesData: { ...state.notesData, [dateStr]: note }
      })),

      addGraveyardEntry: (entry) => set((state) => ({
        graveyard: [{ ...entry, id: Date.now().toString(), date: new Date().toISOString() }, ...state.graveyard]
      })),

      deleteGraveyardEntry: (id) => set((state) => ({
        graveyard: state.graveyard.filter(g => g.id !== id)
      })),

      updateDeadlines: (data) => set((state) => ({
        deadlines: { ...state.deadlines, ...data }
      })),

      recordDailyStat: (papersDelta, litDotsDelta) => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        const currentStat = state.dailyStats[today] || { papers: 0, litDots: 0 };
        return {
          dailyStats: {
            ...state.dailyStats,
            [today]: {
              papers: currentStat.papers + papersDelta,
              litDots: currentStat.litDots + litDotsDelta
            }
          }
        };
      }),

    }),
    {
      name: 'learning-tracker-storage',
      partialize: (state) => ({ 
        currentSubjects: state.currentSubjects, 
        pastSubjects: state.pastSubjects,
        englishWords: state.englishWords,
        calendarData: state.calendarData,
        notesData: state.notesData,
        graveyard: state.graveyard,
        deadlines: state.deadlines,
        dailyStats: state.dailyStats
      }),
    }
  )
);

