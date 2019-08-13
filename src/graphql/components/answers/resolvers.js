import * as answerDataSource from "./dataSource";
import * as scoreDataSource from "../scores/dataSource";
import * as voteDataSource from "../votes/dataSource";
import * as questionDataSource from "../questions/dataSource";
import * as profileDataSource from "../profiles/dataSource";
import * as gameDataSource from "../games/dataSource";
import { ResultStorage } from "firebase-functions/lib/providers/testLab";

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
    Answers(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }
      return answerDataSource
        .getAnswersPaginated(args.limit, args.after)
        .then(result => {
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
      return questionDataSource
        .getQuestionById(answer.question_id)
        .then(result => {
          if (result.error) {
            throw result.error;
          }
          return result.data;
        });
    },
    score(answer, args, context, info) {
      return scoreDataSource.getScoreById(answer.score_id).then(result => {
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
        if (ResultStorage.error) {
          throw result.error;
        }
        return result.data;
      });
    }
  },
  Mutation: {}
};

export default rootResolvers;
