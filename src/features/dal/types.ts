import { PipelineStage } from "mongoose"
import { GroupUser, UserLookup, UserReference } from "../../database"
import { Intersect } from "../../types"

type DalQueries = {
    users: {
        details?: UserLookup
        actions: {
            single: 'lookupUser' | 'getTempUser',
            bulk: 'lookupUsers',
            none: 'lookupSelf' | 'makeFake' | 'maskDetails' | 'hideDetails' | 'removeLookupDetails',
        }
    },
    group: {
        details?: GroupUser
        actions: {
            single: 'ignored'
        }
    }
}

type ExtractActions<Group extends keyof DalQueries> =
    | DalQueries[Group]['actions'];

type ExtractRef<Group extends keyof DalQueries, Lookup> =
    | ExtractActions<Group>[Extract<Lookup, keyof ExtractActions<Group>>];

type ExtractActionKeys<Group extends keyof DalQueries, Lookup = 'single' | 'bulk' | 'none'> =
    | Extract<{ [G in Group]: ExtractRef<G, Lookup> }[Group], string>

type DalEntry<Group extends keyof DalQueries, Lookup = 'single' | 'bulk' | 'none'> =
    | `${Group}.${ExtractActionKeys<Group, Lookup>}`

type DalActions<Lookup = 'single' | 'bulk' | 'none'> =
    | { [Group in keyof DalQueries]: DalEntry<Group, Lookup> }[keyof DalQueries];

type IsContextAction<ActionKey extends DalEntry<Group>, Group extends keyof DalQueries> =
    | ActionKey extends DalActions<'single' | 'bulk'> ? true : false;

type IsBulkAction<ActionKey extends DalEntry<Group>, Group extends keyof DalQueries> =
    | ActionKey extends DalActions<'bulk'> ? true : false;

type ActionDetail<ActionKey extends DalEntry<Group>, Group extends keyof DalQueries> =
    | IsContextAction<ActionKey, Group> extends true
        ? IsBulkAction<ActionKey, Group> extends true
            ? (DalQueries[Group]['details'])[]
            : (DalQueries[Group]['details'])
        : unknown;

type DalStepValue<ActionKey extends DalEntry<Group>, Group extends keyof DalQueries> =
    | IsContextAction<ActionKey, Group> extends true
    ? { details: ActionDetail<ActionKey, Group> }
    : { details?: unknown };

type DalPipelineValue<ActionKey extends DalEntry<Group>, Group extends keyof DalQueries> =
    | ((self: UserReference | null, detail: ActionDetail<ActionKey, Group>) => PipelineStage[])
    | PipelineStage[];

export type DalPipelines = Intersect<{
    [Group in keyof DalQueries]: {
        [ActionKey in DalEntry<Group>]: DalPipelineValue<ActionKey, Group>;
    }
}[keyof DalQueries]>;

export type DalStep = {
    [Group in keyof DalQueries]: {
        [ActionKey in DalEntry<Group>]: { action: ActionKey } & DalStepValue<ActionKey, Group>;
    }[DalEntry<Group>]
}[keyof DalQueries];
