import { IAttachment, IExpenseRecord, IGroup, IReminder, IServiceRecord, IUser, IVehicle } from "../database"


type Permissions = {
    attachments: {
        dataType: IAttachment,
        action: 'view' | 'create' | 'delete'
    },
    vehicles: {
        dataType: IVehicle,
        action: 'view' | 'create' | 'update' | 'delete'
    },
    expenses: {
        dataType: IExpenseRecord,
        action: 'view' | 'create' | 'update' | 'delete'
    },
    services: {
        dataType: IServiceRecord,
        action: 'view' | 'create' | 'update' | 'delete'
    },
    reminders: {
        dataType: IReminder,
        action: 'view' | 'create' | 'update' | 'delete'
    },
    groups: {
        dataType: IGroup,
        action: 'create' | 'update' | 'delete' | 'users:invite' | 'users:update' | 'users:delete'
    }
}

type PermissionCheck<Key extends keyof Permissions> = 
    | ((user: IUser, data: Permissions[Key]['dataType']) => boolean)
    | boolean;


type PermissionGroup<Key extends keyof Permissions> = {
    [_ in Key]: Partial<{
        [__ in `${_}:${Permissions[_]['action']}`]: PermissionCheck<_>
    }>
}[Key]

type RolesWithPermissions = {
    [Role: string]: PermissionGroup<keyof Permissions>
}

const ROLES: RolesWithPermissions = {
    admin: {
        "attachments:create": true,
    }
}
