import type { Tip } from './types'

export const EXPERT_TIPS: Array<Omit<Tip, 'id'>> = [
  {
    title: 'Dica do Especialista',
    body: 'Durante o início de um novo protocolo, aumente a hidratação com eletrólitos naturais para manter a energia cerebral.',
  },
  {
    title: 'Quebra de jejum inteligente',
    body: 'Abra a janela com proteínas e fibras antes de carboidratos simples para estabilizar a glicose e prolongar a saciedade.',
  },
  {
    title: 'Ritmo circadiano',
    body: 'Manter a janela de alimentação alinhada à luz do dia melhora a sensibilidade à insulina e a qualidade do sono.',
  },
  {
    title: 'Sinal de ajuste',
    body: 'Se a energia cair muito por três dias seguidos, reduza o protocolo em 2h antes de abandonar a rotina.',
  },
]
