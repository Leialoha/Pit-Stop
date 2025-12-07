// 
// Data Access Level
// 

import { Model } from "mongoose";
import { GroupUser as GroupUser, IUser, TempUser, UserLookup, UserModel, UserReference } from "../../database";
import { DalStep } from "./types";
import { queries } from "./pipeline";
import { ElementOf } from "../../types";

abstract class DalDatabase<T> {
    protected self: UserReference;
    protected pipeline: DalStep[] = [];
    protected model: Model<any>;

    protected onlyFirst: boolean = false;

    fetch(): Promise<T> {
        return this.model.aggregate(
            this.pipeline.flatMap(step => {
                const pipelineDef = queries[step.action];

                const pipeline = typeof pipelineDef === 'function'
                    ? pipelineDef(this.self, step.details as any)
                    : pipelineDef;

                return pipeline;
            })
        ) as unknown as Promise<T>;
    }

    first<R extends ElementOf<T>>(): Promise<R> {
        return this.fetch()
            .then(results => results ?? [])
            .then(results => results[0]);
    }

    then<R = T>(resolve?: (value: T) => R | PromiseLike<R>, reject?: (reason: any) => any): Promise<R> {
        return Promise.resolve(
            this.onlyFirst
            ? this.first() as Promise<T>
            : this.fetch()
        ).then(resolve, reject);
    }

    protected setModel(model: Model<any>) {
        if (!model) throw new Error("Model cannot be null or undefined.");
        if (!this.model) this.model = model;
    }
}


interface DalUsers<T = IUser> extends DalDatabase<T> {

    findUser(query: UserLookup): DalFetchedUsers<IUser>;
    findUsers(...queries: UserLookup[]): DalFetchedUsers<IUser[]>;

}

interface DalUsersWithSelf<T = IUser> extends DalUsers<T> {
    getSelf(): DalFetchedUsers<IUser>;
}

interface DalFinalizedUser<T = IUser> extends DalDatabase<T> {

    removeLookupDetails(): DalDatabase<T>;

}

interface DalMaskedDetailsUsers<T = IUser> extends DalFinalizedUser<T> {
    hideDetails(): DalFinalizedUser<T>;
}

interface DalFetchedUsers<T = IUser> extends DalMaskedDetailsUsers<T> {

    asGroupMember(): DalFinalizedUser<GroupUser>;
    asTempUser(): DalFinalizedUser<TempUser>;

    createFake(): DalFetchedUsers<T>;
    maskDetails(): DalMaskedDetailsUsers<T>;

}

interface DalGeneric<T = any> extends DalUsers<T> { }
interface DalGenericWithSelf<T = any> extends DalGeneric<T>, DalUsersWithSelf<T> { }

interface DalGenericWithoutSelf<T = any> extends DalGeneric<T> {
    withSelf(self: UserReference): DalGenericWithSelf<IUser[]>;
}

interface DalDatabaseAccess<T = any> extends DalGenericWithSelf<T>, DalGenericWithoutSelf<T> { }

class DatabaseAccess<T = any> extends DalDatabase<T> implements DalDatabaseAccess<T>, DalFetchedUsers<T> {

    withSelf(self: UserReference) {
        this.setModel(UserModel);
        this.onlyFirst = true;
        this.self = self;
        return this as DalGenericWithSelf<IUser[]>;
    }

    asGroupMember() {
        return this as DalFinalizedUser<GroupUser>;
    }

    asTempUser( phone = this.self?.phone) {
        this.pipeline.push({
            action: 'users.getTempUser',
            details: { phone }
        });

        return this as DalFinalizedUser<TempUser>;
    }


    getSelf() {
        this.pipeline.push({
            action: 'users.lookupSelf'
        });

        return this as DalFetchedUsers<IUser>;
    }

    findUser(query: UserLookup) {
        this.setModel(UserModel);
        this.onlyFirst = true;

        this.pipeline.push({
            action: 'users.lookupUser',
            details: query
        })

        return this as DalFetchedUsers<IUser>;
    }

    findUsers(...queries: UserLookup[]) {
        this.setModel(UserModel);
        this.pipeline.push({
            action: 'users.lookupUsers',
            details: queries
        });

        return this as DalFetchedUsers<IUser[]>;
    }

    createFake(): DalFetchedUsers<T> {
        this.pipeline.push({
            action: 'users.makeFake'
        });

        return this;
    }

    maskDetails(): DalMaskedDetailsUsers<T> {
        this.pipeline.push({
            action: 'users.maskDetails'
        });
        
        return this;
    }

    hideDetails(): DalFinalizedUser<T> {
        this.pipeline.push({
            action: 'users.hideDetails'
        });
        
        return this;
    }

    removeLookupDetails(): DalDatabase<T> {
        this.pipeline.push({
            action: 'users.removeLookupDetails'
        });

        return this;
    }

}


export function DatabaseLookup() {
    return new DatabaseAccess() as DalGenericWithoutSelf;
}
