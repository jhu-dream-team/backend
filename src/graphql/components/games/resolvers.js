import * as gameDataSource from "./dataSource";
import * as voteDataSource from "../votes/dataSource";
import * as questionDataSource from "../questions/dataSource";
import * as profileDataSource from "../profiles/dataSource";

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
      return gameDataSource
        .getGamesPaginated(args.limit, args.after)
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
      return gameDataSource
        .createGame(args.name, args.question_categories, context.user.id)
        .then(result => {
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

export default rootResolvers;
