import * as scoreDataSource from "./dataSource";
import * as answerDataSource from "../answers/dataSource";
import * as gameDataSource from "../games/dataSource";
import * as profileDataSource from "../profiles/dataSource";

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
      return scoreDataSource
        .getScoresPaginated(args.limit, args.after)
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
      return answerDataSource
        .getAnswerByScoreId(score.id, args.limit, args.after)
        .then(result => {
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
  Mutation: {}
};

export default rootResolvers;
