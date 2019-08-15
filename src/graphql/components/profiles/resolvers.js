import * as profileDataSource from "./dataSource";
import * as scoreDataSource from "../scores/dataSource";
import * as gameDataSource from "../games/dataSource";
import * as questionCategoryDataSource from "../questionCategories/dataSource";

const rootResolvers = {
  Query: {
    Profile(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error(
          "Unable to grab your user id from your profile. Please contact your adminstrator for help."
        );
      }
      return profileDataSource.getUserById(context.user.id).then(result => {
        if (result.error) {
          throw result.error;
        }
        return result.data;
      });
    }
  },
  Profile: {
    games(profile, args, context, info) {
      return gameDataSource
        .getGamesPaginated(args.limit, args.after, context.user.id)
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
    },
    question_categories(profile, args, context, info) {
      return questionCategoryDataSource
        .getQuestionCategoriesPaginated(args.limit, args.after, context.user.id)
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
    },
    scores(profile, args, context, info) {
      return scoreDataSource
        .getScoresByProfileId(profile.id, args.limit, args.after)
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
  Mutation: {
    createProfile(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }
      return profileDataSource
        .createProfile(
          context.user.id,
          args.firstName,
          args.lastName,
          args.email
        )
        .then(result => {
          if (result.error) {
            throw result.error;
          }
          return result.data;
        });
    },
    updateProfile(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }
      return profileDataSource.updateProfile(context.user.id, context.ip, args);
    },
    updateDeviceToken(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }
      return profileDataSource.updateDeviceToken(
        context.user.id,
        args.deviceToken
      );
    },
    disableProfile(obj, args, context, info) {
      if (!context.user || !context.user.id) {
        throw new Error("Unauthorized");
      }
      return profileDataSource.disableProfile(context.user.id);
    }
  }
};

export default rootResolvers;
