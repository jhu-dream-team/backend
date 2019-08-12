"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var gameDataSource = _interopRequireWildcard(require("./dataSource"));

var voteDataSource = _interopRequireWildcard(require("../votes/dataSource"));

var questionDataSource = _interopRequireWildcard(require("../questions/dataSource"));

var profileDataSource = _interopRequireWildcard(require("../profiles/dataSource"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

const rootResolvers = {
  Query: {
    Game(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }

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

        return result.data;
      });
    },

    scores(game, args, context, info) {
      return null;
    },

    question_categories(answer, args, context, info) {
      return null;
    },

    selected_question(game, args, context, info) {
      return null;
    },

    players(game, args, context, info) {
      return null;
    },

    free_spins(game, args, context, info) {
      return null;
    },

    answers(game, args, context, info) {
      return null;
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