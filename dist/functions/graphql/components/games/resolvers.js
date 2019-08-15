"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var gameDataSource = _interopRequireWildcard(require("./dataSource"));

var answerDataSource = _interopRequireWildcard(require("../answers/dataSource"));

var freeSpinDataSource = _interopRequireWildcard(require("../freeSpins/dataSource"));

var scoreDataSource = _interopRequireWildcard(require("../scores/dataSource"));

var questionDataSource = _interopRequireWildcard(require("../questions/dataSource"));

var questionCategoryDataSource = _interopRequireWildcard(require("../questionCategories/dataSource"));

var profileDataSource = _interopRequireWildcard(require("../profiles/dataSource"));

var _utils = require("../../utils");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

const rootResolvers = {
  Query: {
    Game(obj, args, context, info) {
      return gameDataSource.getGameById(args.id).then(result => {
        if (result.error != null) {
          throw error;
        }

        return result.data;
      });
    },

    Games(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }

      return gameDataSource.getGamesPaginated(args.limit, args.after).then(result => {
        if (result.error != null) {
          throw error;
        }

        return {
          data: result.data,
          count: result.count,
          cursor: result.cursor
        };
      });
    }

  },
  Game: {
    owner(game, args, context, info) {
      return profileDataSource.getUserById(game.owner_id).then(result => {
        if (result.error) {
          throw result.error;
        }

        return {
          data: result.data,
          count: result.count,
          cursor: result.cursor
        };
      });
    },

    scores(game, args, context, info) {
      return scoreDataSource.getScoreByGameId(game.id, args.limit, args.after).then(result => {
        if (result.error) {
          throw result.error;
        }

        return {
          data: result.data,
          count: result.count,
          cursor: result.cursor
        };
      });
    },

    question_categories(game, args, context, info) {
      return questionCategoryDataSource.getQuestionCategoriesByGameId(game.id, args.limit, args.after).then(result => {
        if (result.error) {
          throw result.error;
        }

        return {
          data: result.data,
          count: result.count,
          cursor: result.cursor
        };
      });
    },

    selected_question(game, args, context, info) {
      if (game.selected_question == null || game.selected_question.length == 0) {
        return null;
      }

      return questionDataSource.getQuestionById(game.selected_question).then(result => {
        if (result.error) {
          throw result.error;
        }

        return result.data;
      });
    },

    players(game, args, context, info) {
      return profileDataSource.getUsersByIds(game.player_ids, args.limit, args.after).then(result => {
        if (result.error) {
          throw result.error;
        }

        return {
          data: result.data,
          count: result.count,
          cursor: result.cursor
        };
      });
    },

    free_spins(game, args, context, info) {
      return freeSpinDataSource.getFreeSpinsByGameId(args.limit, args.after, game.id).then(result => {
        if (result.error) {
          throw result.error;
        }

        return {
          data: result.data,
          count: result.count,
          cursor: result.cursor
        };
      });
    },

    answers(game, args, context, info) {
      return answerDataSource.getAnswerByGameId(game.id, args.after, args.limit).then(result => {
        if (result.error) {
          throw result.error;
        }

        return {
          data: result.data,
          count: result.count,
          cursor: result.cursor
        };
      });
    }

  },
  Mutation: {
    createGame(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }

      return gameDataSource.createGame(args.name, args.question_categories, context.user.id).then(result => {
        if (result.error) {
          throw result.error;
        }

        return result.data;
      });
    },

    deleteGame(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }

      return gameDataSource.deleteGame(args.id, context.user.id);
    },

    joinGame(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }

      return gameDataSource.joinGame(args.id, context.user.id);
    },

    answerQuestion(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }

      return gameDataSource.answerQuestion(args.id, args.answer, context.user.id).then(result => {
        return result.data;
      }).catch(err => {
        throw err;
      });
    },

    voteAnswer(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }

      return gameDataSource.voteAnswer(args.id, args.category_id, context.user.id).then(result => {
        return result.data;
      }).catch(err => {
        throw err;
      });
    },

    selectCategory(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }

      return gameDataSource.selectCategory(args.id, args.category_id, context.user.id).then(result => {
        return result.data;
      }).catch(err => {
        throw err;
      });
    },

    spinWheel(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }

      return gameDataSource.spinWheel(args.id, context.user.id).then(result => {
        return result.data;
      }).catch(err => {
        throw err;
      });
    },

    startGame(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }

      return gameDataSource.startGame(args.id, context.user.id).then(result => {
        return result;
      }).catch(err => {
        throw err;
      });
    },

    leaveGame(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }

      return gameDataSource.leaveGame(args.id, context.user.id);
    }

  }
};
var _default = rootResolvers;
exports.default = _default;