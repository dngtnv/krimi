import rules from '@/api/rules';
import analysis from '@/data/analysis';
import analysisvn from '@/data/analysis-vn';
import clues from '@/data/clues';
import cluesvn from '@/data/clues-vn';
import means from '@/data/means';
import meansvn from '@/data/means-vn';
import database from '@/database';
import {
  equalTo,
  get,
  onChildAdded,
  onChildChanged,
  orderByChild,
  push,
  query,
  ref,
  set,
  update,
} from 'firebase/database';

import router from '@/router';

export default {
  createGame: async (context, payload) => {
    const gameList = ref(database, '/');
    const game = await push(gameList);
    const gamekey = game.key;
    const gameData = {
      gameId: rules.createRandomId(),
      players: {},
      detective: 0,
      gamekey,
      finished: false,
      availableClues: 6,
      round: 1,
      lang: payload,
    };
    await set(game, gameData);
    context.commit('setGame', gameData);
    return {
      gameId: gameData.gameId,
      gamekey,
    };
  },

  loadGame: async (context, payload) => {
    const gameRef = ref(database, '/');
    const gameQuery = query(gameRef, orderByChild('gameId'), equalTo(payload));

    onChildAdded(gameQuery, (snapshot) => {
      context.commit('setGame', snapshot.val());
    });

    onChildChanged(gameQuery, (snapshot) => {
      context.commit('setGame', snapshot.val());
    });
  },

  async startGame(context, payload) {
    const gameclues = {
      en: {
        clues,
        means,
        analysis,
      },
      vn: {
        clues: cluesvn,
        means: meansvn,
        analysis: analysisvn,
      },
    };
    const lang = payload.lang || 'en';
    const gameMeans = rules.getRandom(gameclues[lang].means, payload.players.length * 4);
    const gameClues = rules.getRandom(gameclues[lang].clues, payload.players.length * 4);
    const analysisCause = gameclues[lang].analysis.filter((item) => item.type === 0);
    const analysisLocation = rules.getRandom(
      gameclues[lang].analysis.filter((item) => item.type === 1),
      1
    );
    const analysisOther = rules.getRandom(
      gameclues[lang].analysis.filter((item) => item.type === 2),
      6
    );

    const players = payload.playersObj;
    let iterate = 0;
    for (let player in players) {
      players[player] = {
        index: iterate,
        ...players[player],
      };
      iterate++;
    }
    const startedGame = {
      started: true,
      means: gameMeans,
      clues: gameClues,
      players,
      analysis: [...analysisCause, ...analysisLocation, ...analysisOther],
      murderer: rules.chooseRandomMurderer(payload.players, payload.detective),
    };
    const gameRef = ref(database, '/' + payload.game);
    await update(gameRef, startedGame);
  },

  async setDetective(context, payload) {
    const gameRef = ref(database, '/' + payload.game);
    await update(gameRef, {
      detective: payload.player,
    });
  },

  async setAnalysis(context, payload) {
    const gameRef = ref(database, '/' + payload.game);
    await update(gameRef, {
      forensicAnalysis: payload.analysis,
    });
  },

  async setMurdererChoice(context, payload) {
    const gameRef = ref(database, '/' + payload.game);
    await update(gameRef, {
      murdererChoice: payload.choice,
    });
  },

  async passTurn(context, payload) {
    const game = context.state.game;
    const players = Object.keys(game.players).length;
    const turnsArray = game.passedTurns || new Array(players).fill(false);
    turnsArray[payload.player.index] = true;
    const gameRef = ref(database, '/' + payload.game);
    await update(gameRef, {
      passedTurns: turnsArray,
    });
    context.dispatch('checkEndGame', payload);
  },

  async makeGuess(context, payload) {
    const game = context.state.game;
    const players = Object.keys(game.players).length;
    const guessesArray = game.guesses || new Array(players).fill(false);
    guessesArray[payload.player.index] = payload.guess;
    const gameRef = ref(database, '/' + payload.game);
    await update(gameRef, {
      guesses: guessesArray,
    });
    context.dispatch('checkEndGame', payload);
  },

  async checkEndGame(context, payload) {
    const game = context.state.game;
    const players = Object.keys(game.players).length;
    const validGuesses = (game.guesses && game.guesses.filter((item) => item.key)) || [];
    const playersPassed = (game.passedTurns && game.passedTurns.filter((item) => item === true)) || [];
    if (
      game.guesses &&
      game.guesses.filter((item) => item.mean === game.murdererChoice.mean && item.key === game.murdererChoice.key)
        .length > 0
    ) {
      const gameRef = ref(database, '/' + payload.game);
      await update(gameRef, {
        finished: true,
        winner: 'detectives',
      });
    } else if (validGuesses.length === players - 1) {
      const gameRef = ref(database, '/' + payload.game);
      await update(gameRef, {
        finished: true,
        winner: 'murderer',
      });
    } else if (game.round === 3 && validGuesses.length + playersPassed.length === players.length - 1) {
      const gameRef = ref(database, '/' + payload.game);
      await update(gameRef, {
        finished: true,
        winner: 'murderer',
      });
    } else {
      const newRound = validGuesses.length + playersPassed.length === players - 1 ? game.round + 1 : game.round;
      const newClues =
        validGuesses.length + playersPassed.length === players - 1 ? game.availableClues + 1 : game.availableClues;
      const clearPass =
        validGuesses.length + playersPassed.length === players - 1 ? new Array(players).fill(false) : game.passedTurns;
      console.log(validGuesses, playersPassed, players);
      try {
        const gameRef = ref(database, '/' + payload.game);
        await update(gameRef, {
          passedTurns: clearPass,
          availableClues: newClues,
          round: newRound,
        });
        console.log('Game updated successfully');
      } catch (error) {
        console.error('Failed to update game:', error);
      }
    }
  },

  async addPlayer(context, payload) {
    try {
      const gameQuery = query(ref(database, '/'), orderByChild('gameId'), equalTo(payload.gameId));
      const gameSnapshot = await get(gameQuery);
      let loadedGame;
      gameSnapshot.forEach((child) => {
        loadedGame = child.val();
        return true; // Stop iterating after the first match
      });

      if (!loadedGame) {
        console.error('Game not found');
        return 'Game not found';
      }

      const gamePlayersRef = ref(database, `/${loadedGame.gamekey}/players`);
      const playerQuery = query(gamePlayersRef, orderByChild('slug'), equalTo(payload.slug));
      const playerSnapshot = await get(playerQuery);
      const oldPlayer = playerSnapshot.exists() ? playerSnapshot.val() : null;

      if (oldPlayer && loadedGame.started) {
        router.push(`/game/${payload.gameId}/player/${payload.slug}`);
        return false;
      } else if (loadedGame.started) {
        return 'Game has already started and no new players can join';
      }

      const newPlayerRef = push(gamePlayersRef);
      const playerData = {
        name: payload.nickname,
        slug: payload.slug,
        playerkey: newPlayerRef.key,
      };

      await set(newPlayerRef, playerData);
      context.commit('setPlayer', playerData);
      router.push(`/game/${payload.gameId}/player/${payload.slug}`);
    } catch (error) {
      console.error('Failed to add player:', error);
      throw error; // Or handle it as per your application's error handling policy
    }
  },

  async loadPlayer(context, payload) {
    //   const loadedGame = await database
    //     .ref('/')
    //     .orderByChild('gameId')
    //     .equalTo(payload.game)
    //     .once('child_added')
    //     .then((snapshot) => {
    //       return snapshot.val();
    //     });
    //   context.dispatch('loadGame', payload.game);
    //   const target = await database
    //     .ref(`/${loadedGame.gamekey}/players/`)
    //     .orderByChild('slug')
    //     .equalTo(payload.player)
    //     .once('child_added')
    //     .then((snapshot) => snapshot.val());
    //   context.commit('setPlayer', target);
    // },
    const gameQuery = query(ref(database, '/'), orderByChild('gameId'), equalTo(payload.game));

    const gameSnapshot = await get(gameQuery);
    let loadedGame;
    gameSnapshot.forEach((child) => {
      loadedGame = child.val();
      return true; // Stop iterating after the first match
    });

    if (!loadedGame) {
      console.error('Game not found');
      return;
    }

    context.dispatch('loadGame', payload.game);

    const playerQuery = query(
      ref(database, `/${loadedGame.gamekey}/players`),
      orderByChild('slug'),
      equalTo(payload.player)
    );
    const playerSnapshot = await get(playerQuery);
    let target;
    playerSnapshot.forEach((child) => {
      target = child.val();
      return true; // Stop iterating after the first match
    });

    if (!target) {
      console.error('Player not found');
      return;
    }

    context.commit('setPlayer', target);
  },
};
