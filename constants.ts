
import { TabConfig, TodosState, ItineraryState, ShoppingAlbum } from './types';

export const TABS: TabConfig[] = [
  { id: 'prep', label: '行前', subLabel: '準備' },
  { id: 'day1', label: '12/12', subLabel: '週五', dateStr: '2024-12-12' },
  { id: 'day2', label: '12/13', subLabel: '週六', dateStr: '2024-12-13' },
  { id: 'day3', label: '12/14', subLabel: '週日', dateStr: '2024-12-14' },
  { id: 'day4', label: '12/15', subLabel: '週一', dateStr: '2024-12-15' },
  { id: 'day5', label: '12/16', subLabel: '週二', dateStr: '2024-12-16' },
];

export const INITIAL_TODOS: TodosState = {
  tasks: [
    { id: '1', text: '下載離線地圖', completed: false },
    { id: '2', text: '確認網卡/漫遊', completed: false },
    { id: '3', text: '線上預辦登機', completed: false },
  ],
  carryOn: [
    { id: '4', text: '護照', completed: false },
    { id: '5', text: '行動電源', completed: false },
    { id: '6', text: '充電線', completed: false },
  ],
  checked: [
    { id: '7', text: '換洗衣物', completed: false },
    { id: '8', text: '盥洗用品', completed: false },
  ],
};

export const INITIAL_ITINERARY: ItineraryState = {
  '2024-12-12': [
    { id: 'i1', type: 'activity', date: '2024-12-12', period: 'morning', time: '09:00', title: '桃園機場集合', transport: '機捷', notes: '第二航廈', link: 'https://maps.google.com/?q=Taoyuan+Airport' },
    { id: 'i2', type: 'activity', date: '2024-12-12', period: 'afternoon', time: '14:00', title: '抵達目的地', transport: '飛機', notes: '記得領行李' },
    { id: 'i3', type: 'activity', date: '2024-12-12', period: 'evening', time: '18:00', title: '飯店 Check-in', transport: '計程車', link: 'https://maps.google.com' },
    { id: 'd1', type: 'dining', date: '2024-12-12', title: '機場美食街', isReserved: false, link: '' },
  ],
  '2024-12-13': [
    { id: 'i4', type: 'activity', date: '2024-12-13', period: 'morning', time: '10:00', title: '市區觀光', transport: '地鐵', notes: '買一日券' },
  ]
};

export const INITIAL_SHOPPING_LIST: ShoppingAlbum[] = [
  {
    id: 'album-1',
    name: '無印良品',
    items: [
      { id: 'item-1', name: '咖哩速食包', checked: false, imageUrl: 'https://images.unsplash.com/photo-1596561234479-5808892d77d1?auto=format&fit=crop&q=80&w=300' },
      { id: 'item-2', name: '筆記本', checked: false },
    ]
  },
  {
    id: 'album-2',
    name: '3COINS',
    items: []
  },
  {
    id: 'album-3',
    name: '大創',
    items: []
  }
];
