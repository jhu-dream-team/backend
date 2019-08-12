"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var voteDataSource = _interopRequireWildcard(require("./dataSource"));

var answerDataSource = _interopRequireWildcard(require("../answers/dataSource"));

var gameDataSource = _interopRequireWildcard(require("../games/dataSource"));

var profileDataSource = _interopRequireWildcard(require("../profiles/dataSource"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

const rootResolvers = {
  Query: {
    Vote(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }

      return voteDataSource.getVoteById(args.id).then(result => {
        if (result.error != null) {
          throw error;
        }

        return result.data;
      });
    },

    Votes(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }

      return voteDataSource.getVotesPaginated(args.limit, args.after).then(result => {
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
  Vote: {
    owner(vote, args, context, info) {
      return profileDataSource.getUserById(vote.owner_id).then(result => {
        if (result.error) {
          throw result.error;
        }

        return result.data;
      });
    },

    answer(vote, args, context, info) {
      return answerDataSource.getAnswerById(vote.answer_id).then(result => {
        if (result.error) {
          throw result.error;
        }

        return result.data;
      });
    },

    game(vote, args, context, info) {
      return gameDataSource.getGameById(vote.game_id).then(result => {
        if (result.error) {
          throw result.error;
        }

        return result.data;
      });
    }

  },
  Mutation: {}
};
var _default = rootResolvers;
exports.default = _default;