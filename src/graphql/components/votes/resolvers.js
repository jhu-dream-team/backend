import * as voteDataSource from "./dataSource";
import * as answerDataSource from "../answers/dataSource";
import * as gameDataSource from "../games/dataSource";
import * as profileDataSource from "../profiles/dataSource";

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
      return voteDataSource
        .getVotesPaginated(args.limit, args.after)
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

export default rootResolvers;
