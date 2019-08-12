"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var scoreDataSource = _interopRequireWildcard(require("./dataSource"));

var gameDataSource = _interopRequireWildcard(require("../games/dataSource"));

var profileDataSource = _interopRequireWildcard(require("../profiles/dataSource"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

const rootResolvers = {
  Query: {
    Score(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }

      return scoreDataSource.getScoreById(args.id).then(result => {
        if (result.error != null) {
          throw error;
        }

        return result.data;
      });
    },

    Scores(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }

      return scoreDataSource.getScoresPaginated(args.limit, args.after).then(result => {
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
  Score: {
    owner(score, args, context, info) {
      return profileDataSource.getUserById(score.owner_id).then(result => {
        if (result.error) {
          throw result.error;
        }

        return result.data;
      });
    },

    game(score, args, context, info) {
      return gameDataSource.getGameById(score.game_id).then(result => {
        if (result.error) {
          throw result.error;
        }

        return result.data;
      });
    },

    answers(score, args, context, info) {
      return null;
    }

  },
  Mutation: {}
};
var _default = rootResolvers;
exports.default = _default;