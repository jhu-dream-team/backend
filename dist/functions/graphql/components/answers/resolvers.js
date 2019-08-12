"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var answerDataSource = _interopRequireWildcard(require("./dataSource"));

var voteDataSource = _interopRequireWildcard(require("../votes/dataSource"));

var questionDataSource = _interopRequireWildcard(require("../questions/dataSource"));

var profileDataSource = _interopRequireWildcard(require("../profiles/dataSource"));

var gameDataSource = _interopRequireWildcard(require("../games/dataSource"));

var _testLab = require("firebase-functions/lib/providers/testLab");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

const rootResolvers = {
  Query: {
    Answer(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }

      return answerDataSource.getAnswerById(args.id).then(result => {
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

      return answerDataSource.getAnswersPaginated(args.limit, args.after).then(result => {
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
  Answer: {
    owner(answer, args, context, info) {
      return profileDataSource.getUserById(answer.owner_id).then(result => {
        if (result.error) {
          throw result.error;
        }

        return result.data;
      });
    },

    question(answer, args, context, info) {
      return questionDataSource.getQuestionById(answer.question_id).then(result => {
        if (result.error) {
          throw result.error;
        }

        return result.data;
      });
    },

    game(answer, args, context, info) {
      return gameDataSource.getGameById(answer.game_id).then(result => {
        if (result.error) {
          throw result.error;
        }

        return result.data;
      });
    },

    votes(answer, args, context, info) {
      return voteDataSource.getVotesByAnswer(answer.id).then(result => {
        if (_testLab.ResultStorage.error) {
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