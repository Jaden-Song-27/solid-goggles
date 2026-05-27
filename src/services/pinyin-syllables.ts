/**
 * Complete list of valid Mandarin pinyin syllables (without tones).
 * Used for segmenting user input like "nihao" → ["ni", "hao"].
 */
export const PINYIN_SYLLABLES: Set<string> = new Set([
  // a-group
  'a', 'ai', 'an', 'ang', 'ao',
  // b-group
  'ba', 'bai', 'ban', 'bang', 'bao', 'bei', 'ben', 'beng', 'bi', 'bian',
  'biao', 'bie', 'bin', 'bing', 'bo', 'bu',
  // c-group
  'ca', 'cai', 'can', 'cang', 'cao', 'ce', 'cen', 'ceng', 'cha', 'chai',
  'chan', 'chang', 'chao', 'che', 'chen', 'cheng', 'chi', 'chong', 'chou',
  'chu', 'chuai', 'chuan', 'chuang', 'chui', 'chun', 'chuo', 'ci', 'cong',
  'cou', 'cu', 'cuan', 'cui', 'cun', 'cuo',
  // d-group
  'da', 'dai', 'dan', 'dang', 'dao', 'de', 'dei', 'den', 'deng', 'di',
  'dian', 'diao', 'die', 'ding', 'diu', 'dong', 'dou', 'du', 'duan',
  'dui', 'dun', 'duo',
  // e-group
  'e', 'ei', 'en', 'eng', 'er',
  // f-group
  'fa', 'fan', 'fang', 'fei', 'fen', 'feng', 'fo', 'fou', 'fu',
  // g-group
  'ga', 'gai', 'gan', 'gang', 'gao', 'ge', 'gei', 'gen', 'geng', 'gong',
  'gou', 'gu', 'gua', 'guai', 'guan', 'guang', 'gui', 'gun', 'guo',
  // h-group
  'ha', 'hai', 'han', 'hang', 'hao', 'he', 'hei', 'hen', 'heng', 'hong',
  'hou', 'hu', 'hua', 'huai', 'huan', 'huang', 'hui', 'hun', 'huo',
  // j-group
  'ji', 'jia', 'jian', 'jiang', 'jiao', 'jie', 'jin', 'jing', 'jiong',
  'jiu', 'ju', 'juan', 'jue', 'jun',
  // k-group
  'ka', 'kai', 'kan', 'kang', 'kao', 'ke', 'ken', 'keng', 'kong', 'kou',
  'ku', 'kua', 'kuai', 'kuan', 'kuang', 'kui', 'kun', 'kuo',
  // l-group
  'la', 'lai', 'lan', 'lang', 'lao', 'le', 'lei', 'leng', 'li', 'lia',
  'lian', 'liang', 'liao', 'lie', 'lin', 'ling', 'liu', 'long', 'lou',
  'lu', 'luan', 'lun', 'luo', 'lv', 'lve',
  // m-group
  'ma', 'mai', 'man', 'mang', 'mao', 'me', 'mei', 'men', 'meng', 'mi',
  'mian', 'miao', 'mie', 'min', 'ming', 'miu', 'mo', 'mou', 'mu',
  // n-group
  'na', 'nai', 'nan', 'nang', 'nao', 'ne', 'nei', 'nen', 'neng', 'ni',
  'nian', 'niang', 'niao', 'nie', 'nin', 'ning', 'niu', 'nong', 'nou',
  'nu', 'nuan', 'nuo', 'nv', 'nve',
  // o-group
  'o', 'ou',
  // p-group
  'pa', 'pai', 'pan', 'pang', 'pao', 'pei', 'pen', 'peng', 'pi', 'pian',
  'piao', 'pie', 'pin', 'ping', 'po', 'pou', 'pu',
  // q-group
  'qi', 'qia', 'qian', 'qiang', 'qiao', 'qie', 'qin', 'qing', 'qiong',
  'qiu', 'qu', 'quan', 'que', 'qun',
  // r-group
  'ran', 'rang', 'rao', 're', 'ren', 'reng', 'ri', 'rong', 'rou', 'ru',
  'ruan', 'rui', 'run', 'ruo',
  // s-group
  'sa', 'sai', 'san', 'sang', 'sao', 'se', 'sen', 'seng', 'sha', 'shai',
  'shan', 'shang', 'shao', 'she', 'shei', 'shen', 'sheng', 'shi', 'shou',
  'shu', 'shua', 'shuai', 'shuan', 'shuang', 'shui', 'shun', 'shuo', 'si',
  'song', 'sou', 'su', 'suan', 'sui', 'sun', 'suo',
  // t-group
  'ta', 'tai', 'tan', 'tang', 'tao', 'te', 'teng', 'ti', 'tian', 'tiao',
  'tie', 'ting', 'tong', 'tou', 'tu', 'tuan', 'tui', 'tun', 'tuo',
  // w-group
  'wa', 'wai', 'wan', 'wang', 'wei', 'wen', 'weng', 'wo', 'wu',
  // x-group
  'xi', 'xia', 'xian', 'xiang', 'xiao', 'xie', 'xin', 'xing', 'xiong',
  'xiu', 'xu', 'xuan', 'xue', 'xun',
  // y-group
  'ya', 'yan', 'yang', 'yao', 'ye', 'yi', 'yin', 'ying', 'yo', 'yong',
  'you', 'yu', 'yuan', 'yue', 'yun',
  // z-group
  'za', 'zai', 'zan', 'zang', 'zao', 'ze', 'zei', 'zen', 'zeng', 'zha',
  'zhai', 'zhan', 'zhang', 'zhao', 'zhe', 'zhei', 'zhen', 'zheng', 'zhi',
  'zhong', 'zhou', 'zhu', 'zhua', 'zhuai', 'zhuan', 'zhuang', 'zhui',
  'zhun', 'zhuo', 'zi', 'zong', 'zou', 'zu', 'zuan', 'zui', 'zun', 'zuo',
])
