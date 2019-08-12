import * as freeSpinDataSource from "./dataSource";
import * as gameDataSource from "../games/dataSource";
import * as profileDataSource from "../profiles/dataSource";

const rootResolvers = {
  Query: {
    FreeSpin(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }
      return freeSpinDataSource.getFreeSpinsById(args.id).then(result => {
        if (result.error != null) {
          throw error;
        }
        return result.data;
      });
    },
    FreeSpins(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }
      return freeSpinDataSource
        .getFreeSpinsPaginated(args.limit, args.after)
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
  FreeSpin: {
    owner(freeSpin, args, context, info) {
      return profileDataSource.getUserById(freeSpin.owner_id).then(result => {
        if (result.error) {
          throw result.error;
        }
        return result.data;
      });
    },
    game(freeSpin, args, context, info) {
      return gameDataSource.getGameById(freeSpin.game_id).then(result => {
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
