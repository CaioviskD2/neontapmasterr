# Neon Tap Master

Crie um jogo web completo, profissional e mobile-first chamado:

"One Wrong Tap"

OBJETIVO DO JOGO:
O jogador deve tocar apenas nos círculos verdes.
Se tocar no círculo vermelho, o jogo termina.
Se o tempo acabar antes de tocar um círculo verde, o jogo termina.

ARQUITETURA:
- HTML, CSS e JavaScript puro (sem frameworks pesados)
- Código modular e organizado por funções
- Mobile-first
- Totalmente responsivo
- Otimizado para performance
- Estrutura pronta para futura conversão em PWA
- Estrutura pronta para futura conversão em APK (WebView ou PWA wrapper)

----------------------------------------
🎨 IDENTIDADE VISUAL — NEON ARCADE
----------------------------------------

TEMA:
Neon Arcade Retrô Futurista

FUNDO:
- Cor escura (#0f0f1a)
- Leve grid neon sutil estilo anos 80
- Glow suave no ambiente

ELEMENTOS:
- Círculos verdes neon (#39ff14) com efeito glow
- Círculo vermelho neon (#ff0033) com glow mais intenso
- Animação leve de pulsação nos círculos
- Feedback visual ao clique (efeito ripple ou brilho)
- Fonte estilo arcade digital
- Pontuação com glow azul neon
- Barra de tempo horizontal neon no topo
- Barra muda de verde → amarelo → vermelho conforme o tempo acaba

ANIMAÇÕES:
- Transições suaves entre telas
- Game Over com efeito leve de glitch neon
- Destaque especial para "NEW HIGH SCORE"

----------------------------------------
📱 TELAS DO APP
----------------------------------------

1) HOME
- Título: One Wrong Tap
- Botão grande: PLAY
- Botão: LEADERBOARD
- Exibir High Score (localStorage)
- Botão som ON/OFF

2) GAME
- Pontuação no topo
- Barra de tempo animada
- Área principal com círculos posicionados aleatoriamente
- Garantir que círculos:
    - Não se sobreponham
    - Não saiam da área visível
- Ao clicar verde:
    - +1 ponto
    - Reiniciar timer
    - Reposicionar círculos
    - Aumentar velocidade levemente
- Ao clicar vermelho:
    - Game Over
- Se timer zerar:
    - Game Over
- Vibração leve no mobile (se suportado)

DIFICULDADE PROGRESSIVA:
- Início: 3 círculos (2 verdes, 1 vermelho)
- A cada 5 pontos: adicionar 1 círculo verde
- Aumentar gradualmente a velocidade
- Tempo máximo inicial: 2 segundos
- Reduzir levemente o tempo conforme pontuação aumenta

3) GAME OVER
- Texto: GAME OVER (neon vermelho)
- Mostrar pontuação atual
- Mostrar High Score
- Se bater recorde: mostrar "NEW HIGH SCORE"
- Botão PLAY AGAIN
- Botão CONTINUE (estrutura preparada para anúncio rewarded)
- Estrutura preparada para anúncio intersticial a cada 2 partidas

4) LEADERBOARD GLOBAL

----------------------------------------
🌍 RANKING GLOBAL — FIREBASE
----------------------------------------

Utilizar Firebase (Firestore).

Criar collection:
"leaderboard"

Campos:
- nickname (string)
- score (number)
- timestamp (number)
- country (opcional)

REGRAS:
- Ordenar por score decrescente
- Em caso de empate, usar timestamp (mais antigo primeiro)

FUNCIONALIDADES:

Ao terminar partida:
- Se score > 0:
    - Solicitar nickname (3 a 12 caracteres)
    - Validar entrada
    - Salvar no Firebase

Tela Leaderboard:
- Mostrar Top 100 Global
- Exibir:
    - Posição (#1, #2, #3…)
    - Nickname
    - Pontuação
- Destaque visual:
    - #1 ouro neon
    - #2 prata neon
    - #3 bronze neon

Se jogador NÃO estiver no Top 100:
- Mostrar abaixo:
    - Your Rank: #X
    - Your Best Score

Implementar:
- Função para calcular posição individual
- Query otimizada para buscar apenas Top 100
- Sistema básico anti-spam:
    - Não permitir score 0
    - Validar nickname
    - Não permitir envio múltiplo automático

----------------------------------------
💾 DADOS LOCAIS
----------------------------------------

Usar localStorage para:
- High Score local
- Contador de partidas
- Controle de exibição de anúncios

----------------------------------------
💰 MONETIZAÇÃO (PREPARAÇÃO)
----------------------------------------

Preparar funções vazias para:
- showInterstitialAd()
- showRewardedAd()

Inserir comentários no código indicando onde integrar:
- Google AdSense (Web)
- Google AdMob (APK futuro)

----------------------------------------
🔊 SONS
----------------------------------------

Adicionar sons leves estilo arcade:
- Som ao clicar verde
- Som grave ao perder
- Estrutura para desligar som

----------------------------------------
⚡ PERFORMANCE
----------------------------------------

- Código otimizado
- Carregamento rápido
- Evitar loops desnecessários
- Garantir fluidez em dispositivos medianos

----------------------------------------
🎯 OBJETIVO FINAL
----------------------------------------

Entregar um jogo:
- Profissional
- Competitivo
- Visualmente impactante
- Pronto para monetização
- Pronto para escalar globalmente

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://neontapmasterr.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1d3b124d-df61-44a2-8e2d-60221acf6d68).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
